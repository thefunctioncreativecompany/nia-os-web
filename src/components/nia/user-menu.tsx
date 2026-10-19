"use client";

import { useRouter } from "next/navigation";
import { SettingsIcon, UserRoundIcon } from "lucide-react";

import type { CurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { UserMenu as ArcUserMenu } from "@/components/arc/user-menu/user-menu";
import { Skeleton } from "@/components/ui/skeleton";

// The account menu behind the avatar (U2, uiarc user-menu): name, email, Profile, Settings
// and Log out; a bottom sheet on phones. No theme switch until Nia has a dark mode.
export function UserMenu({ user }: { user: CurrentUser }) {
  const router = useRouter();
  const displayName = user.name || user.email;

  return (
    <ArcUserMenu
      user={{ name: displayName, email: user.email, avatarSrc: user.avatarUrl ?? undefined }}
      showName
      showTheme={false}
      items={[
        { label: "Profile", icon: <UserRoundIcon size={16} />, onSelect: () => router.push("/settings/profile") },
        { label: "Settings", icon: <SettingsIcon size={16} />, onSelect: () => router.push("/settings/general") },
      ]}
      onSignOut={async () => {
        await createClient().auth.signOut();
        router.push("/login");
        router.refresh();
      }}
    />
  );
}

export function UserMenuSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <Skeleton className="size-9 rounded-full" />
      <Skeleton className="hidden h-4 w-20 sm:block" />
    </div>
  );
}
