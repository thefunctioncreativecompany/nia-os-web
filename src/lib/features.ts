// On/off switches for parts of Nia that aren't open yet. Flip one to true when that part launches
// (it goes live with the next deploy).
export const features = {
  // Explore opens February 2027 (EXPLORE_SPEC.md). Until then /explore shows the coming-soon screen.
  exploreUnlocked: false,
  // Marketplace has no launch date yet (MARKETPLACE_SPEC.md). Until then /marketplace shows the
  // coming-soon screen; the Marketplace tab stays "coming soon" until that screen is built.
  marketplaceUnlocked: false,
} as const;
