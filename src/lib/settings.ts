// Settings shapes shared by the server loaders and the client forms.
// Column names mirror supabase/migrations/*_profiles_settings_workspaces.sql. Only settings that
// work are here (Ika, 2026-11-12); the removed ones are in git tag parked-2026-11-12-settings, and
// their columns (user_settings, profiles.assistant_*) are still in the database.

export type ProfileSettings = {
  fullName: string;
  /** "What should we call you?": the name greetings use (kept on the account, first-name.ts). */
  preferredName: string;
  role: string;
  phone: string;
  bio: string;
  avatarUrl: string | null;
};

export type GeneralSettings = {
  workspaceId: string | null;
  workspaceName: string;
};
