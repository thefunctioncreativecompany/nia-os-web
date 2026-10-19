import { createServerClient } from "@supabase/ssr";
import type { JwtPayload } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

// Pages that only signed-in users can open.
const PROTECTED_PATHS = ["/home", "/projects", "/templates", "/settings", "/onboarding"];
// Pages new users can't reach until they finish onboarding.
const APP_PATHS = ["/home", "/projects", "/templates", "/settings"];

const matches = (pathname: string, paths: string[]) =>
  paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

// Refreshes the user's login session (stored in cookies) before each page loads,
// sends signed-out visitors away from protected pages, and sends new users to onboarding.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // Supabase isn't configured yet, so let the page load normally.
  if (!url || !key) {
    return response;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers ?? {}).forEach(([key, value]) =>
          response.headers.set(key, value),
        );
      },
    },
  });

  // Don't add code between createServerClient and this call.
  const { data } = await supabase.auth.getClaims();

  const { pathname, search } = request.nextUrl;
  const redirectTo = (path: string, query = "") => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = query;
    const redirect = NextResponse.redirect(url);
    // Keep any refreshed session cookies.
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  };

  // The bare domain has no page of its own: send people to the right place.
  if (pathname === "/") {
    if (!data?.claims) return redirectTo("/login");
    return redirectTo((await isOnboarded(supabase, data.claims)) ? "/home" : "/onboarding/source");
  }

  if (!data?.claims && matches(pathname, PROTECTED_PATHS)) {
    // Remember where they were going, so sign-in can send them back.
    return redirectTo("/login", `?next=${encodeURIComponent(pathname + search)}`);
  }

  if (data?.claims && matches(pathname, APP_PATHS) && !(await isOnboarded(supabase, data.claims))) {
    return redirectTo("/onboarding/source");
  }

  return response;
}

// Finishing onboarding sets `onboarded` in the user's metadata, which rides along in
// the sign-in token, so most requests need no lookup. Tokens issued before that
// (up to an hour old) fall back to the profile row.
async function isOnboarded(
  supabase: ReturnType<typeof createServerClient>,
  claims: JwtPayload,
) {
  if (claims.user_metadata?.onboarded === true) return true;
  const { data } = await supabase
    .from("profiles")
    .select("onboarding_completed_at")
    .eq("id", claims.sub)
    .maybeSingle();
  // No profile row to check (e.g. schema not set up yet): don't lock the user out.
  return !data || data.onboarding_completed_at !== null;
}
