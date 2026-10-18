import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type NavPillTab = { href: string; label: string; icon: LucideIcon };

// Compact navbar tabs: the current one is a labelled pill, the others are icons only
// (Figma "31 — Navbar Tab Iterations"). An alternative to the full-label navbar for
// narrow screens.
export function NavPillTabs({ tabs, current, className }: { tabs: NavPillTab[]; current: string; className?: string }) {
  return (
    <nav aria-label="Main" className={className}>
      <ul className="flex items-center gap-1">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = href === current;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                aria-label={active ? undefined : label}
                title={active ? undefined : label}
                className={cn(
                  "flex h-9 items-center gap-1.5 rounded-full text-sm text-muted-foreground outline-none transition-colors duration-fast focus-visible:ring-3 focus-visible:ring-ring/50",
                  active ? "bg-accent px-3.5 font-bold text-foreground" : "w-9 justify-center hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon aria-hidden className="size-[18px]" />
                {active && label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
