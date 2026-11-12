"use client";

import { useRef } from "react";

import { cn } from "@/lib/utils";

export type ProjectTabId = "overview" | "crew" | "documents" | "references" | "comments" | "activity";

export const PROJECT_TABS: { id: ProjectTabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "crew", label: "Crew & talent" },
  { id: "documents", label: "Documents" },
  { id: "references", label: "References" },
  { id: "comments", label: "Comments" },
  { id: "activity", label: "Activity" },
];

export const isProjectTab = (v: string | null): v is ProjectTabId => PROJECT_TABS.some((t) => t.id === v);

/** The panel the tabs control, so a tab change can bring its top into view. */
export const PROJECT_PANEL_ID = "project-panel";

// The project page's tabs (Ika, 2026-11-12, variation 2 "Cover hero with section tabs"): under the
// cover, they stay below the top bar as the page scrolls, each with its count. Arrow keys move
// between them. Picking one while the bar is stuck brings the new tab's top under it.
export function ProjectTabs({
  value,
  onChange,
  counts,
  end,
}: {
  value: ProjectTabId;
  onChange: (tab: ProjectTabId) => void;
  counts: Partial<Record<ProjectTabId, number>>;
  /** At the bar's right end (the saved tick). */
  end?: React.ReactNode;
}) {
  const bar = useRef<HTMLDivElement>(null);
  const tabs = useRef(new Map<ProjectTabId, HTMLButtonElement>());

  const select = (id: ProjectTabId, focus = false) => {
    const el = bar.current;
    const stickAt = el ? parseFloat(getComputedStyle(el).top) || 0 : 0;
    const stuck = el ? el.getBoundingClientRect().top <= stickAt + 1 : false;
    onChange(id);
    if (focus) tabs.current.get(id)?.focus();
    if (!stuck || !el) return;
    requestAnimationFrame(() => {
      const panel = document.getElementById(PROJECT_PANEL_ID);
      if (panel) window.scrollTo({ top: panel.getBoundingClientRect().top + window.scrollY - stickAt - el.offsetHeight - 24 });
    });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const i = PROJECT_TABS.findIndex((t) => t.id === value);
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      select(PROJECT_TABS[e.key === "Home" ? 0 : PROJECT_TABS.length - 1].id, true);
    } else if (step) {
      e.preventDefault();
      select(PROJECT_TABS[(i + step + PROJECT_TABS.length) % PROJECT_TABS.length].id, true);
    }
  };

  return (
    <div
      ref={bar}
      className="sticky top-0 z-20 -mx-4 flex items-center gap-4 border-b border-border bg-background/90 px-4 backdrop-blur-md md:-mx-page md:px-page lg:top-16 print:hidden"
    >
      <div role="tablist" aria-label="Project" onKeyDown={onKeyDown} className="flex min-w-0 flex-1 gap-1 overflow-x-auto [scrollbar-width:none]">
        {PROJECT_TABS.map((t) => {
          const on = value === t.id;
          const n = counts[t.id];
          return (
            <button
              key={t.id}
              ref={(node) => {
                if (node) tabs.current.set(t.id, node);
                else tabs.current.delete(t.id);
              }}
              type="button"
              role="tab"
              id={`project-tab-${t.id}`}
              aria-selected={on}
              aria-controls={PROJECT_PANEL_ID}
              tabIndex={on ? 0 : -1}
              onClick={() => select(t.id)}
              className={cn(
                "-mb-px flex shrink-0 items-baseline gap-1.5 border-b-2 px-3 pt-4 pb-3.5 text-sm whitespace-nowrap outline-none transition-colors duration-fast focus-visible:ring-3 focus-visible:ring-ring/50",
                on ? "border-nia-blue font-semibold text-foreground" : "border-transparent font-medium text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
              {n ? <span className="text-caption font-normal text-muted-foreground">{n}</span> : null}
            </button>
          );
        })}
      </div>
      {end}
    </div>
  );
}
