"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOutIcon, SettingsIcon } from "lucide-react";

import type { CurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

// Avatar + name at the right of the navbar; opens settings and log out.
export function UserMenu({ user }: { user: CurrentUser }) {
  const router = useRouter();
  const displayName = user.name || user.email;

  const logout = async () => {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-3 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        <Avatar className="size-9 after:border-nia-line">
          <AvatarImage src={user.avatarUrl ?? undefined} alt="" />
          <AvatarFallback className="bg-nia-chip text-small font-bold text-nia-ink">
            {getInitials(user.name, user.email)}
          </AvatarFallback>
        </Avatar>
        <span className="hidden max-w-40 truncate text-sm leading-[1.4] font-bold text-nia-ink sm:block">
          {displayName}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="min-w-56">
        <DropdownMenuLabel className="flex flex-col font-normal">
          <span className="truncate text-sm font-bold text-nia-ink">{displayName}</span>
          {user.name && (
            <span className="truncate text-xs text-nia-ink-muted">{user.email}</span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings/general">
            <SettingsIcon />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={logout}>
          <LogOutIcon />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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
