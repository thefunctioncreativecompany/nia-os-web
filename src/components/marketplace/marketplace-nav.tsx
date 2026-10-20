import Link from "next/link";

import { cn } from "@/lib/utils";
import { features } from "@/lib/features";

type Page = "browse" | "rentals" | "dashboard";

// Under the top bar on every Marketplace page (MARKETPLACE_SPEC.md §2): Browse | My rentals |
// Lister dashboard. Same shape as the Settings tabs: each name over a 3px underline, gold on the
// page you're on. Pages not built yet show but can't be chosen.
export function MarketplaceNav({ current }: { current: Page }) {
  const home = features.marketplaceUnlocked ? "/marketplace" : "/marketplace/preview";
  const tabs: { page: Page; label: string; href: string | null }[] = [
    { page: "browse", label: "Browse", href: home },
    { page: "rentals", label: "My rentals", href: null },
    { page: "dashboard", label: "Lister dashboard", href: null },
  ];
  const shape = "flex h-full flex-col justify-end gap-3 text-sm leading-[1.4] outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

  return (
    <nav aria-label="Marketplace" className="flex h-11 items-end gap-8 overflow-x-auto border-b border-border whitespace-nowrap">
      {tabs.map((tab) => {
        const active = tab.page === current;
        const inner = (
          <>
            {tab.label}
            <span aria-hidden className={cn("h-0.75 w-full rounded-full", active ? "bg-gold" : "bg-transparent")} />
          </>
        );
        if (!tab.href) {
          return (
            <span key={tab.page} aria-disabled="true" title="Coming soon" className={cn(shape, "cursor-not-allowed font-medium text-muted-foreground/70")}>
              {inner}
            </span>
          );
        }
        return (
          <Link
            key={tab.page}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(shape, active ? "font-bold text-foreground" : "font-medium text-muted-foreground hover:text-foreground")}
          >
            {inner}
          </Link>
        );
      })}
    </nav>
  );
}
