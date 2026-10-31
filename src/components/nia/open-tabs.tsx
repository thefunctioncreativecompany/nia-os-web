"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FileText, Folder, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { closeTab, openTab, useOpenTabs, type OpenTab } from "@/lib/open-tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

/** Puts the page that's showing into the open tabs (project and document pages). */
export function RegisterTab({ href, title, kind }: OpenTab) {
  useEffect(() => openTab({ href, title, kind }), [href, title, kind]);
  return null;
}

// Whether a tab's address is the one showing (its path, and any ?doc= it names).
function useIsShowing() {
  const pathname = usePathname();
  const params = useSearchParams();
  return (href: string) => {
    const url = new URL(href, "https://nia.local");
    return url.pathname === pathname && [...url.searchParams].every(([k, v]) => params.get(k) === v);
  };
}

function useClose() {
  const router = useRouter();
  const showing = useIsShowing();
  return (tab: OpenTab) => {
    const next = closeTab(tab.href);
    if (showing(tab.href)) router.push(next ?? (tab.kind === "project" ? "/projects" : "/templates"));
  };
}

const Icon = ({ kind, className }: { kind: OpenTab["kind"]; className?: string }) =>
  kind === "project" ? <Folder aria-hidden className={className} /> : <FileText aria-hidden className={className} />;

// Desktop: the open tabs as a strip under the navbar. Middle-click or × closes one.
export function TabStrip() {
  const tabs = useOpenTabs();
  const showing = useIsShowing();
  const close = useClose();
  if (!tabs.length) return null;

  return (
    <nav aria-label="Open tabs" className="flex h-10 shrink-0 items-end gap-1 overflow-x-auto border-b border-nia-line bg-muted px-15 [scrollbar-width:none] max-lg:hidden print:hidden">
      {tabs.map((tab) => {
        const active = showing(tab.href);
        return (
          <div
            key={tab.href}
            onAuxClick={(e) => {
              if (e.button === 1) {
                e.preventDefault();
                close(tab);
              }
            }}
            className={cn(
              "group relative -mb-px flex h-8.5 max-w-60 min-w-0 shrink-0 items-center rounded-t-lg border border-b-0 text-small transition-colors duration-fast",
              active ? "border-nia-line bg-card text-foreground" : "border-transparent text-muted-foreground hover:bg-card/60 hover:text-foreground",
            )}
          >
            <Link
              href={tab.href}
              aria-current={active ? "page" : undefined}
              title={tab.title}
              className="flex h-full min-w-0 flex-1 items-center gap-2 rounded-t-lg pr-1 pl-3 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <Icon kind={tab.kind} className="size-3.5 shrink-0" />
              <span className="truncate">{tab.title}</span>
            </Link>
            <button
              type="button"
              onClick={() => close(tab)}
              aria-label={`Close ${tab.title}`}
              className={cn(
                "mr-1.5 grid size-5 shrink-0 place-items-center rounded-sm text-muted-foreground outline-none hover:bg-secondary hover:text-foreground focus-visible:opacity-100 focus-visible:ring-3 focus-visible:ring-ring/50",
                active ? "opacity-100" : "opacity-0 group-hover:opacity-100",
              )}
            >
              <X className="size-3.5" />
            </button>
          </div>
        );
      })}
    </nav>
  );
}

// Phones and tablets: a tab counter in the top bar that lists the open tabs.
export function TabCounter() {
  const tabs = useOpenTabs();
  const showing = useIsShowing();
  const close = useClose();
  const router = useRouter();
  if (!tabs.length) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`${tabs.length} open ${tabs.length === 1 ? "tab" : "tabs"}`}
        className="grid size-8 shrink-0 place-items-center rounded-md border-[1.5px] border-foreground text-small font-bold text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50 lg:hidden"
      >
        {tabs.length}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Open tabs</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {tabs.map((tab) => (
          <DropdownMenuItem key={tab.href} onSelect={() => router.push(tab.href)} className={cn("gap-2.5", showing(tab.href) && "font-semibold")}>
            <Icon kind={tab.kind} className="size-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate">{tab.title}</span>
            <button
              type="button"
              aria-label={`Close ${tab.title}`}
              onClick={(e) => {
                e.stopPropagation();
                close(tab);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="grid size-6 shrink-0 place-items-center rounded-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
