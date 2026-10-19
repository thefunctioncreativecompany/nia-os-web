"use client";

import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSelectedLayoutSegment } from "next/navigation";
import { Compass, FileText, Folder, House, Inbox, Plus, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { NewProjectDialog } from "@/components/projects/new-project-dialog";
import { NavSearch } from "@/components/nia/nav-search";
import { MagnifyingDock } from "@/components/nia/magnifying-dock";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Tab = {
  label: string;
  icon: string;
  // The same tab in the phone and tablet dock (Lucide).
  glyph: LucideIcon;
  // null until the screen is built.
  href: string | null;
  // Top-level sections (the first part of the address) that show this tab as active.
  match: string[];
};

const tabs: Tab[] = [
  { label: "Home", icon: "/app/home.svg", glyph: House, href: "/home", match: ["home", "settings"] },
  { label: "Projects", icon: "/app/folder.svg", glyph: Folder, href: "/projects", match: ["projects"] },
  { label: "Templates", icon: "/app/file-text.svg", glyph: FileText, href: "/templates", match: ["templates"] },
  { label: "Explore", icon: "/app/explore.svg", glyph: Compass, href: null, match: [] },
  { label: "Inbox", icon: "/app/inbox.svg", glyph: Inbox, href: null, match: [] },
];

// Top bar on every signed-in page (Figma "Navbar"). `user` is the avatar menu,
// passed in from the server so it can stream in.
export function Navbar({ user }: { user: React.ReactNode }) {
  return (
    <header className="relative flex h-20 shrink-0 print:hidden items-center justify-between gap-4 border-b border-nia-line bg-white px-4 md:px-15">
      {/* Which tab is active depends on the address, known only at request time; until
          then the tabs show with none highlighted. */}
      <Suspense fallback={<NavTabs segment={null} />}>
        <CurrentNavTabs />
      </Suspense>
      {/* Phones and tablets: the tabs move to the dock at the bottom, and starting a new
          project takes their place: a round silver-glass + (the square + on the right is desktop only). */}
      <NewProjectDialog>
        <Button type="button" variant="ghost" size="icon" aria-label="New project" className="glass-silver size-10 shrink-0 rounded-full text-foreground lg:hidden">
          <Plus aria-hidden className="size-5" />
        </Button>
      </NewProjectDialog>

      <div className="flex items-center gap-3 max-lg:min-w-0 max-lg:flex-1 md:gap-6">
        <NavSearch />
        <NewProjectDialog>
          <Button
          type="button"
          variant="outline"
          size="compact"
          aria-label="New project"
          className="h-8 w-9 rounded-[6px] border-nia-line max-lg:hidden bg-white p-0 text-lg leading-[1.4] font-medium text-nia-ink hover:bg-nia-field-muted hover:text-nia-ink"
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

// Phone and tablet navigation: the same tabs as a glass dock fixed to the bottom of the
// screen (Bencho's magnifying dock). Coming-soon tabs show but can't be chosen.
export function NavDock() {
  return (
    <Suspense fallback={<Dock segment={null} />}>
      <CurrentDock />
    </Suspense>
  );
}

function CurrentDock() {
  return <Dock segment={useSelectedLayoutSegment()} />;
}

function Dock({ segment }: { segment: string | null }) {
  const router = useRouter();
  const active = tabs.find((tab) => segment !== null && tab.match.includes(segment));
  return (
    <div data-surface="glass" className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-40 flex justify-center px-4 lg:hidden print:hidden">
      <MagnifyingDock
        items={tabs.map((tab) => ({ key: tab.label, label: tab.label, Icon: tab.glyph, disabled: !tab.href }))}
        active={active?.label ?? null}
        onSelect={(key) => {
          const href = tabs.find((tab) => tab.label === key)?.href;
          if (href) router.push(href);
        }}
      />
    </div>
  );
}

function NavTabs({ segment }: { segment: string | null }) {
  const isActive = (tab: Tab) => segment !== null && tab.match.includes(segment);

  return (
    <nav aria-label="Main" className="flex items-center gap-5 max-lg:hidden md:gap-8">
      {tabs.map((tab) => {
        const icon = <Image src={tab.icon} alt="" width={18} height={18} className="shrink-0" />;

        if (isActive(tab) && tab.href) {
          return (
            <Link
              key={tab.label}
              href={tab.href}
              aria-current="page"
              className="flex h-9.5 shrink-0 items-center justify-center gap-1.25 rounded-full bg-gold/15 px-3 text-lead font-medium whitespace-nowrap text-foreground sm:min-w-25 sm:px-4"
            >
              {icon}
              {/* Phones show the active tab as its icon on the gold pill, so every tab fits. */}
              <span className="max-sm:sr-only">{tab.label}</span>
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
