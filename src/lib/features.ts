// On/off switches for parts of Nia that aren't open yet. Flip one to true when that part launches
// (it goes live with the next deploy). Parked features were removed on 2026-11-02 (audit); they
// can be restored from the git tag parked-2026-11-02.
export const features = {
  // Explore opens to everyone in February 2027 (EXPLORE_SPEC.md). Until then only people with early
  // access (a confirmed email invite or an invite code) can use it; the rest see coming soon.
  // When flipping this on, also make has_explore_access() return true in Supabase.
  exploreUnlocked: false,
} as const;
