"use client";

import { useId, useState } from "react";
import { Search, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { rankTemplates } from "@/features/templates/search";
import { COMING_SOON, type GalleryTemplate } from "@/features/templates/gallery";
import { FlatIcon } from "@/features/templates/components/flat-icon";
import { searchFieldInput, searchFieldShell } from "@/components/nia/filter-bar";

// The Templates search box (TEMPLATES_BUILD.md build step 4, prototype TemplateSearch):
// "Search {n} templates", and while typing a list of the top 5 matches (the first marked
// "Best match", each with the words it matched) plus "See all results". Arrow keys move,
// Enter opens the highlighted match or shows all results, Escape closes the list.
export function TemplateSearch({
  templates,
  familyLabels,
  query,
  onQueryChange,
  onCommit,
  onPick,
}: {
  templates: GalleryTemplate[];
  familyLabels: Record<string, string>;
  query: string;
  onQueryChange: (next: string) => void;
  onCommit: (query: string) => void;
  onPick: (template: GalleryTemplate) => void;
}) {
  const id = useId();
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(0);
  const results = query.trim().length > 1 ? rankTemplates(query, templates, familyLabels).slice(0, 5) : [];
  const open = focused && query.trim().length > 1;
  // The last row is "See all results", one past the matches.
  const seeAll = results.length;
  const optionId = (i: number) => `${id}-option-${i}`;

  const close = (input?: HTMLInputElement | null) => {
    setFocused(false);
    input?.blur();
  };
  const choose = (i: number, input?: HTMLInputElement | null) => {
    if (i < results.length) onPick(results[i].template);
    else onCommit(query.trim());
    close(input);
  };

  return (
    <div className="relative w-full max-w-190">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          choose(open ? active : seeAll, e.currentTarget.querySelector("input"));
        }}
        className={cn(searchFieldShell, "pr-4")}
      >
        <Search aria-hidden className="size-4.5 shrink-0" />
        <label htmlFor="tpl-search" className="sr-only">Search templates</label>
        <input
          id="tpl-search"
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={open ? optionId(active) : undefined}
          value={query}
          onChange={(e) => {
            onQueryChange(e.target.value);
            setActive(0);
            setFocused(true);
          }}
          onFocus={() => setFocused(true)}
          // Wait a beat so a click on a suggestion lands before the list closes.
          onBlur={() => setTimeout(() => setFocused(false), 120)}
          onKeyDown={(e) => {
            if (!open) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((i) => Math.min(seeAll, i + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => Math.max(0, i - 1));
            } else if (e.key === "Escape") {
              e.preventDefault();
              close(e.currentTarget);
            }
          }}
          placeholder={`Search ${templates.length} templates`}
          autoComplete="off"
          className={searchFieldInput}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              onQueryChange("");
              onCommit("");
            }}
            aria-label="Clear search"
            className="flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <X aria-hidden className="size-3" />
          </button>
        )}
      </form>

      {open && (
        <div
          id={`${id}-list`}
          role="listbox"
          aria-label="Suggested templates"
          className="absolute inset-x-0 top-16 z-50 rounded-2xl border border-border bg-popover p-2 shadow-menu duration-fast animate-in fade-in-0 slide-in-from-top-1"
        >
          {results.length === 0 && (
            <p className="px-3 py-3.5 text-small leading-relaxed text-muted-foreground">
              No template matches that yet. Try a role (&ldquo;line producer&rdquo;), a deliverable (&ldquo;call sheet&rdquo;) or what you&rsquo;re shooting (&ldquo;music video&rdquo;).
            </p>
          )}
          {results.map((r, i) => (
            <div
              key={r.template.code}
              id={optionId(i)}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(i)}
              className={cn("flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2.25", i === active && "bg-secondary")}
            >
              <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card", r.template.status === "gap" && "opacity-45")}>
                <FlatIcon name={r.template.icon} size="sm" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{r.template.name}</span>
                  {i === 0 && <Tag>Best match</Tag>}
                  {r.template.status === "gap" && <Tag muted>{COMING_SOON}</Tag>}
                </span>
                <span className="mt-0.5 block truncate text-caption text-muted-foreground">
                  {r.template.stage} · for {r.template.icps.slice(0, 2).join(", ")}
                </span>
              </span>
              <span className="hidden shrink-0 text-micro font-semibold text-foreground sm:block">{r.matched.join(" · ")}</span>
            </div>
          ))}
          <div
            id={optionId(seeAll)}
            role="option"
            aria-selected={active === seeAll}
            onMouseDown={(e) => e.preventDefault()}
            onMouseEnter={() => setActive(seeAll)}
            onClick={() => choose(seeAll)}
            className={cn(
              "mt-1 flex cursor-pointer items-center justify-between rounded-xl border-t border-border px-3 py-2.5 text-small text-foreground/80",
              active === seeAll && "bg-muted",
            )}
          >
            <span>See all results for &ldquo;{query.trim()}&rdquo;</span>
            <span aria-hidden className="text-meta text-muted-foreground">Enter ↵</span>
          </div>
        </div>
      )}
    </div>
  );
}

function Tag({ children, muted = false }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-micro font-semibold", muted ? "border-border text-muted-foreground" : "border-foreground text-foreground")}>
      {children}
    </span>
  );
}
