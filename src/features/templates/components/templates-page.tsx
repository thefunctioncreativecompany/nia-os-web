"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, GalleryHorizontalEnd, LayoutGrid, Rows3, Search, X } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { rankTemplates } from "@/features/templates/search";
import { COMING_SOON, FILTERS, inFilter, type Filter, type GalleryTemplate } from "@/features/templates/gallery";
import { CompactTile } from "@/features/templates/components/compact-tile";
import { IndexItem } from "@/features/templates/components/index-item";
import { TemplateCard } from "@/features/templates/components/template-card";

type View = "showcase" | "compact" | "index";

const compactGrid = "grid grid-cols-[repeat(auto-fill,minmax(min(100%,15.5rem),1fr))] gap-3.5";

// The Templates page (TEMPLATES_BUILD.md §2, build steps 2–3): title, search with the live
// template count, filters, and three views. Search suggestions, the preview pop-up and
// "Suggested for you" come in the next build steps.
export function TemplatesPage({ templates, groups, familyLabels }: { templates: GalleryTemplate[]; groups: string[]; familyLabels: Record<string, string> }) {
  const [view, setView] = useState<View>("showcase");
  const [filter, setFilter] = useState<Filter>("All");
  const [query, setQuery] = useState("");
  const [committed, setCommitted] = useState("");
  const row = useRef<HTMLDivElement>(null);

  // Opening a template: the preview pop-up (build step 5) and the launcher / editor (steps 7–8) come next.
  const open = (t: GalleryTemplate) => {
    toast(t.kind === "workflow" ? "The project launcher comes in a later build step." : `${t.name} opens in the document editor, which is coming soon.`);
  };

  const visible = templates.filter((t) => inFilter(t, filter));
  const featured = visible.filter((t) => t.status !== "gap");
  const results = committed ? rankTemplates(committed, templates, familyLabels).filter((r) => inFilter(r.template, filter)) : null;
  const nudge = (direction: 1 | -1) => {
    const el = row.current;
    if (el) el.scrollBy({ left: direction * Math.min(584, el.clientWidth - 80), behavior: "smooth" });
  };
  const clear = () => {
    setQuery("");
    setCommitted("");
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col pt-10 pb-18">
      <div className="flex flex-col gap-4.5 px-4 md:px-11">
        <h1 className="text-display font-extrabold tracking-tight text-foreground">Templates</h1>

        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            setCommitted(query.trim());
          }}
          className="flex h-14 w-full max-w-190 items-center gap-3 rounded-2xl border border-border bg-white pr-4 pl-4.5 transition-[border-color,box-shadow] duration-fast focus-within:border-foreground focus-within:ring-4 focus-within:ring-foreground/8"
        >
          <Search aria-hidden className="size-4.5 shrink-0 text-muted-foreground" />
          <label htmlFor="tpl-search" className="sr-only">Search templates</label>
          <input
            id="tpl-search"
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!e.target.value) setCommitted("");
            }}
            placeholder={`Search ${templates.length} templates`}
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent text-lead text-foreground outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button type="button" onClick={clear} aria-label="Clear search" className="flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50">
              <X aria-hidden className="size-3" />
            </button>
          )}
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3.5">
          <FilterChips templates={templates} filter={filter} onChange={setFilter} />
          {!results && (
            <div className="flex items-center gap-2">
              {view === "showcase" && (
                <>
                  <Button variant="outline" size="icon-sm" aria-label="Previous templates" onClick={() => nudge(-1)} className="hidden sm:inline-flex"><ChevronLeft /></Button>
                  <Button variant="outline" size="icon-sm" aria-label="Next templates" onClick={() => nudge(1)} className="hidden sm:inline-flex"><ChevronRight /></Button>
                </>
              )}
              <ViewToggle view={view} onChange={setView} />
            </div>
          )}
        </div>
      </div>

      {results ? (
        <section aria-labelledby="results" className="px-4 pt-7.5 md:px-11">
          <div className="mb-4.5 flex items-start justify-between gap-3">
            <div>
              <h2 id="results" className="text-lg font-extrabold text-foreground">Results for &ldquo;{committed}&rdquo;</h2>
              <p className="text-small text-muted-foreground">
                {!results.length
                  ? "Nothing matches yet."
                  : results[0].matched.length < results[0].of
                    ? `No template covers everything you typed yet. These are the closest ${results.length}.`
                    : `${results.length} template${results.length === 1 ? "" : "s"} match${results.length === 1 ? "es" : ""}${filter === "All" ? "" : ` in ${filter.toLowerCase()}`}.`}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={clear}><X />Clear</Button>
          </div>
          {results.length ? (
            <div className="flex flex-wrap items-start gap-7">
              <div className="max-w-140 flex-[1_1_28.75rem]">
                <TemplateCard template={results[0].template} onOpen={open} badge="Best match" className="w-full" />
              </div>
              {results.length > 1 && (
                <div className="min-w-0 flex-[1_1_22.5rem]">
                  <p className="mb-3 font-mono text-micro font-semibold tracking-wider text-muted-foreground uppercase">Also relevant</p>
                  <div className={compactGrid}>
                    {results.slice(1, 13).map((r) => <CompactTile key={r.template.code} template={r.template} onOpen={open} />)}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="max-w-160 rounded-2xl border border-dashed border-border px-6 py-6.5 text-sm leading-relaxed text-muted-foreground">
              No template covers that yet. Try a role (&ldquo;line producer&rdquo;), a deliverable (&ldquo;call sheet&rdquo;) or what you&rsquo;re shooting (&ldquo;music video&rdquo;).
            </p>
          )}
        </section>
      ) : view === "showcase" ? (
        <div ref={row} className="flex snap-x snap-mandatory scroll-px-4 gap-6 overflow-x-auto px-4 pt-7 pb-13 [scrollbar-width:none] md:scroll-px-11 md:px-11">
          {featured.map((t) => <TemplateCard key={t.code} template={t} onOpen={open} />)}
          {featured.length === 0 && <p className="text-sm text-muted-foreground">No templates here yet.</p>}
        </div>
      ) : view === "compact" ? (
        <div className="flex flex-col gap-8.5 px-4 pt-7.5 md:px-11">
          {[...groups, COMING_SOON].map((group) => {
            const items = visible.filter((t) => (group === COMING_SOON ? t.status === "gap" : t.status !== "gap" && t.group === group));
            if (!items.length) return null;
            const id = `group-${group.replace(/\W+/g, "-").toLowerCase()}`;
            return (
              <section key={group} aria-labelledby={id}>
                <div className="mb-3 flex items-center gap-2.5">
                  <span aria-hidden className={cn("size-2.5 rounded-xs", group === COMING_SOON ? "bg-muted-foreground/50" : "bg-foreground")} />
                  <h2 id={id} className="text-lg font-extrabold text-foreground">{group}</h2>
                  <span className="font-mono text-micro font-semibold text-muted-foreground">{items.length}</span>
                </div>
                <div className={compactGrid}>
                  {items.map((t) => <CompactTile key={t.code} template={t} onOpen={open} />)}
                </div>
              </section>
            );
          })}
          {visible.length === 0 && <p className="text-sm text-muted-foreground">No templates here yet.</p>}
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,10.5rem),1fr))] gap-x-5 gap-y-7.5 px-4 pt-9 md:px-11">
          {[...groups.flatMap((g) => visible.filter((t) => t.status !== "gap" && t.group === g)), ...visible.filter((t) => t.status === "gap")].map((t) => (
            <IndexItem key={t.code} template={t} onOpen={open} />
          ))}
        </div>
      )}

      <span className="sr-only" aria-live="polite">
        {results ? `${results.length} results for ${committed}` : `${visible.length} templates${filter === "All" ? "" : ` in ${filter}`}`}
      </span>
    </div>
  );
}

