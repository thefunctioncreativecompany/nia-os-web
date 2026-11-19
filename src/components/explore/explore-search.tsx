"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChipMenu, ChipRow, FilterChip, ResultCount, searchFieldInput, searchFieldShell } from "@/components/nia/filter-bar";
import { FilmGallery, GalleryCard, POSTER } from "@/components/explore/film-gallery";
import { coversAll, rankExplore, withTags, type SearchDoc, type SearchHit, type TasteMap } from "@/features/explore/search";
import { loadExploreCastCrew, loadExploreSearchIndex } from "@/features/explore/search-index";
import { loadTaste } from "@/features/explore/taste";
import type { ExploreItem } from "@/features/explore/items";
import { servedSized } from "@/lib/served-sized";
import { cn } from "@/lib/utils";

// Explore search (Ika, 2026-11-19), shaped like Templates search: titles, who made them, their cast
// and crew, and their production details. A search box with the top five
// matches as you type ("Best match" first, with the production details it matched), filter menus
// for the production details (Look, Camera, Setting, Mood), and results in place of the rows: the
// best match, then the rest. A tag tapped on a title's page lands here (`?tag=`; Alvin, FB7).
// The search lives in the address (?q=, ?look=…), so Back undoes it and a search can be shared.
// Nothing loads until someone reaches for it; the person's taste (role, opens, saves) breaks ties.

const GROUPS = ["look", "camera", "setting", "mood"] as const;
type Group = (typeof GROUPS)[number];
const ALL = "all";

type Loaded = {
  docs: SearchDoc[];
  itemFor: (slug: string) => ExploreItem | null;
  choices: (docs: SearchDoc[], group: Group) => { id: string; label: string; count: number }[];
  groupOf: (id: string) => string;
  labelOf: (id: string) => string;
  groupLabel: (g: Group) => string;
  taste: TasteMap;
};

async function loadSearch(): Promise<Loaded> {
  const [data, index, castCrew, taste] = await Promise.all([
    import("@/features/explore/search-data"),
    loadExploreSearchIndex().catch(() => null),
    loadExploreCastCrew().catch(() => ({})),
    loadTaste().catch(() => new Map<string, number>()),
  ]);
  return {
    docs: data.searchDocs(index?.titleStudios ?? {}, castCrew),
    itemFor: data.itemFor,
    choices: data.groupChoices,
    groupOf: data.tagGroup,
    labelOf: data.tagLabel,
    groupLabel: data.filterLabel,
    taste,
  };
}

