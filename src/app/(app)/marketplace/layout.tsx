import { Suspense } from "react";

import { MarketplaceComingSoon } from "@/components/marketplace/marketplace-coming-soon";
import { hasMarketplaceAccess } from "@/lib/marketplace-access";

// Every Marketplace page is for people with an invite code until it opens (Ika, 2026-10-22).
// Everyone else gets the coming-soon screen, where they can join the waitlist or enter a code.
export default function Layout({ children }: LayoutProps<"/marketplace">) {
  return (
    <Suspense fallback={<div className="h-[calc(100svh-5rem)] min-h-140 bg-nia-canvas" />}>
      <Gate>{children}</Gate>
    </Suspense>
  );
}

async function Gate({ children }: { children: React.ReactNode }) {
  return (await hasMarketplaceAccess()) ? children : <MarketplaceComingSoon />;
}
