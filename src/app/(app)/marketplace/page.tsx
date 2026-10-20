import type { Metadata } from "next";

import { MarketplaceComingSoon } from "@/components/marketplace/marketplace-coming-soon";
import { MarketplaceHome } from "@/components/marketplace/marketplace-home";
import { features } from "@/lib/features";

export const metadata: Metadata = {
  title: "Marketplace · Nia OS",
};

// The Marketplace tab always lands here; the switch in src/lib/features.ts picks the screen. Until
// Marketplace opens (no launch date yet), the coming-soon screen (Ika's design, 2026-10-20).
export default function Page() {
  return features.marketplaceUnlocked ? <MarketplaceHome /> : <MarketplaceComingSoon />;
}
