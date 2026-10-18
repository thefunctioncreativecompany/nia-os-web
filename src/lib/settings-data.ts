import "server-only";
import { redirect } from "next/navigation";
import type { UserIdentity } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import type { GeneralSettings, ProfileSettings } from "@/lib/settings";

// Loaders for the settings tabs. They read cookies, so call them inside <Suspense>.
// Row Level Security limits every query to the signed-in user's own rows.

async function requireUser() {
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
      "full_name, role, phone, bio, avatar_url, assistant_name, assistant_traits, communication_style, ai_suggestions",
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
      role: data.role,
      phone: data.phone,
      bio: data.bio,
      avatarUrl: data.avatar_url,
      assistantName: data.assistant_name,
      assistantTraits: data.assistant_traits,
      communicationStyle: data.communication_style,
      aiSuggestions: data.ai_suggestions,
    },
  };
}

export async function getGeneralSettings(): Promise<{
  userId: string;
  settings: GeneralSettings;
}> {
  const { supabase, user } = await requireUser();
  const [settingsResult, workspaceResult] = await Promise.all([
    supabase
      .from("user_settings")
      .select(
        "default_view, language, time_zone, email_notifications, push_notifications, weekly_digest, auto_save_interval, version_history",
      )
      .eq("user_id", user.id)
      .single(),
    // The workspace this user owns (created in onboarding or on first save here).
    supabase
      .from("workspaces")
      .select("id, name")
      .eq("owner_id", user.id)
      .order("created_at")
      .limit(1)
      .maybeSingle(),
  ]);
  if (settingsResult.error) {
    throw new Error(`Couldn't load your settings: ${settingsResult.error.message}`);
  }
  if (workspaceResult.error) {
    throw new Error(`Couldn't load your workspace: ${workspaceResult.error.message}`);
  }

  const s = settingsResult.data;
  return {
    userId: user.id,
    settings: {
      workspaceId: workspaceResult.data?.id ?? null,
      workspaceName: workspaceResult.data?.name ?? "",
      defaultView: s.default_view,
      language: s.language,
      timeZone: s.time_zone,
      emailNotifications: s.email_notifications,
      pushNotifications: s.push_notifications,
      weeklyDigest: s.weekly_digest,
      autoSaveInterval: s.auto_save_interval,
      versionHistory: s.version_history,
    },
  };
}
