"use client";

import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { CompassIcon, GemIcon, SettingsIcon, UserRoundIcon } from "lucide-react";

import type { CurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { UserMenu as ArcUserMenu } from "@/components/arc/user-menu/user-menu";
import { Skeleton } from "@/components/ui/skeleton";

// The account menu behind the avatar (U2, uiarc user-menu): name, email, Profile, Settings,
// Plans, Take the tour (the welcome tour on Home) and Log out; a bottom sheet on phones. No theme
// switch until Nia has a dark mode.
export function UserMenu({ user }: { user: CurrentUser }) {
  const router = useRouter();
  const displayName = user.name || user.email;
  // The name beside the avatar needs a wide screen; the desktop tabs carry their names too.
  const wide = useSyncExternalStore(subscribeWide, isWide, () => false);

  return (
    <ArcUserMenu
      user={{ name: displayName, email: user.email, avatarSrc: user.avatarUrl ?? undefined }}
      showName={wide}
      showTheme={false}
      items={[
        { label: "Profile", icon: <UserRoundIcon size={16} />, onSelect: () => router.push("/settings/profile") },
        { label: "Settings", icon: <SettingsIcon size={16} />, onSelect: () => router.push("/settings/general") },
        { label: "Plans", icon: <GemIcon size={16} />, onSelect: () => router.push("/plans") },
        { label: "Take the tour", icon: <CompassIcon size={16} />, onSelect: () => router.push("/home?tour=1") },
      ]}
      onSignOut={async () => {
        await createClient().auth.signOut();
        router.push("/login");
        router.refresh();
      }}
    />
  );
}

const WIDE = "(min-width: 80rem)";
const subscribeWide = (onChange: () => void) => {
  const query = window.matchMedia(WIDE);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const isWide = () => window.matchMedia(WIDE).matches;

export function UserMenuSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <Skeleton className="size-9 rounded-full" />
      <Skeleton className="hidden h-4 w-20 sm:block" />
    </div>
  );
}
