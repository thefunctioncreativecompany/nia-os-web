import Link from "next/link";

import { cn } from "@/lib/utils";

// Explore's two halves (Ika, 2026-10-31): the Library of titles and films, and the Feed of news
// that affects the work. Nia Blue underlines the open one, like Settings' tabs.
const TABS = [
  { id: "library", label: "Library", href: "/explore" },
  { id: "feed", label: "Feed", href: "/explore/feed" },
] as const;

export function ExploreTabs({ current, className }: { current: (typeof TABS)[number]["id"]; className?: string }) {
  return (
    <nav aria-label="Explore" className={cn("flex gap-6 border-b border-border", className)}>
      {TABS.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          aria-current={tab.id === current ? "page" : undefined}
          className={cn(
            "-mb-px rounded-t-sm border-b-2 pb-3 text-sm font-bold outline-none transition-colors duration-fast focus-visible:ring-3 focus-visible:ring-ring/50",
            tab.id === current ? "border-nia-blue text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
