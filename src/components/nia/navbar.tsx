"use client";

import { Suspense, useEffect, useLayoutEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSelectedLayoutSegment } from "next/navigation";
import { FileText, Folder, House, Inbox, LoaderPinwheel, Plus, type LucideIcon } from "lucide-react";
import { useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";
import { playSound } from "@/lib/sounds";
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
  { label: "Explore", icon: "/app/explore.svg", glyph: LoaderPinwheel, href: "/explore", match: ["explore"] },
  { label: "Inbox", icon: "/app/inbox.svg", glyph: Inbox, href: null, match: [] },
];

// Top bar on every signed-in page (Figma "Navbar"). `user` is the avatar menu, passed in from the
// server so it can stream in. Desktop (Ika, 2026-11-08; NAVBAR_SPEC.md, the frosted bar): a 4rem
// frosted bar that stays at the top as the page scrolls under it, tabs on the left, the search
// with a round + in the middle, the avatar on the right; once the page has scrolled, a soft blur
// under its lower edge. Phones and tablets keep their bar, which scrolls away, and the dock.
export function Navbar({ user }: { user: React.ReactNode }) {
  return (
    // The blur strip sits beside the glass, not inside it: glass inside glass sees nothing to blur.
    <div data-navbar className="group relative z-30 shrink-0 print:hidden lg:sticky lg:top-0">
      <header className="relative flex h-(--nav-h) items-center justify-between gap-4 border-b border-nia-line bg-background px-4 md:px-page lg:grid lg:grid-cols-[minmax(max-content,1fr)_minmax(16rem,38rem)_minmax(max-content,1fr)] lg:border-border/60 lg:px-6 lg:glass-bar">
        {/* Which tab is active depends on the address, known only at request time; until
            then the tabs show with none highlighted. */}
        <Suspense fallback={<NavTabs segment={null} />}>
          <CurrentNavTabs />
        </Suspense>
        {/* Phones and tablets: the tabs move to the dock at the bottom, and starting a new
            project takes their place: a round silver-glass +. */}
        <NewProjectDialog>
          <Button type="button" variant="ghost" size="icon" aria-label="New project" className="glass-silver size-10 shrink-0 rounded-full text-foreground lg:hidden">
            <Plus aria-hidden className="size-5" />
          </Button>
        </NewProjectDialog>

        <div className="flex items-center max-lg:min-w-0 max-lg:flex-1 lg:gap-2.5">
          <NavSearch />
          <Tooltip>
            <NewProjectDialog>
              <TooltipTrigger asChild>
                <Button type="button" variant="outline" size="icon" aria-label="New project" className="size-10 shrink-0 rounded-full bg-background/95 max-lg:hidden">
                  <Plus aria-hidden className="size-4.5" />
                </Button>
              </TooltipTrigger>
            </NewProjectDialog>
            <TooltipContent>New project</TooltipContent>
          </Tooltip>
        </div>
        {/* Phones and tablets keep their old spacing beside the search (0.75rem, 1.5rem from md). */}
        <div className="flex shrink-0 justify-end max-md:-ml-1 md:max-lg:ml-2">{user}</div>
      </header>
      <div aria-hidden className="nav-edge pointer-events-none invisible absolute inset-x-0 top-full opacity-0 transition-[opacity,visibility] duration-base ease-out group-data-scrolled:visible group-data-scrolled:opacity-100 max-lg:hidden" />
    </div>
  );
}

// Marks the bar once the page has scrolled (data-scrolled), for the blur strip: a 1px marker at
// the top of the page, watched rather than listening to every scroll. Sits at the top of <main>.
export function NavScrollMarker() {
  const marker = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = marker.current;
    const bar = document.querySelector<HTMLElement>("[data-navbar]");
    if (!el || !bar) return;
    const observer = new IntersectionObserver(([entry]) => bar.toggleAttribute("data-scrolled", !entry.isIntersecting), {
      rootMargin: `-${bar.offsetHeight}px 0px 0px 0px`,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return <div ref={marker} aria-hidden className="-mb-px h-px" />;
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
          if (!href) return;
          playSound("navigate");
          router.push(href);
        }}
      />
    </div>
  );
}

// Where the blue highlight last sat, kept between screens so it can glide from there to the new tab.
let lastHighlight: { left: number; width: number } | null = null;

// Desktop tabs: icon and name side by side on every tab, so people learn where things are (Ika,
// 2026-10-20; icons alone can come back once everyone knows them). One blue highlight sits behind
// the active tab and glides to the new one when the screen changes.
function NavTabs({ segment }: { segment: string | null }) {
  const reduce = useReducedMotion();
  const nav = useRef<HTMLElement>(null);
  const highlight = useRef<HTMLSpanElement>(null);
  const isActive = (tab: Tab) => segment !== null && tab.match.includes(segment);
  const pill = "relative flex h-9 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-small font-medium whitespace-nowrap outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

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
    <nav ref={nav} aria-label="Main" className="relative isolate flex items-center gap-0.5 max-lg:hidden">
      <span
        ref={highlight}
        aria-hidden
        className="absolute inset-y-0 left-0 -z-10 rounded-full bg-nia-blue/15 opacity-0 transition-[transform,width] duration-base ease-out"
      />
      {tabs.map((tab) => {
        const icon = <Image src={tab.icon} alt="" width={16} height={16} className="size-4 shrink-0" />;
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
            // The tick sounds as the press starts, not when it's let go; keys get it on click.
            onPointerDown={() => !active && playSound("navigate")}
            onClick={(e) => e.detail === 0 && !active && playSound("navigate")}
            className={cn(pill, "transition-colors duration-fast", active ? "font-semibold text-foreground" : "text-foreground/80 hover:text-foreground")}
          >
            {icon}
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
