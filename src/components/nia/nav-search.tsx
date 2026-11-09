"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
            <span className="min-w-0 flex-1 truncate">Search Nia</span>
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
      {wanted && <GlobalSearch open={open} onOpenChange={setOpen} />}
    </>
  );
}
