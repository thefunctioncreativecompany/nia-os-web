"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Search } from "lucide-react";

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
      {/* Desktop. */}
      <button
        type="button"
        onPointerEnter={preload}
        onFocus={preload}
        onClick={show}
        aria-haspopup="dialog"
        className="flex h-10 w-70 shrink-0 items-center gap-2.5 rounded-full border border-border bg-card px-4 text-left text-sm text-nia-placeholder outline-none transition-colors duration-fast hover:border-foreground/40 focus-visible:ring-3 focus-visible:ring-ring/50 max-lg:hidden"
      >
        <Search aria-hidden className="size-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate">Search Nia</span>
        <kbd className="rounded-md bg-muted px-1.5 py-0.5 font-sans text-caption text-muted-foreground">⌘K</kbd>
      </button>
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
