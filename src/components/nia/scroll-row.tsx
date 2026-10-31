"use client";

import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

// A row that scrolls left and right and stays still otherwise (Ika, 2026-10-21: Explore's Top 10
// press kits). Swipe, scroll or use the arrows at its left and right edges (wide screens), which
// move about one screen of cards and hide at either end.
export function ScrollRow({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  const row = useRef<HTMLUListElement>(null);
  const [ends, setEnds] = useState({ start: true, end: false });

  const update = useCallback(() => {
    const el = row.current;
    if (!el) return;
    setEnds({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  }, []);

  useLayoutEffect(() => {
    update();
    const el = row.current;
    if (!el) return;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [update]);

  const move = (direction: 1 | -1) => {
    const el = row.current;
    if (!el) return;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: smooth ? "smooth" : "auto" });
  };

  return (
    <div className="relative">
      <ul
        ref={row}
        aria-label={label}
        onScroll={update}
        className={cn("-mx-1 flex snap-x snap-mandatory scroll-px-1 gap-3.25 overflow-x-auto px-1 py-2 [scrollbar-width:none]", className)}
      >
        {children}
      </ul>
      <RowArrow side="left" hidden={ends.start} onClick={() => move(-1)} />
      <RowArrow side="right" hidden={ends.end} onClick={() => move(1)} />
    </div>
  );
}

function RowArrow({ side, hidden, onClick }: { side: "left" | "right"; hidden: boolean; onClick: () => void }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={hidden}
      aria-label={side === "left" ? "Scroll left" : "Scroll right"}
      className={cn(
        "absolute top-[40%] z-10 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card/95 text-foreground shadow-elevation-2 outline-none transition-[opacity,background-color] duration-fast hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-0 md:flex",
        side === "left" ? "left-2" : "right-2",
      )}
    >
      <Icon aria-hidden className="size-5" />
    </button>
  );
}
