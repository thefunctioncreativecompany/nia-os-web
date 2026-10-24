// On/off switches for parts of Nia that aren't open yet. Flip one to true when that part launches
// (it goes live with the next deploy).
export const features = {
  // Explore opens to everyone in February 2027 (EXPLORE_SPEC.md). Until then only people with early
  // access (a confirmed email invite or an invite code) can use it; the rest see coming soon.
  // When flipping this on, also make has_explore_access() return true in Supabase.
  exploreUnlocked: false,
  // Marketplace has no launch date yet (MARKETPLACE_SPEC.md). Until then /marketplace shows the
  // coming-soon screen.
  marketplaceUnlocked: false,
  // Marketplace is hidden for now (Ika, 2026-10-23): no tab in the navbar or dock, and its
  // addresses go to Home (next.config.ts). The pages and code stay; flip to true to bring it back.
  marketplaceShown: false,
} as const;
