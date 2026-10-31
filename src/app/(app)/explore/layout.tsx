import { Suspense } from "react";

import { ExploreComingSoon } from "@/components/explore/explore-coming-soon";
import { hasExploreAccess } from "@/lib/explore-access";

// Every Explore page is for people with early access (a confirmed email invite or an invite
// code; Ika, 2026-10-21). Everyone else gets the coming-soon screen, where they can enter a code.
export default function Layout({ children }: LayoutProps<"/explore">) {
  return (
    <Suspense fallback={<div className="h-[calc(100svh-5rem)] min-h-140 bg-background" />}>
      <Gate>{children}</Gate>
    </Suspense>
  );
}

async function Gate({ children }: { children: React.ReactNode }) {
  return (await hasExploreAccess()) ? children : <ExploreComingSoon />;
}
