import { Suspense } from "react";

import { getCurrentUser } from "@/lib/auth";
import { hasExploreAccess } from "@/lib/explore-access";
import { ExploreAccessFlag } from "@/features/navbar/explore-flag";
import { Feedback } from "@/components/nia/feedback";
import { ExploreAllButton } from "@/components/nia/explore-all-button";
import { NavTrail } from "@/components/nia/back-link";
import { MotionProvider } from "@/components/nia/motion-provider";
import { NavDock, NavScrollMarker, Navbar } from "@/components/nia/navbar";
import { UserMenu, UserMenuSkeleton } from "@/components/nia/user-menu";
import { UpgradeDialog } from "@/components/nia/upgrade-dialog";
import { TooltipProvider } from "@/components/ui/tooltip";

// Shell for every signed-in page: the Figma top navbar above the page, and the dock at the
// bottom on phones and tablets. Tooltips are only used in here, so sign-in pages don't load them.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <MotionProvider>
      <TooltipProvider>
        <div className="flex min-h-svh w-full flex-col bg-background text-nia-ink">
          <Navbar
            user={
              <Suspense fallback={<UserMenuSkeleton />}>
                <NavbarUser />
              </Suspense>
            }
          />
          {/* Room at the bottom on phones and tablets so the dock never covers the end of a page. */}
          <main className="flex flex-1 flex-col pb-28 lg:pb-0">
            {/* Tells the desktop bar when the page has scrolled under it (its blur strip). */}
            <NavScrollMarker />
            {children}
          </main>
          <NavDock />
          {/* The upgrade prompt, opened when a free limit is reached. */}
          <UpgradeDialog />
          {/* Feedback for the MVP pilot: the button, the dialog and the after-job question. It reads
              the address, known only at request time, so it streams in after the page. */}
          <Suspense fallback={null}>
            <Feedback />
          </Suspense>
          {/* The pages visited in this tab, so "← Back to …" links can step back (BackLink). */}
          <Suspense fallback={null}>
            <NavTrail />
          </Suspense>
          {/* Explore all from anywhere (desktop), bottom left. It reads the address too. */}
          <Suspense fallback={null}>
            <ExploreAllButton />
          </Suspense>
        </div>
      </TooltipProvider>
    </MotionProvider>
  );
}

async function NavbarUser() {
  // Explore access rides along for the search hint's ideas (N4): read together, streamed in.
  const [user, explore] = await Promise.all([getCurrentUser(), hasExploreAccess()]);
  return (
    <>
      <UserMenu user={user} />
      <ExploreAccessFlag value={explore} />
    </>
  );
}
