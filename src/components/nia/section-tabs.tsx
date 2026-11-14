"use client";

import { useRef } from "react";

import { cn } from "@/lib/utils";

// Underlined tabs in the project page's look (project-tabs.tsx): the open one in Nia Blue, an
// optional count beside each, arrow keys, Home and End. Used by the portfolio editor's steps (Ika,
// 2026-11-14: "use navbar style like the projects feature").
export function SectionTabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
  panelId,
  end,
  className,
}: {
  tabs: { id: T; label: string; count?: number }[];
  value: T;
  onChange: (tab: T) => void;
  label: string;
  panelId: string;
  /** At the bar's right end. */
  end?: React.ReactNode;
  className?: string;
}) {
  const buttons = useRef(new Map<T, HTMLButtonElement>());
  const go = (id: T) => {
    onChange(id);
    buttons.current.get(id)?.focus();
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    const i = tabs.findIndex((t) => t.id === value);
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      go(tabs[e.key === "Home" ? 0 : tabs.length - 1].id);
    } else if (step) {
      e.preventDefault();
      go(tabs[(i + step + tabs.length) % tabs.length].id);
    }
  };
  return (
    <div className={cn("flex items-center gap-4 border-b border-border", className)}>
      <div role="tablist" aria-label={label} onKeyDown={onKeyDown} className="flex min-w-0 flex-1 gap-1 overflow-x-auto [scrollbar-width:none]">
        {tabs.map((t) => {
          const on = value === t.id;
          return (
            <button
              key={t.id}
              ref={(node) => {
                if (node) buttons.current.set(t.id, node);
                else buttons.current.delete(t.id);
              }}
              type="button"
              role="tab"
              id={`${panelId}-tab-${t.id}`}
              aria-selected={on}
              aria-controls={panelId}
              tabIndex={on ? 0 : -1}
              onClick={() => onChange(t.id)}
              className={cn(
                "-mb-px flex shrink-0 items-baseline gap-1.5 border-b-2 px-3 pt-4 pb-3.5 text-sm whitespace-nowrap outline-none transition-colors duration-fast focus-visible:ring-3 focus-visible:ring-ring/50",
                on ? "border-nia-blue font-semibold text-foreground" : "border-transparent font-medium text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
              {t.count ? <span className="text-caption font-normal text-muted-foreground">{t.count}</span> : null}
            </button>
          );
        })}
      </div>
      {end}
    </div>
  );
}
