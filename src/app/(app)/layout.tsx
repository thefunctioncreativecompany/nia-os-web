import { Suspense } from "react";

import { getCurrentUser } from "@/lib/auth";
import { NavDock, Navbar } from "@/components/nia/navbar";
import { UserMenu, UserMenuSkeleton } from "@/components/nia/user-menu";
import { UpgradeDialog } from "@/components/nia/upgrade-dialog";

// Shell for every signed-in page: the Figma top navbar above the page, and the dock at the
// bottom on phones and tablets.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-svh w-full flex-col bg-white text-nia-ink">
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
    </div>
  );
}

async function NavbarUser() {
  const user = await getCurrentUser();
  return <UserMenu user={user} />;
}
