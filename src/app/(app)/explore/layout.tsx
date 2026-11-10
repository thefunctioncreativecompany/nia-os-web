import { Suspense } from "react";

import { ExploreComingSoon } from "@/components/explore/explore-coming-soon";
import { hasExploreAccess } from "@/lib/explore-access";
import { getSession } from "@/lib/supabase/session";

// Explore is open to everyone signed in (Ika, 2026-11-10: no invite code for now;
// `features.exploreUnlocked`). A first visit shows the welcome screen once. With the switch off,
// it's early access again: people without it get the coming-soon screen and its code field.
export default function Layout({ children }: LayoutProps<"/explore">) {
  return (
    <Suspense fallback={<div className="h-[calc(100svh-var(--nav-h))] min-h-140 bg-background" />}>
      <Gate>{children}</Gate>
    </Suspense>
  );
}

async function Gate({ children }: { children: React.ReactNode }) {
  const [access, { user }] = await Promise.all([hasExploreAccess(), getSession()]);
  if (!access) return <ExploreComingSoon />;
  // Open to everyone (Ika, 2026-11-10): a first visit gets the welcome screen once.
  return user && !user.metadata.explore_welcomed ? <ExploreComingSoon welcome /> : children;
}
