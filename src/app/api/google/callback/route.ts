import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { STATE_COOKIE, connect, withParam } from "@/lib/google";
import { safeNextPath } from "@/lib/safe-next-path";
import { createClient } from "@/lib/supabase/server";

// Google's answer after Connect Google Calendar (connect/route.ts): the check value must match the
// one sent, the person must still be signed in; then the code is swapped for keys and saved
// (lib/google.ts), and they go back to where they were with ?google=connected (or why not).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const jar = await cookies();
  const [state, savedNext] = (jar.get(STATE_COOKIE)?.value ?? "").split("|");
  jar.delete({ name: STATE_COOKIE, path: "/api/google" });
  const next = safeNextPath(savedNext, "/projects", origin);
  const back = (result: string) => NextResponse.redirect(`${origin}${withParam(next, "google", result)}`);

  if (!state || searchParams.get("state") !== state) return back("failed");
  if (searchParams.get("error")) return back("denied");
  const code = searchParams.get("code");
  if (!code) return back("failed");

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) return NextResponse.redirect(`${origin}/login`);
  try {
    await connect(data.claims.sub, code, origin);
  } catch (e) {
    console.error("Google connect failed", e instanceof Error ? e.message : e);
    return back(e instanceof Error && e.message.includes("calendar_not_allowed") ? "calendar" : "failed");
  }
  return back("connected");
}