function FilterChips({ templates, filter, onChange }: { templates: GalleryTemplate[]; filter: Filter; onChange: (next: Filter) => void }) {
  return (
    <div role="group" aria-label="Filter templates" className="flex flex-wrap gap-2">
      {FILTERS.map((f) => {
        const on = filter === f;
        return (
          <button
            key={f}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(f)}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-small outline-none transition-colors duration-fast focus-visible:ring-3 focus-visible:ring-ring/50",
              on ? "border-foreground bg-secondary font-semibold text-foreground" : "border-border bg-white text-foreground/80 hover:border-foreground",
            )}
          >
            {f}
            <span className={cn("font-mono text-meta", on ? "text-foreground" : "text-muted-foreground")}>
              {templates.filter((t) => inFilter(t, f)).length}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ViewToggle({ view, onChange }: { view: View; onChange: (next: View) => void }) {
  const options = [
    { value: "showcase" as const, label: "Showcase", icon: GalleryHorizontalEnd },
    { value: "compact" as const, label: "Compact", icon: Rows3 },
    { value: "index" as const, label: "Index", icon: LayoutGrid },
  ];
  return (
    <div role="group" aria-label="Gallery view" className="inline-flex rounded-full border border-border bg-white p-0.75">
      {options.map(({ value, label, icon: Icon }) => {
        const on = view === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(value)}
            className={cn(
              "inline-flex h-7.5 items-center gap-1.5 rounded-full px-3.5 text-small outline-none transition-colors duration-fast focus-visible:ring-3 focus-visible:ring-ring/50",
              on ? "bg-foreground font-semibold text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon aria-hidden className="size-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
