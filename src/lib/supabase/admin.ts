import "server-only";

import { createClient } from "@supabase/supabase-js";

// Supabase with its server-only secret key (SUPABASE_SECRET_KEY: Supabase > Project Settings >
// API Keys > Secret keys; in .env.local and Vercel, never in the browser). It passes every access
// rule, so use it only after the database has said yes (e.g. a share link's check) and only for
// the narrow job at hand. Null when the key isn't set: callers carry on without it.
export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
