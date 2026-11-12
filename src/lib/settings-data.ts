import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import type { UserIdentity } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import type { GeneralSettings, ProfileSettings } from "@/lib/settings";

// Loaders for the settings tabs. They read cookies, so call them inside <Suspense>.
// Row Level Security limits every query to the signed-in user's own rows.

async function requireUser() {
  // Supabase checks token expiry with Date.now(), so keep this out of the prerendered shell.
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function getProfileSettings(): Promise<{
  userId: string;
  email: string;
  identities: UserIdentity[];
  profile: ProfileSettings;
}> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "full_name, role, phone, bio, avatar_url",
    )
    .eq("id", user.id)
    .single();
  if (error) throw new Error(`Couldn't load your profile: ${error.message}`);

  return {
    userId: user.id,
    email: user.email ?? "",
    identities: user.identities ?? [],
    profile: {
      fullName: data.full_name,
      preferredName: typeof user.user_metadata?.preferred_name === "string" ? user.user_metadata.preferred_name : "",
      role: data.role,
      phone: data.phone,
      bio: data.bio,
      avatarUrl: data.avatar_url,
    },
  };
}

export async function getGeneralSettings(): Promise<{
  userId: string;
  settings: GeneralSettings;
}> {
  const { supabase, user } = await requireUser();
  // The workspace this user owns (created in onboarding or on first save here).
  const { data, error } = await supabase
    .from("workspaces")
    .select("id, name")
    .eq("owner_id", user.id)
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Couldn't load your workspace: ${error.message}`);

  return {
    userId: user.id,
    settings: { workspaceId: data?.id ?? null, workspaceName: data?.name ?? "" },
  };
}
