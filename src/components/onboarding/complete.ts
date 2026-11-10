import type { SupabaseClient } from "@supabase/supabase-js";

// Marks onboarding complete, at the end of the last step (or when it's skipped).
export async function completeOnboarding(supabase: SupabaseClient, userId: string) {
  const { error } = await supabase.from("profiles").update({ onboarding_completed_at: new Date().toISOString() }).eq("id", userId);
  if (error) throw error;
  // The app checks these flags in the sign-in token; refresh it so the new token has them.
  // `tour_pending`: a new account gets the welcome tour on its first visit to Home.
  const { error: userError } = await supabase.auth.updateUser({ data: { onboarded: true, tour_pending: true } });
  if (userError) throw userError;
  await supabase.auth.refreshSession();
}
