"use client";

import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";

import { Button } from "@/components/ui/button";
import { NewProjectDialog } from "@/components/projects/new-project-dialog";
import { NavSearch } from "@/components/nia/nav-search";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Tab = {
  label: string;
  icon: string;
  // null until the screen is built.
  href: string | null;
  // Top-level sections (the first part of the address) that show this tab as active.
  match: string[];
};

const tabs: Tab[] = [
  { label: "Home", icon: "/app/home.svg", href: "/home", match: ["home", "settings"] },
  { label: "Projects", icon: "/app/folder.svg", href: "/projects", match: ["projects"] },
  { label: "Templates", icon: "/app/file-text.svg", href: "/templates", match: ["templates"] },
  { label: "Explore", icon: "/app/explore.svg", href: null, match: [] },
  { label: "Inbox", icon: "/app/inbox.svg", href: null, match: [] },
];

// Top bar on every signed-in page (Figma "Navbar"). `user` is the avatar menu,
// passed in from the server so it can stream in.
export function Navbar({ user }: { user: React.ReactNode }) {
  return (
    <header className="relative flex h-20 shrink-0 items-center justify-between gap-4 border-b border-nia-line bg-white px-4 md:px-15">
      {/* Which tab is active depends on the address, known only at request time; until
          then the tabs show with none highlighted. */}
      <Suspense fallback={<NavTabs segment={null} />}>
        <CurrentNavTabs />
      </Suspense>

      <div className="flex items-center gap-4 md:gap-6">
        <NavSearch />
        <NewProjectDialog>
          <Button
          type="button"
          variant="outline"
          size="compact"
          aria-label="New project"
          className="h-8 w-9 rounded-[6px] border-nia-line bg-white p-0 text-lg leading-[1.4] font-medium text-nia-ink hover:bg-nia-field-muted hover:text-nia-ink"
          >
            +
          </Button>
        </NewProjectDialog>
        {user}
      </div>
    </header>
  );
}

function CurrentNavTabs() {
  return <NavTabs segment={useSelectedLayoutSegment()} />;
}

function NavTabs({ segment }: { segment: string | null }) {
  const isActive = (tab: Tab) => segment !== null && tab.match.includes(segment);

  return (
    <nav aria-label="Main" className="flex items-center gap-5 md:gap-8">
      {tabs.map((tab) => {
        const icon = <Image src={tab.icon} alt="" width={18} height={18} />;

        if (isActive(tab) && tab.href) {
          return (
            <Link
              key={tab.label}
              href={tab.href}
              aria-current="page"
              className="flex h-9.5 min-w-25 items-center justify-center gap-1.25 rounded-full bg-gold/15 px-4 text-lead font-medium whitespace-nowrap text-foreground"
            >
              {icon}
              {tab.label}
            </Link>
          );
        }

        return (
          <Tooltip key={tab.label}>
            <TooltipTrigger asChild>
              {tab.href ? (
                <Link href={tab.href} aria-label={tab.label} className="flex h-[37px] items-center">
                  {icon}
                </Link>
              ) : (
                <span
                  role="link"
                  aria-disabled="true"
                  aria-label={`${tab.label} (coming soon)`}
                  tabIndex={0}
                  className="flex h-[37px] cursor-not-allowed items-center"
                >
                  {icon}
                </span>
              )}
            </TooltipTrigger>
            <TooltipContent>{tab.href ? tab.label : `${tab.label} · coming soon`}</TooltipContent>
          </Tooltip>
        );
      })}
    </nav>
  );
}
