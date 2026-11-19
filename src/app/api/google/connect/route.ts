import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { STATE_COOKIE, consentUrl, googleConfigured, withParam } from "@/lib/google";
import { safeNextPath } from "@/lib/safe-next-path";
import { createClient } from "@/lib/supabase/server";

// Connect Google Calendar (docs/MEETINGS_SPEC.md, step 3): sends the signed-in person to Google
// to agree, with a one-time check value (kept in a cookie) that the answer must bring back, and
// where to return afterwards (the project they were on).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const next = safeNextPath(searchParams.get("next"), "/projects", origin);
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return NextResponse.redirect(`${origin}/login`);
  if (!googleConfigured()) return NextResponse.redirect(`${origin}${withParam(next, "google", "off")}`);

  const state = randomBytes(24).toString("base64url");
  (await cookies()).set(STATE_COOKIE, `${state}|${next}`, { httpOnly: true, secure: origin.startsWith("https://"), sameSite: "lax", path: "/api/google", maxAge: 600 });
  return NextResponse.redirect(consentUrl(origin, state, typeof data.claims.email === "string" ? data.claims.email : undefined));
}
