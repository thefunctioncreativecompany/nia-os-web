"use client";

import { Suspense, useLayoutEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSelectedLayoutSegment } from "next/navigation";
import { Compass, FileText, Folder, House, Inbox, Plus, ShoppingBag, type LucideIcon } from "lucide-react";
import { useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";
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
  { label: "Home", icon: "/app/home.svg", glyph: House, href: "/home", match: ["home", "settings", "plans"] },
  { label: "Projects", icon: "/app/folder.svg", glyph: Folder, href: "/projects", match: ["projects"] },
  { label: "Templates", icon: "/app/file-text.svg", glyph: FileText, href: "/templates", match: ["templates"] },
  { label: "Explore", icon: "/app/explore.svg", glyph: Compass, href: "/explore", match: ["explore"] },
  { label: "Marketplace", icon: "/app/shopping-bag.svg", glyph: ShoppingBag, href: null, match: ["marketplace"] },
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

// Where the gold highlight last sat, kept between screens so it can glide from there to the new tab.
let lastHighlight: { left: number; width: number } | null = null;

// Desktop tabs: icon and name side by side on every tab, so people learn where things are (Ika,
// 2026-10-20; icons alone can come back once everyone knows them). One gold highlight sits behind
// the active tab and glides to the new one when the screen changes.
function NavTabs({ segment }: { segment: string | null }) {
  const reduce = useReducedMotion();
  const nav = useRef<HTMLElement>(null);
  const highlight = useRef<HTMLSpanElement>(null);
  const isActive = (tab: Tab) => segment !== null && tab.match.includes(segment);
  const pill = "relative flex h-9.5 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-lead font-medium whitespace-nowrap outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

  useLayoutEffect(() => {
    const el = highlight.current;
    if (!el) return;
    const place = (glide: boolean) => {
      const link = nav.current?.querySelector<HTMLElement>("[aria-current=page]");
      if (!link) {
        el.style.opacity = "0";
        return;
      }
      const to = { left: link.offsetLeft, width: link.offsetWidth };
      const set = (p: { left: number; width: number }, animate: boolean) => {
        el.style.transitionDuration = animate ? "" : "0s";
        el.style.transform = `translateX(${p.left}px)`;
        el.style.width = `${p.width}px`;
        el.style.opacity = "1";
      };
      if (glide && lastHighlight && !reduce && lastHighlight.left !== to.left) {
        set(lastHighlight, false);
        el.getBoundingClientRect(); // start from the old tab before gliding
        set(to, true);
      } else set(to, false);
      lastHighlight = to;
    };
    place(true);
    const onResize = () => place(false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [segment, reduce]);

  return (
    <nav ref={nav} aria-label="Main" className="relative isolate flex items-center gap-1 max-lg:hidden">
      <span
        ref={highlight}
        aria-hidden
        className="absolute inset-y-0 left-0 -z-10 rounded-full bg-gold/15 opacity-0 transition-[transform,width] duration-base ease-out"
      />
      {tabs.map((tab) => {
        const icon = <Image src={tab.icon} alt="" width={18} height={18} className="shrink-0" />;
        const active = isActive(tab);

        if (!tab.href) {
          return (
            <Tooltip key={tab.label}>
              <TooltipTrigger asChild>
                <span
                  role="link"
                  aria-disabled="true"
                  aria-label={`${tab.label} (coming soon)`}
                  tabIndex={0}
                  className={cn(pill, "cursor-not-allowed text-muted-foreground opacity-60")}
                >
                  {icon}
                  {tab.label}
                </span>
              </TooltipTrigger>
              <TooltipContent>{tab.label} · coming soon</TooltipContent>
            </Tooltip>
          );
        }

        return (
          <Link
            key={tab.label}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(pill, "transition-colors duration-fast", active ? "text-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            {icon}
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