export function ExploreSearch({ count, children }: { count: number; children: ReactNode }) {
  const params = useSearchParams();
  const committed = params.get("q")?.trim() ?? "";
  const chosen = Object.fromEntries(GROUPS.map((g) => [g, params.get(g)])) as Record<Group, string | null>;
  const tag = params.get("tag");
  const active = Boolean(committed || tag || GROUPS.some((g) => chosen[g]));

  const [query, setQuery] = useState(committed);
  const [data, setData] = useState<Loaded | null>(null);
  const loading = useRef<Promise<void> | null>(null);
  const load = useCallback(() => {
    loading.current ??= loadSearch().then(setData, () => {
      loading.current = null;
    });
  }, []);
  // A search in the address (a shared link, a tag from a title's page, Back) loads at once.
  useEffect(() => {
    if (active) load();
  }, [active, load]);
  // Keep the box in step when Back or a link changes the search.
  const [shown, setShown] = useState(committed);
  if (shown !== committed) {
    setShown(committed);
    setQuery(committed);
  }

  // Changes the search in the address without reloading the page; each change is a step Back undoes.
  const update = (next: Partial<Record<Group | "q" | "tag", string | null>>) => {
    const url = new URL(window.location.href);
    for (const [key, value] of Object.entries(next)) {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    window.history.pushState(null, "", url);
  };

  // A tag from a title's page that one of the menus offers becomes that menu's choice.
  useEffect(() => {
    if (!data || !tag) return;
    const group = data.groupOf(tag) as Group;
    if (!GROUPS.includes(group)) return;
    const url = new URL(window.location.href);
    url.searchParams.delete("tag");
    url.searchParams.set(group, tag);
    window.history.replaceState(null, "", url);
  }, [data, tag]);

  const picked = GROUPS.flatMap((g) => (chosen[g] ? [chosen[g]!] : []));
  const extraTag = tag && data && !GROUPS.includes(data.groupOf(tag) as Group) ? tag : null;
  const narrowedTo = [...picked, ...(extraTag ? [extraTag] : [])];
  const narrowKey = narrowedTo.join(",");
  const pool = useMemo(() => (data ? withTags(data.docs, narrowKey ? narrowKey.split(",") : [], data.taste) : []), [data, narrowKey]);
  const hits: SearchHit[] | null = data && committed ? rankExplore(committed, pool, data.taste) : null;
  const found = hits ? hits.length : pool.length;

  // What the menus choose from: the search's results (or everything), so no choice ends in nothing.
  const searched = useMemo(() => (data && committed ? rankExplore(committed, data.docs).map((h) => h.doc) : (data?.docs ?? [])), [data, committed]);

  const clear = () => {
    setQuery("");
    update({ q: null, tag: null, look: null, camera: null, setting: null, mood: null });
  };

  return (
    <>
      <div className="mt-6 flex flex-col gap-4.5" onPointerEnter={load} onFocusCapture={load} onTouchStart={load}>
        <SearchBox
          count={count}
          query={query}
          data={data}
          pool={pool}
          onQueryChange={(next) => {
            setQuery(next);
            if (!next && committed) update({ q: null });
          }}
          onCommit={(q) => update({ q: q || null })}
        />
        <ChipRow role="group" aria-label="Filter by production details">
          {GROUPS.map((g) => {
            // Each menu offers what the search and the other choices leave.
            const others = withTags(searched, narrowedTo.filter((id) => id !== chosen[g]));
            const choices = data ? data.choices(others, g) : [];
            const value = chosen[g] ?? ALL;
            const options = [{ value: ALL, label: "All" }, ...choices.map((c) => ({ value: c.id, label: c.label }))];
            if (value !== ALL && !options.some((o) => o.value === value)) options.push({ value, label: data?.labelOf(value) ?? value });
            return (
              <ChipMenu
                key={g}
                label={data?.groupLabel(g) ?? g[0].toUpperCase() + g.slice(1)}
                value={value}
                defaultValue={ALL}
                columns={options.length > 9 ? 2 : 1}
                options={options}
                onChange={(next) => update({ [g]: next === ALL ? null : next })}
              />
            );
          })}
          {extraTag && data && (
            <FilterChip on onClick={() => update({ tag: null })} aria-label={`Remove ${data.labelOf(extraTag)}`}>
              {data.labelOf(extraTag)}
              <X aria-hidden className="size-3.5" />
            </FilterChip>
          )}
          {active && data && (
            <ResultCount className="ml-auto">
              {found} {found === 1 ? "title" : "titles"}
            </ResultCount>
          )}
        </ChipRow>
      </div>

      {!active ? (
        children
      ) : !data ? (
        <div aria-hidden className="mt-10 flex flex-wrap gap-2">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-60 w-44 rounded-xl" />
          ))}
        </div>
      ) : (
        <section aria-labelledby="explore-results" className="mt-10">
          <div className="mb-6 flex items-start justify-between gap-3">
            <div>
              <h2 id="explore-results" className="text-subtitle font-semibold text-foreground">
                {committed ? <>Results for &ldquo;{committed}&rdquo;</> : narrowedTo.map(data.labelOf).join(" · ")}
              </h2>
              {hits && hits.length > 0 && !coversAll(hits[0]) && (
                <p className="text-small text-muted-foreground">Nothing has everything you typed yet. These are the closest.</p>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={clear}>
              <X aria-hidden />
              Clear
            </Button>
          </div>
          <Results hits={hits} pool={pool} data={data} query={committed} />
        </section>
      )}

      <span className="sr-only" aria-live="polite">
        {active && data ? `${found} ${found === 1 ? "title" : "titles"}` : ""}
      </span>
    </>
  );
}

