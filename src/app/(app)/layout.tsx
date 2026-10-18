import { Suspense } from "react";

import { getCurrentUser } from "@/lib/auth";
import { AppNavbar } from "@/components/app/app-navbar";
import { UserMenu, UserMenuSkeleton } from "@/components/app/user-menu";

// Shell for every signed-in page: the Figma top navbar above the page.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-svh w-full flex-col bg-white text-nia-ink">
      <AppNavbar
        user={
          <Suspense fallback={<UserMenuSkeleton />}>
            <NavbarUser />
          </Suspense>
        }
      />
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}

async function NavbarUser() {
  const user = await getCurrentUser();
  return <UserMenu user={user} />;
}
