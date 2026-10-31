"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const TABS = [
  { label: "Projects", href: "/projects" },
  { label: "Collections", href: "/projects/collections" },
] as const;

// Projects and Collections (Ika, 2026-10-21: titles saved from Explore live under Projects), in
// the Settings tabs' look: the name over a 3px underline, Nia Blue on the open one.
export function ProjectsTabs() {
  const path = usePathname();
  return (
    <nav aria-label="Projects" className="-mx-4 flex h-12 items-end gap-8 overflow-x-auto border-b border-border px-4 whitespace-nowrap md:mx-0 md:px-0">
      {TABS.map((tab) => {
        const active = path === tab.href;
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
            {tab.label}
            <span aria-hidden className={cn("h-0.75 w-full rounded-full", active ? "bg-nia-blue" : "bg-transparent")} />
          </Link>
        );
      })}
    </nav>
  );
}
