import type { SupabaseClient, User } from "@supabase/supabase-js";

// The signed-in person in the browser, from the session it already holds: no trip to Supabase
// (getUser() asks Supabase's servers every time). For showing and filtering only; the database's
// access rules are what keep each account's data private.
export async function currentUser(supabase: SupabaseClient): Promise<User | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user ?? null;
}
