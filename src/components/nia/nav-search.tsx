"use client";

import { Suspense, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useExploreAccess } from "@/features/navbar/explore-flag";
import { pickIdea, sectionOf } from "@/features/navbar/try-ideas";
import { recentSearches } from "@/lib/search";

const noChange = () => () => {};

// Global search is its own download, fetched when someone points at, taps or focuses the search
// (or presses ⌘K), so pages don't carry it.
const loadGlobalSearch = () => import("@/components/nia/global-search").then((m) => m.GlobalSearch);
const GlobalSearch = dynamic(loadGlobalSearch, { ssr: false });

// Navbar search: a field that opens global search (global-search.tsx: projects, documents, files,
// templates and Explore, with tags, autocorrect and suggested searches). On desktop it's the
// field with ⌘K / Ctrl K; on phones and tablets it fills the top bar in silver glass and opens the
// same search full screen (Ika, 2026-10-31: phones get the same search as desktop).
export function NavSearch() {
  const [open, setOpen] = useState(false);
  const shortcut = useSyncExternalStore(noChange, () => (/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘K" : "Ctrl K"), () => "⌘K");
  const [wanted, setWanted] = useState(false);
  // The idea in the hint (N4), kept here so search opens with the same one.
  const [idea, setIdea] = useState<string | null>(null);
  const preload = () => {
    setWanted(true);
    void loadGlobalSearch();
  };
  const show = () => {
    setWanted(true);
    setOpen(true);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "k" || !(e.metaKey || e.ctrlKey)) return;
      e.preventDefault();
      setWanted(true);
      setOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      {/* Desktop: a wide pill in the middle of the bar (NAVBAR_SPEC §3). The shortcut lives in the
          tooltip (navbar decision 5); the border turns Nia Blue while search is open. */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onPointerEnter={preload}
            onFocus={preload}
            onClick={show}
            aria-haspopup="dialog"
            aria-label="Search Nia"
            aria-keyshortcuts="Meta+K Control+K"
            className={cn(
              "flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-full border bg-background/95 pr-1.5 pl-4 text-left text-sm text-muted-foreground shadow-xs outline-none transition-colors duration-fast hover:border-foreground/40 focus-visible:ring-3 focus-visible:ring-ring/50 max-lg:hidden",
              open ? "border-nia-blue/50" : "border-border",
            )}
          >
            <Search aria-hidden className="size-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate">
              <Suspense fallback="Search Nia">
                <TryHint idea={idea} onIdea={setIdea} />
              </Suspense>
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent>Search Nia · {shortcut}</TooltipContent>
      </Tooltip>
      {/* Phones and tablets: a field that fills the top bar, in silver glass. */}
      <div className="nav-search-glass relative min-w-0 flex-1 lg:hidden">
        <button
          type="button"
          data-expanded
          onPointerDown={preload}
          onFocus={preload}
          onClick={show}
          aria-haspopup="dialog"
          className="flex h-11 w-full items-center gap-2.5 rounded-full border border-border px-4 text-left text-sm text-nia-placeholder outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Search aria-hidden className="size-4.5 shrink-0 text-foreground" />
          <span className="min-w-0 flex-1 truncate">Search projects, documents, templates...</span>
        </button>
      </div>
      {wanted && <GlobalSearch open={open} onOpenChange={setOpen} idea={idea} />}
    </>
  );
}

const VISITS_KEY = "nia-nav-visits";

// The hint in the field: "Try “Call sheet”", one idea per page (try-ideas.ts). Picked after the
// page loads, since recent searches and the visit count live in the browser; until then, and
// when there's nothing to suggest, it says "Search Nia". It reads the address, so it sits in a
// boundary of its own.
function TryHint({ idea, onIdea }: { idea: string | null; onIdea: (idea: string | null) => void }) {
  const pathname = usePathname();
  const exploreAccess = useExploreAccess();
  // How many pages this tab has shown, counted once per page: a new idea each time the page
  // changes, picked again (same count) when Explore access streams in.
  const counted = useRef<{ pathname: string; visit: number } | null>(null);
  useEffect(() => {
    if (counted.current?.pathname !== pathname) {
      let visit = 0;
      try {
        visit = Number(sessionStorage.getItem(VISITS_KEY) ?? "-1") + 1;
        sessionStorage.setItem(VISITS_KEY, String(visit));
      } catch {}
      counted.current = { pathname, visit };
    }
    onIdea(pickIdea({ section: sectionOf(pathname), recent: recentSearches(), exploreAccess, visit: counted.current.visit }));
    // `onIdea` is a state setter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, exploreAccess]);
  if (!idea) return "Search Nia";
  return (
    <span key={idea} className="animate-in fade-in duration-fast motion-reduce:animate-none">
      Try “{idea}”
    </span>
  );
}
