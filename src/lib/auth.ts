import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
};

// Returns the signed-in user, or sends them to the sign-in page.
// `cache` means it only asks Supabase once per page load, even if several
// components call it. Must be called inside a <Suspense> boundary because it
// reads cookies.
export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Name and photo live in `profiles` (edited in Settings → Profile). Fall back to
  // what the sign-in provider gave us if the row can't be read.
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email ?? "",
    name: profile?.full_name || user.user_metadata?.full_name || "",
    avatarUrl: profile?.avatar_url ?? user.user_metadata?.avatar_url ?? null,
  };
});

