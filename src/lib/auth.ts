import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { firstNameOf } from "@/lib/first-name";
import { getSession } from "@/lib/supabase/session";

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  /** What to call them in a greeting (first-name.ts). */
  firstName: string;
  avatarUrl: string | null;
  /** From onboarding, e.g. "Line Producer" (what's new is weighted by it). */
  profession: string | null;
};

// Returns the signed-in user, or sends them to the sign-in page.
// `cache` means it only runs once per page load, even if several
// components call it. Must be called inside a <Suspense> boundary because it
// reads cookies.
export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  const { supabase, user } = await getSession();

  if (!user) {
    redirect("/login");
  }

  // Name and photo live in `profiles` (edited in Settings → Profile). Fall back to
  // what the sign-in provider gave us if the row can't be read.
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, profession")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email,
    name: profile?.full_name || user.metadata.full_name || "",
    firstName: firstNameOf({ preferred: user.metadata.preferred_name, given: user.metadata.given_name, full: profile?.full_name || user.metadata.full_name }),
    avatarUrl: profile?.avatar_url ?? user.metadata.avatar_url ?? null,
    profession: profile?.profession ?? null,
  };
});

