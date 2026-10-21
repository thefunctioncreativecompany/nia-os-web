"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { currentUser } from "@/lib/supabase/current-user";
import { clearTemplateHistory, loadTemplateProfile, recordTemplateEvent, setRole as saveRole } from "./events";
import type { TemplateEventType, UserTemplateProfile } from "./types";

// What Nia knows for "Suggested for you" (TEMPLATES_BUILD.md §4): the person's role (their
// onboarding profession) and the last 90 days of templates they opened, used and searched.
// Changes show at once and save in the background; a failed save never blocks the page.
export function useTemplateProfile() {
  const [profile, setProfile] = useState<UserTemplateProfile>({ role: null, events: [] });
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let live = true;
    void (async () => {
      const supabase = createClient();
      const id = (await currentUser(supabase))?.id ?? null;
      const loaded = id ? await loadTemplateProfile(supabase, id) : { role: null, events: [] };
      if (!live) return;
      setUserId(id);
      // Keep anything recorded while this was loading (a preview opened from a link).
      setProfile((p) => ({ role: loaded.role, events: [...p.events, ...loaded.events] }));
      setReady(true);
    })();
    return () => {
      live = false;
    };
  }, []);

  const record = (code: string, type: TemplateEventType, query?: string) => {
    if (type !== "search") setProfile((p) => ({ ...p, events: [{ code, type, at: Date.now() }, ...p.events] }));
    // The database fills in who it was from the sign-in, so this needn't wait for the profile.
    void recordTemplateEvent(createClient(), { code, type, query: query ?? null });
  };

  const setRole = (role: string | null) => {
    setProfile((p) => ({ ...p, role }));
    if (userId) void saveRole(createClient(), userId, role).catch(() => {});
  };

  const reset = () => {
    setProfile((p) => ({ ...p, events: [] }));
    if (userId) void clearTemplateHistory(createClient(), userId).catch(() => {});
  };

  return { profile, ready, record, setRole, reset };
}
