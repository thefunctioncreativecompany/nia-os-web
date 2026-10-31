import Link from "next/link";

import { cn } from "@/lib/utils";

// Explore all's two views (Ika, 2026-10-30): the canvas that goes on in every direction, and the
// quick view, one title at a time.
const VIEWS = [
  { id: "canvas", label: "Canvas", href: "/explore/all" },
  { id: "quick", label: "Quick view", href: "/explore/all/quick" },
] as const;

export function ExploreAllViews({ current, className }: { current: (typeof VIEWS)[number]["id"]; className?: string }) {
  return (
    <nav aria-label="Explore all views" className={cn("pointer-events-auto flex items-center gap-1 rounded-full bg-white/90 p-1 shadow-card backdrop-blur-sm", className)}>
      {VIEWS.map((v) => (
        <Link
          key={v.id}
          href={v.href}
          aria-current={v.id === current ? "page" : undefined}
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
