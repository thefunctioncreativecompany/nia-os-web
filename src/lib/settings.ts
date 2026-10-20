// Settings shapes and choices shared by the server loaders and the client forms.
// Column names mirror supabase/migrations/*_profiles_settings_workspaces.sql.

export type ProfileSettings = {
  fullName: string;
  role: string;
  phone: string;
  bio: string;
  avatarUrl: string | null;
  assistantName: string;
  assistantTraits: string[];
  communicationStyle: string;
  aiSuggestions: boolean;
};

export type GeneralSettings = {
  workspaceId: string | null;
  workspaceName: string;
  defaultView: "grid" | "list";
  language: string;
  // null = use the browser's time zone.
  timeZone: string | null;
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyDigest: boolean;
  autoSaveInterval: number;
  versionHistory: boolean;
};

export const TRAIT_PRESETS = [
  "Professional",
  "Concise",
  "Detail-oriented",
  "Proactive",
  "Film-savvy",
  "Friendly",
  "Creative",
  "Direct",
];

export const COMMUNICATION_STYLES = [
  "Professional & Concise",
  "Friendly & Conversational",
  "Detailed & Thorough",
  "Direct & Brief",
];

export const DEFAULT_VIEWS = [
  { value: "grid", label: "Grid view" },
  { value: "list", label: "List view" },
] as const;

// Only languages the app is actually written in.
export const LANGUAGES = [
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
];

export const AUTO_SAVE_INTERVALS = [1, 5, 10, 15, 30];
