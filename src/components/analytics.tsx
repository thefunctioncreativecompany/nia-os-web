"use client";

import { useEffect } from "react";

// Product analytics with PostHog (Ika, 2026-11-11). The library loads after the page has shown, so
// no page waits for it, and nothing runs until NEXT_PUBLIC_POSTHOG_KEY is set (.env.local and
// Vercel; it's PostHog's public project key, made for the browser). Page views are recorded on
// every route change (`defaults`). Signed-in people are known by their account id only, never
// their name or email; logging out starts a fresh anonymous visitor.
export function Analytics() {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;
    let stop: (() => void) | undefined;
    let cancelled = false;
    void (async () => {
      const [{ default: posthog }, { createClient }] = await Promise.all([import("posthog-js"), import("@/lib/supabase/client")]);
      if (cancelled) return;
      posthog.init(key, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
        defaults: "2026-08-30",
        person_profiles: "identified_only",
      });
      const { data } = createClient().auth.onAuthStateChange((event, session) => {
        if (session?.user) {
          if (posthog.get_distinct_id() !== session.user.id) posthog.identify(session.user.id);
        } else if (event === "SIGNED_OUT") posthog.reset();
      });
      stop = () => data.subscription.unsubscribe();
    })();
    return () => {
      cancelled = true;
      stop?.();
    };
  }, []);
  return null;
}
