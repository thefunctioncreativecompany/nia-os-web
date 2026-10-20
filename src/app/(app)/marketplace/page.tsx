import type { Metadata } from "next";

import { MarketplaceComingSoon } from "@/components/marketplace/marketplace-coming-soon";

export const metadata: Metadata = {
  title: "Marketplace · Nia OS",
};

// The Marketplace tab always lands here. Until it opens (no launch date yet), the coming-soon
// screen (Ika's design, 2026-10-20). The store itself arrives in the next step, behind
// `features.marketplaceUnlocked` (src/lib/features.ts).
export default function Page() {
  return <MarketplaceComingSoon />;
}