function Results({ hits, pool, data, query }: { hits: SearchHit[] | null; pool: SearchDoc[]; data: Loaded; query: string }) {
  // Under each card, the production details that found it, unless they're just what was typed
  // ("Shot on film" for "35mm", but not "Golden hour" for "golden hour").
  const typed = query.toLowerCase();
  const entry = (slug: string, why: string[] = []) => {
    const item = data.itemFor(slug);
    const note = why.filter((label) => !typed.includes(label.toLowerCase())).join(" · ");
    return item ? [{ item, href: item.href(), note: note || undefined }] : [];
  };

  if (hits && hits.length === 0) {
    return (
      <p className="max-w-160 rounded-2xl border border-dashed border-border px-6 py-6.5 text-sm leading-relaxed text-muted-foreground">
        Nothing on Explore matches that yet. Try a look (&ldquo;golden hour&rdquo;), a camera (&ldquo;handheld&rdquo;), a place (&ldquo;townships&rdquo;) or who made it.
      </p>
    );
  }
  if (!hits) return <FilmGallery label="Titles" entries={pool.flatMap((d) => entry(d.slug))} />;

  const [best, ...rest] = hits.flatMap((h) => entry(h.doc.slug, h.why));
  if (!best) return null;
  const aspect = best.item.aspect ?? POSTER;
  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
      <div className={cn("w-full shrink-0", aspect > 1 ? "sm:max-w-112" : "max-w-44 sm:max-w-64")}>
        <p className="mb-3 text-micro font-semibold text-muted-foreground">Best match</p>
        <GalleryCard item={best.item} href={best.href} aspect={aspect} first note={best.note} />
      </div>
      {rest.length > 0 && (
        <div className="min-w-0 flex-1">
          <p className="mb-3 text-micro font-semibold text-muted-foreground">Also relevant</p>
          <FilmGallery label="Also relevant" entries={rest} />
        </div>
      )}
    </div>
  );
}

// The box: "Search 471 titles and films", the top five as you type, then "See all results".
// Arrow keys move, Enter opens the highlighted title or shows all results, Escape closes the list.
function SearchBox({
  count,
  query,
  data,
  pool,
  onQueryChange,
  onCommit,
}: {
  count: number;
  query: string;
  data: Loaded | null;
  pool: SearchDoc[];
  onQueryChange: (next: string) => void;
  onCommit: (query: string) => void;
}) {
  const id = useId();
  const router = useRouter();
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(0);
  const typed = query.trim();
  const results = data && typed.length > 1 ? rankExplore(typed, pool, data.taste).slice(0, 5) : [];
  const open = focused && typed.length > 1 && !!data;
  const seeAll = results.length;
  const optionId = (i: number) => `${id}-option-${i}`;

  const choose = (i: number, input?: HTMLInputElement | null) => {
    const item = i < results.length ? data?.itemFor(results[i].doc.slug) : null;
    if (item) router.push(item.href());
    else onCommit(typed);
    setFocused(false);
    input?.blur();
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
        <label htmlFor={`${id}-input`} className="sr-only">
          Search Explore
        </label>
        <input
          id={`${id}-input`}
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
              setFocused(false);
              e.currentTarget.blur();
            }
          }}
          placeholder={`Search ${count} titles and films`}
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
          aria-label="Suggested titles"
          className="absolute inset-x-0 top-16 z-50 rounded-2xl border border-border bg-popover p-2 shadow-menu duration-fast animate-in fade-in-0 slide-in-from-top-1"
        >
          {results.length === 0 && (
            <p className="px-3 py-3.5 text-small leading-relaxed text-muted-foreground">
              Nothing on Explore matches that yet. Try a look (&ldquo;golden hour&rdquo;), a camera (&ldquo;handheld&rdquo;) or a place (&ldquo;townships&rdquo;).
            </p>
          )}
          {results.map((r, i) => {
            const item = data?.itemFor(r.doc.slug);
            if (!item) return null;
            return (
              <div
                key={r.doc.slug}
                id={optionId(i)}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(i)}
                className={cn("flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2", i === active && "bg-secondary")}
              >
                <span className={cn("relative size-10 shrink-0 overflow-hidden rounded-lg", item.image ? "bg-muted" : item.grain)}>
                  {item.image && <Image src={item.image} unoptimized={servedSized(item.image)} alt="" fill sizes="40px" className="object-cover" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{item.title}</span>
                    {i === 0 && <span className="rounded-full border border-foreground px-2 py-0.5 text-micro font-semibold text-foreground">Best match</span>}
                  </span>
                  <span className="mt-0.5 block truncate text-caption text-muted-foreground">{item.credit}</span>
                </span>
                {r.why.length > 0 && <span className="hidden shrink-0 text-micro font-semibold text-foreground sm:block">{r.why.join(" · ")}</span>}
              </div>
            );
          })}
          <div
            id={optionId(seeAll)}
            role="option"
            aria-selected={active === seeAll}
            onMouseDown={(e) => e.preventDefault()}
            onMouseEnter={() => setActive(seeAll)}
            onClick={() => choose(seeAll)}
            className={cn("mt-1 flex cursor-pointer items-center justify-between rounded-xl border-t border-border px-3 py-2.5 text-small text-foreground/80", active === seeAll && "bg-muted")}
          >
            <span>See all results for &ldquo;{typed}&rdquo;</span>
            <span aria-hidden className="text-meta text-muted-foreground">
              Enter ↵
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
