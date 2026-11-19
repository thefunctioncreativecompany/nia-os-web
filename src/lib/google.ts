import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";

// Google Calendar and Meet for a producer (docs/MEETINGS_SPEC.md, step 3). Nia's own Google
// connection, separate from signing in with Google: the person agrees once to let Nia create
// events on calendars they own (with a Meet link and invites) and see when people are busy. Google
// gives a refresh key, encrypted here (AES-256-GCM with GOOGLE_TOKEN_KEY) before it's stored in
// `google_connections`, which only the server reads (20261122000000_google_calendar.sql).
// Settings live in .env.local and Vercel only: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET (Google Cloud
// > Credentials > the "Nia calendar" web client) and GOOGLE_TOKEN_KEY (32 random bytes, base64).

export const GOOGLE_SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/calendar.events.owned",
  "https://www.googleapis.com/auth/calendar.freebusy",
];

/** The cookie holding the one-time check value and the return path while someone is at Google. */
export const STATE_COOKIE = "nia_google_state";

/** A path within Nia with one more search parameter ("/projects/1?google=connected"). */
export function withParam(path: string, key: string, value: string) {
  const url = new URL(path, "https://nia.local");
  url.searchParams.set(key, value);
  return `${url.pathname}${url.search}${url.hash}`;
}

export const googleConfigured = () => !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_TOKEN_KEY);

const key = () => {
  const k = Buffer.from(process.env.GOOGLE_TOKEN_KEY ?? "", "base64");
  if (k.length !== 32) throw new Error("GOOGLE_TOKEN_KEY must be 32 bytes, base64");
  return k;
};

/** "iv.tag.text", each base64. */
export function seal(text: string, k = key()) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", k, iv);
  const body = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), body].map((b) => b.toString("base64")).join(".");
}

export function unseal(sealed: string, k = key()) {
  const [iv, tag, body] = sealed.split(".").map((p) => Buffer.from(p, "base64"));
  const decipher = createDecipheriv("aes-256-gcm", k, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(body), decipher.final()]).toString("utf8");
}

export const redirectUri = (origin: string) => `${origin}/api/google/callback`;

export function consentUrl(origin: string, state: string, loginHint?: string) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri(origin),
    response_type: "code",
    scope: GOOGLE_SCOPES.join(" "),
    access_type: "offline",
    // Always ask, so Google hands over a refresh key every time someone connects.
    prompt: "consent",
    include_granted_scopes: "true",
    state,
    ...(loginHint ? { login_hint: loginHint } : {}),
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

type TokenAnswer = { access_token: string; expires_in: number; refresh_token?: string; scope?: string; id_token?: string };

async function tokenRequest(body: Record<string, string>): Promise<TokenAnswer> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID!, client_secret: process.env.GOOGLE_CLIENT_SECRET!, ...body }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new GoogleError(res.status, typeof data.error === "string" ? data.error : "token_failed");
  return data as TokenAnswer;
}

export class GoogleError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(`Google: ${code}`);
  }
}

/** The email in Google's signed answer (it came straight from Google over HTTPS, so it's read, not re-checked). */
function emailFromIdToken(idToken: string | undefined) {
  try {
    const payload = JSON.parse(Buffer.from((idToken ?? "").split(".")[1] ?? "", "base64url").toString("utf8"));
    return typeof payload.email === "string" ? payload.email : "";
  } catch {
    return "";
  }
}

/** Swaps the code Google sent back for keys, and saves the connection. */
export async function connect(userId: string, code: string, origin: string) {
  const answer = await tokenRequest({ code, grant_type: "authorization_code", redirect_uri: redirectUri(origin) });
  if (!answer.refresh_token) throw new GoogleError(400, "no_refresh_token");
  const granted = answer.scope ?? "";
  if (!granted.includes("calendar.events")) throw new GoogleError(400, "calendar_not_allowed");
  const admin = createAdminClient();
  if (!admin) throw new Error("SUPABASE_SECRET_KEY isn't set");
  const { error } = await admin.from("google_connections").upsert({
    user_id: userId,
    google_email: emailFromIdToken(answer.id_token).slice(0, 320) || "Google account",
    scopes: granted.slice(0, 1000),
    refresh_token_enc: seal(answer.refresh_token),
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}

/** A fresh access key for the person, or null when they haven't connected (or Google said no). */
export async function accessToken(userId: string): Promise<string | null> {
  const admin = createAdminClient();
  if (!admin) return null;
  const { data } = await admin.from("google_connections").select("refresh_token_enc").eq("user_id", userId).maybeSingle();
  if (!data) return null;
  try {
    return (await tokenRequest({ grant_type: "refresh_token", refresh_token: unseal(data.refresh_token_enc) })).access_token;
  } catch (e) {
    // Access taken back at Google (or the key no longer works): forget the connection.
    if (e instanceof GoogleError && e.code === "invalid_grant") await admin.from("google_connections").delete().eq("user_id", userId);
    return null;
  }
}

/** Forgets the connection here and tells Google to take Nia's access back. */
export async function disconnect(userId: string) {
  const admin = createAdminClient();
  if (!admin) return;
  const { data } = await admin.from("google_connections").select("refresh_token_enc").eq("user_id", userId).maybeSingle();
  if (data) {
    try {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(unseal(data.refresh_token_enc))}`, { method: "POST" });
    } catch {
      // Gone here either way; Google drops unused keys in time.
    }
  }
  await admin.from("google_connections").delete().eq("user_id", userId);
}

async function calendar<T>(token: string, path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`https://www.googleapis.com/calendar/v3${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...init.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new GoogleError(res.status, data?.error?.status ?? data?.error?.message ?? "calendar_failed");
  return data as T;
}

/** Who's busy between start and end: the organiser ("primary") and each email Google lets them see. */
export async function busy(token: string, start: string, end: string, emails: string[]) {
  const ids = ["primary", ...emails];
  const data = await calendar<{ calendars: Record<string, { busy?: unknown[]; errors?: unknown[] }> }>(token, "/freeBusy", {
    method: "POST",
    body: JSON.stringify({ timeMin: start, timeMax: end, items: ids.map((id) => ({ id })) }),
  });
  return ids.filter((id) => (data.calendars?.[id]?.busy?.length ?? 0) > 0);
}

export type NewEvent = { title: string; description: string; start: string; end: string; timeZone: string; attendees: string[]; requestId: string };

/** Creates the Calendar event with a Google Meet link and sends the invites. */
export async function createMeetEvent(token: string, e: NewEvent) {
  const data = await calendar<{ id: string; hangoutLink?: string; htmlLink?: string; conferenceData?: { entryPoints?: { entryPointType: string; uri: string }[] } }>(
    token,
    "/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all",
    {
      method: "POST",
      body: JSON.stringify({
        summary: e.title,
        description: e.description,
        start: { dateTime: e.start, timeZone: e.timeZone },
        end: { dateTime: e.end, timeZone: e.timeZone },
        attendees: e.attendees.map((email) => ({ email })),
        conferenceData: { createRequest: { requestId: e.requestId, conferenceSolutionKey: { type: "hangoutsMeet" } } },
      }),
    },
  );
  const link = data.hangoutLink ?? data.conferenceData?.entryPoints?.find((p) => p.entryPointType === "video")?.uri ?? null;
  return { eventId: data.id, meetLink: link && /^https:\/\/meet\.google\.com\/[a-z0-9-]+$/.test(link) ? link : null };
}
