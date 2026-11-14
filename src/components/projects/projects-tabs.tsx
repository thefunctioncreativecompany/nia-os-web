"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const TABS = [
  { label: "Projects", href: "/projects" },
  { label: "Collections", href: "/projects/collections" },
] as const;

// Projects and Collections (Ika, 2026-10-21: titles saved from Explore live under Projects), in
// the Settings tabs' look: the name over a 3px underline, Nia Blue on the open one. Portfolios
// (beta) shows for the accounts allowed to try it (ProjectsNav decides on the server).
export function ProjectsTabs({ portfolios = false }: { portfolios?: boolean }) {
  const path = usePathname();
  const tabs = portfolios ? [...TABS, { label: "Portfolios", href: "/projects/portfolios" }] : TABS;
  return (
    <nav aria-label="Projects" className="-mx-4 flex h-12 items-end gap-8 overflow-x-auto border-b border-border px-4 whitespace-nowrap md:mx-0 md:px-0">
      {tabs.map((tab) => {
        const active = tab.href === "/projects/portfolios" ? path.startsWith(tab.href) : path === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-full flex-col justify-end gap-3 text-sm leading-[1.4] outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              active ? "font-bold text-foreground" : "font-medium text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="flex items-center gap-1.5">
              {tab.label}
              {tab.href === "/projects/portfolios" && <span className="rounded-full bg-muted px-1.5 py-0.5 text-micro font-semibold text-muted-foreground">Beta</span>}
            </span>
            <span aria-hidden className={cn("h-0.75 w-full rounded-full", active ? "bg-nia-blue" : "bg-transparent")} />
          </Link>
        );
      })}
    </nav>
  );
}
