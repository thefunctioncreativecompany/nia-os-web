import { Suspense } from "react";

import { getCurrentUser } from "@/lib/auth";
import { Feedback } from "@/components/nia/feedback";
import { MotionProvider } from "@/components/nia/motion-provider";
import { NavDock, Navbar } from "@/components/nia/navbar";
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
          <main className="flex flex-1 flex-col pb-28 lg:pb-0">{children}</main>
          <NavDock />
          {/* The upgrade prompt, opened when a free limit is reached. */}
          <UpgradeDialog />
          {/* Feedback for the MVP pilot: the button, the dialog and the after-job question. It reads
              the address, known only at request time, so it streams in after the page. */}
          <Suspense fallback={null}>
            <Feedback />
          </Suspense>
        </div>
      </TooltipProvider>
    </MotionProvider>
  );
}

async function NavbarUser() {
  const user = await getCurrentUser();
  return <UserMenu user={user} />;
}
