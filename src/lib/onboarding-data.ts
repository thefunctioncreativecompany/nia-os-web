import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { createClient } from "@/lib/supabase/server";

// Loaders for the onboarding steps. They read cookies, so call them inside <Suspense>.
// Row Level Security limits every query to the signed-in user's own rows.

export type OnboardingProfile = {
  userId: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  username: string | null;
  profession: string | null;
  heardAbout: string | null;
  followedCreators: string[];
};

const requireUser = cache(async () => {
  // Supabase checks token expiry with Date.now(), so keep this out of the prerendered shell.
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
});

export const getOnboardingProfile = cache(async (): Promise<OnboardingProfile> => {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, username, profession, heard_about, followed_creators")
    .eq("id", user.id)
    .single();
  if (error) throw new Error(`Couldn't load your profile: ${error.message}`);

  return {
    userId: user.id,
    email: user.email ?? "",
    fullName: data.full_name || user.user_metadata?.full_name || "",
    avatarUrl: data.avatar_url,
    username: data.username,
    profession: data.profession,
    heardAbout: data.heard_about,
    followedCreators: data.followed_creators,
  };
});

export type OnboardingWorkspace = {
  userId: string;
  workspaceId: string | null;
  name: string;
  role: string;
  invites: string[];
};

// The workspace this user owns, with their role in it and pending invites.
export async function getOnboardingWorkspace(): Promise<OnboardingWorkspace> {
  const { supabase, user } = await requireUser();
  const { data: workspace, error } = await supabase
    .from("workspaces")
    .select("id, name, workspace_members(user_id, role), workspace_invites(email)")
    .eq("owner_id", user.id)
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Couldn't load your workspace: ${error.message}`);

  const profile = await getOnboardingProfile();
  const membership = workspace?.workspace_members.find((m) => m.user_id === user.id);

  return {
    userId: user.id,
    workspaceId: workspace?.id ?? null,
    name: workspace?.name ?? "",
    // Suggest their profession until they've set a role here.
    role: membership?.role || profile.profession || "",
    invites: workspace?.workspace_invites.map((i) => i.email) ?? [],
  };
}
