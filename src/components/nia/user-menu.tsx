"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRightIcon, CompassIcon, GemIcon, MessageSquareIcon, SettingsIcon, UserPlusIcon, UserRoundIcon } from "lucide-react";
import { toast } from "sonner";

import type { CurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { forget, keepRemembering, parseAccounts, remember, switchTo } from "@/lib/accounts";
import { UserMenu as ArcUserMenu } from "@/components/arc/user-menu/user-menu";
import { openFeedback } from "@/components/nia/feedback";
import { Skeleton } from "@/components/ui/skeleton";

const subscribe = (fn: () => void) => {
  window.addEventListener("storage", fn);
  return () => window.removeEventListener("storage", fn);
};
const snapshot = () => {
  try {
    return localStorage.getItem("nia-accounts") ?? "[]";
  } catch {
    return "[]";
  }
};

// The account menu behind the avatar (U2, uiarc user-menu): name, email, Profile, Settings,
// Plans, Take the tour (the welcome tour on Home), Send feedback and Log out; a bottom sheet on phones.
// Accounts (Ika, 2026-11-11): the other accounts used on this device, one tap to switch, and "Add
// another account", which keeps this one signed in (src/lib/accounts.ts).
export function UserMenu({ user }: { user: CurrentUser }) {
  const router = useRouter();
  const displayName = user.name || user.email;
  const raw = useSyncExternalStore(subscribe, snapshot, () => "[]");
  const others = useMemo(() => parseAccounts(raw).filter((a) => a.id !== user.id), [raw, user.id]);

  // Keeps this account's saved sign-in current, so switching back to it later works.
  useEffect(() => keepRemembering(createClient()), []);

  const switchAccount = async (id: string, name: string) => {
    const result = await switchTo(createClient(), id);
    if (result === "expired") return void toast.error(`${name} was signed out. Log in to add it again.`);
    router.push("/home");
    router.refresh();
  };

  return (
    <ArcUserMenu
      user={{ name: displayName, email: user.email, avatarSrc: user.avatarUrl ?? undefined }}
      // Avatar only (Ika, 2026-11-08, navbar decision 6): the tabs carry their names, and the search gets the room.
      showName={false}
      showTheme={false}
      items={[
        ...others.map((a) => ({ label: a.name || a.email, icon: <ArrowLeftRightIcon size={16} />, onSelect: () => void switchAccount(a.id, a.name || a.email) })),
        {
          label: "Add another account",
          icon: <UserPlusIcon size={16} />,
          onSelect: async () => {
            remember((await createClient().auth.getSession()).data.session);
            router.push("/login?add=1");
          },
        },
        { label: "Profile", icon: <UserRoundIcon size={16} />, onSelect: () => router.push("/settings/profile") },
        { label: "Settings", icon: <SettingsIcon size={16} />, onSelect: () => router.push("/settings/general") },
        { label: "Plans", icon: <GemIcon size={16} />, onSelect: () => router.push("/plans") },
        { label: "Take the tour", icon: <CompassIcon size={16} />, onSelect: () => router.push("/home?tour=1") },
        { label: "Send feedback", icon: <MessageSquareIcon size={16} />, onSelect: openFeedback },
      ]}
      onSignOut={async () => {
        // Only this account: the others saved on this device stay signed in.
        forget(user.id);
        await createClient().auth.signOut({ scope: "local" });
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
