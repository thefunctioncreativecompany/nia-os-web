"use client";

import { useRouter } from "next/navigation";
import { CompassIcon, GemIcon, MessageSquareIcon, SettingsIcon, UserRoundIcon } from "lucide-react";

import type { CurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { UserMenu as ArcUserMenu } from "@/components/arc/user-menu/user-menu";
import { openFeedback } from "@/components/nia/feedback";
import { Skeleton } from "@/components/ui/skeleton";

// The account menu behind the avatar (U2, uiarc user-menu): name, email, Profile, Settings,
// Plans, Take the tour (the welcome tour on Home), Send feedback and Log out; a bottom sheet on phones. No theme
// switch until Nia has a dark mode.
export function UserMenu({ user }: { user: CurrentUser }) {
  const router = useRouter();
  const displayName = user.name || user.email;

  return (
    <ArcUserMenu
      user={{ name: displayName, email: user.email, avatarSrc: user.avatarUrl ?? undefined }}
      // Avatar only (Ika, 2026-11-08, navbar decision 6): the tabs carry their names, and the search gets the room.
      showName={false}
      showTheme={false}
      items={[
        { label: "Profile", icon: <UserRoundIcon size={16} />, onSelect: () => router.push("/settings/profile") },
        { label: "Settings", icon: <SettingsIcon size={16} />, onSelect: () => router.push("/settings/general") },
        { label: "Plans", icon: <GemIcon size={16} />, onSelect: () => router.push("/plans") },
        { label: "Take the tour", icon: <CompassIcon size={16} />, onSelect: () => router.push("/home?tour=1") },
        { label: "Send feedback", icon: <MessageSquareIcon size={16} />, onSelect: openFeedback },
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
    <Skeleton className="size-9 rounded-full" />
  );
}
