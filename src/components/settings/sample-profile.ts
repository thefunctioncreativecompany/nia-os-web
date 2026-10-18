// Sample data from the Figma frame, used until the screen is connected to Supabase.

export type LinkedAccount = {
  provider: "google" | "apple";
  email: string;
  canDisconnect: boolean;
};

export type ProfileSettings = {
  fullName: string;
  role: string;
  email: string;
  phone: string;
  bio: string;
  avatarUrl: string | null;
  assistantName: string;
  assistantTraits: string[];
  communicationStyle: string;
  aiSuggestions: boolean;
  linkedAccounts: LinkedAccount[];
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

export const sampleProfile: ProfileSettings = {
  fullName: "Kai Cenat",
  role: "Executive Producer",
  email: "kai@noscore.io",
  phone: "+1 (310) 555-0142",
  bio: "Executive Producer with 15 years in independent film...",
  avatarUrl: null,
  assistantName: "Kai",
  assistantTraits: ["Professional", "Concise", "Detail-oriented", "Proactive", "Film-savvy"],
  communicationStyle: "Professional & Concise",
  aiSuggestions: true,
  linkedAccounts: [
    { provider: "google", email: "kai@gmail.com", canDisconnect: true },
    { provider: "apple", email: "kai@icloud.com", canDisconnect: false },
  ],
};
