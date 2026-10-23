import type { Metadata } from "next";

import { MarketplaceHome } from "@/components/marketplace/marketplace-home";

export const metadata: Metadata = {
  title: "Marketplace · Nia OS",
};

// The store (sample listings until it reads from Supabase). The layout shows coming soon instead
// to anyone without an invite code while Marketplace is closed.
export default function Page() {
  return <MarketplaceHome />;
}
