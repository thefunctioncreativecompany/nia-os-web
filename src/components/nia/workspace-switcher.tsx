"use client";

import { Check, ChevronDown, LogOut, Plus } from "lucide-react";

import { cn, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type Workspace = { id: string; name: string; role: "Owner" | "Editor" | "Viewer" };

// Neutral tints so each team account is easy to tell apart without leaving the palette.
const TINTS = [
  "bg-foreground text-primary-foreground",
  "bg-status-pending text-status-pending-foreground",
  "bg-status-on-hold text-status-on-hold-foreground",
  "bg-status-confirmed text-status-confirmed-foreground",
];

// Profile menu with team accounts to switch between (Figma "29 — Profile & Workspace
// Switcher"). "Workspace" here means a team account, per the production language.
export function WorkspaceSwitcher({
  user,
  workspaces,
  current,
  onSwitch,
  onCreate,
  onManageAccount,
  onSignOut,
}: {
  user: { name: string; email: string; avatarUrl?: string };
  workspaces: Workspace[];
  current: string;
  onSwitch: (id: string) => void;
  onCreate: () => void;
  onManageAccount: () => void;
  onSignOut: () => void;
}) {
  const initials = getInitials(user.name, user.email);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex h-11 items-center gap-2.5 rounded-full border border-border bg-card py-1 pr-3 pl-1 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=open]:bg-muted">
        <Avatar className="size-9">
          <AvatarImage src={user.avatarUrl} alt="" />
          <AvatarFallback className="bg-accent text-small font-bold">{initials}</AvatarFallback>
        </Avatar>
        <span className="hidden max-w-40 truncate text-sm font-bold sm:block">{user.name}</span>
        <ChevronDown aria-hidden className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-80">
        <DropdownMenuLabel className="flex items-center gap-3 px-2.5 py-2 font-normal normal-case tracking-normal">
          <Avatar className="size-11">
            <AvatarImage src={user.avatarUrl} alt="" />
            <AvatarFallback className="bg-accent font-bold">{initials}</AvatarFallback>
          </Avatar>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-bold text-foreground">{user.name}</span>
            <span className="truncate text-small text-muted-foreground">{user.email}</span>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuItem onSelect={onManageAccount} className="text-small font-bold">Manage account</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
          {workspaces.map((workspace, i) => (
            <DropdownMenuItem key={workspace.id} onSelect={() => onSwitch(workspace.id)} className="gap-3 py-2">
              <span aria-hidden className={cn("flex size-7 shrink-0 items-center justify-center rounded-md text-small font-bold", TINTS[i % TINTS.length])}>
                {workspace.name[0]}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm text-foreground">{workspace.name}</span>
                <span className="text-micro text-muted-foreground">{workspace.role}</span>
              </span>
              {workspace.id === current && (
                <>
                  <Check aria-hidden className="text-nia-success!" />
                  <span className="sr-only">(current)</span>
                </>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onCreate}><Plus />Create new workspace</DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onSelect={onSignOut}><LogOut />Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
