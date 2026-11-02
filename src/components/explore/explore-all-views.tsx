"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

// Explore all's views (Ika): the canvas that goes on in every direction, and the timeline
// (2026-11-02, being built in steps; desktop only, so the switch shows on desktop only).
const VIEWS = [
  { id: "canvas", label: "Canvas", href: "/explore/all" },
  { id: "timeline", label: "Timeline", href: "/explore/all/timeline" },
] as const;

/** The view someone last chose, remembered on this device (the Explore all button opens it). */
export const VIEW_KEY = "nia-explore-all-view";
export function rememberedView(): string {
  try {
    return VIEWS.find((v) => v.id === localStorage.getItem(VIEW_KEY))?.href ?? "/explore/all";
  } catch {
    return "/explore/all";
  }
}

export function ExploreAllViews({ current, className }: { current: "canvas" | "timeline"; className?: string }) {
  return (
    <nav aria-label="Explore all views" className={cn("pointer-events-auto flex items-center max-lg:hidden gap-1 rounded-full bg-card/90 p-1 shadow-card backdrop-blur-sm", className)}>
      {VIEWS.map((v) => (
        <Link
          key={v.id}
          href={v.href}
          aria-current={v.id === current ? "page" : undefined}
          onClick={() => {
            try {
              localStorage.setItem(VIEW_KEY, v.id);
            } catch {}
          }}
          className={cn(
            "rounded-full px-3.5 py-1.5 text-sm leading-[1.4] font-bold outline-none transition-colors duration-fast focus-visible:ring-3 focus-visible:ring-ring/50",
            v.id === current ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {v.label}
        </Link>
      ))}
    </nav>
  );
}
