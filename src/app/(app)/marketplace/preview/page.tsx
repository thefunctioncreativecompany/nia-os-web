import type { Metadata } from "next";

import { MarketplaceHome } from "@/components/marketplace/marketplace-home";

export const metadata: Metadata = {
  title: "Marketplace preview · Nia OS",
};

// "Preview Marketplace" and every tile on the coming-soon screen: the store with sample listings,
// before it opens.
export default function Page() {
  return <MarketplaceHome />;
}
