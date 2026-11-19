"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { PersonPicture } from "@/components/nia/cast-crew-row";
import { Skeleton } from "@/components/ui/skeleton";
import { ChipMenu, ChipRow, FilterChip, ResultCount, searchFieldInput, searchFieldShell } from "@/components/nia/filter-bar";
import { FilmGallery, GalleryCard, POSTER, type GalleryEntry } from "@/components/explore/film-gallery";
import { coversAll, rankExplore, withTags, type SearchDoc, type SearchHit, type TasteMap } from "@/features/explore/search";
import { findExploreNames, loadExploreCastCrew, loadExploreSearchIndex, type NameHit } from "@/features/explore/search-index";
import { matchName, pickBest } from "@/features/explore/name-search";
import { initials } from "@/lib/initials";
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
// Names too (2026-11-19, Ika: "display crew/cast profile when searching their name"): people,
// studios and festivals are matched on the server (findExploreNames) and shown as themselves; Best
// match leads with a name when the search is that name, and with a title only when one stands out
// (name-search.ts `pickBest`).

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
  // People, studios and festivals named in the search, asked of the server when it changes.
  const [named, setNamed] = useState<{ q: string; hits: NameHit[] } | null>(null);
  useEffect(() => {
    if (!committed) return;
    let live = true;
    findExploreNames(committed).then(
      (found) => live && setNamed({ q: committed, hits: found }),
      () => live && setNamed({ q: committed, hits: [] }),
    );
    return () => {
      live = false;
    };
  }, [committed]);
  const names = !committed ? [] : named?.q === committed ? named.hits : null;
  const counted = active && data && names ? countLine(found, names) : "";

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
          {counted && <ResultCount className="ml-auto">{counted}</ResultCount>}
        </ChipRow>
      </div>

      {!active ? (
        children
      ) : !data || !names ? (
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
              {hits && hits.length > 0 && !coversAll(hits[0]) && !names.length && (
                <p className="text-small text-muted-foreground">Nothing has everything you typed yet. These are the closest.</p>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={clear}>
              <X aria-hidden />
              Clear
            </Button>
          </div>
          <Results hits={hits} pool={pool} data={data} query={committed} names={names} />
        </section>
      )}

      <span className="sr-only" aria-live="polite">
        {counted}
      </span>
    </>
  );
}

// "1 person · 5 titles": what the search found.
function countLine(titles: number, names: NameHit[]) {
  const kinds: [NameHit["kind"], string, string][] = [
    ["person", "person", "people"],
    ["studio", "studio", "studios"],
    ["festival", "festival", "festivals"],
  ];
  const parts = kinds.flatMap(([kind, one, many]) => {
    const n = names.filter((h) => h.kind === kind).length;
    return n ? [`${n} ${n === 1 ? one : many}`] : [];
  });
  return [...parts, `${titles} ${titles === 1 ? "title" : "titles"}`].join(" · ");
}

// What a name's titles are called under it.
const titlesOf = (hit: NameHit) => (hit.kind === "person" ? `Titles with ${hit.name}` : hit.kind === "studio" ? `From ${hit.name}` : `At ${hit.name}`);
const namesLabel = (names: NameHit[]) =>
  names.every((n) => n.kind === "person") ? "People" : names.every((n) => n.kind !== "person") ? "Studios and festivals" : "People, studios and festivals";
const titleCount = (n: number) => `${n} ${n === 1 ? "title" : "titles"}`;

function Results({ hits, pool, data, query, names }: { hits: SearchHit[] | null; pool: SearchDoc[]; data: Loaded; query: string; names: NameHit[] }) {
  // Under each card, the production details that found it, unless they're just what was typed
  // ("Shot on film" for "35mm", but not "Golden hour" for "golden hour"); under a person's titles,
  // what they did on it ("as MJ").
  const typed = query.toLowerCase();
  const entry = (slug: string, why: string[] = [], line?: string) => {
    const item = data.itemFor(slug);
    const note = line || why.filter((label) => !typed.includes(label.toLowerCase())).join(" · ");
    return item ? [{ item, href: item.href(), note: note || undefined }] : [];
  };

  if (!hits) return <FilmGallery label="Titles" entries={pool.flatMap((d) => entry(d.slug))} />;
  if (hits.length === 0 && names.length === 0) {
    return (
      <p className="max-w-160 rounded-2xl border border-dashed border-border px-6 py-6.5 text-sm leading-relaxed text-muted-foreground">
        Nothing on Explore matches that yet. Try a look (&ldquo;golden hour&rdquo;), a camera (&ldquo;handheld&rdquo;), a place (&ldquo;townships&rdquo;) or who made it.
      </p>
    );
  }

  const best = pickBest(query, names, hits);
  const lead = best?.kind === "name" ? names[0] : null;
  // A name's titles, in its order (top billing first), within any filters chosen.
  const inPool = new Set(pool.map((d) => d.slug));
  const why = new Map(hits.map((h) => [h.doc.slug, h.why]));
  const leadTitles = lead ? lead.titles.filter((t) => inPool.has(t.slug)).flatMap((t) => entry(t.slug, why.get(t.slug), t.label)) : [];
  const shown = new Set(leadTitles.map((e) => e.item.slug));
  const topTitle = best?.kind === "title" ? best.hit : null;
  const rest = hits.filter((h) => h !== topTitle && !shown.has(h.doc.slug)).flatMap((h) => entry(h.doc.slug, h.why));
  const others = names.filter((n) => n !== lead);

  return (
    <div className="flex flex-col gap-14">
      {lead && (
        <BestRow
          best={<NameCard hit={lead} />}
          narrow
          label={titlesOf(lead)}
          entries={leadTitles}
        />
      )}
      {others.length > 0 && <NamesRow label={lead ? `More ${namesLabel(others).toLowerCase()}` : namesLabel(others)} names={others} />}
      {topTitle ? (
        <BestRow
          best={entry(topTitle.doc.slug, topTitle.why).map((e) => <GalleryCard key={e.item.slug} item={e.item} href={e.href} aspect={e.item.aspect ?? POSTER} first note={e.note} />)}
          narrow={(data.itemFor(topTitle.doc.slug)?.aspect ?? POSTER) <= 1}
          label="Also relevant"
          entries={rest}
        />
      ) : (
        rest.length > 0 && (
          <section aria-labelledby="explore-titles">
            <h3 id="explore-titles" className="mb-4 text-subtitle font-semibold text-foreground">
              {lead ? "Other titles" : "Titles"}
            </h3>
            <FilmGallery label={lead ? "Other titles" : "Titles"} entries={rest} />
          </section>
        )
      )}
    </div>
  );
}

// Best match on the left, with a pill that says so, and what goes with it beside it.
function BestRow({ best, narrow, label, entries }: { best: ReactNode; narrow: boolean; label: string; entries: GalleryEntry[] }) {
  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
      <div className={cn("w-full shrink-0", narrow ? "sm:max-w-72" : "sm:max-w-112")}>
        <p className="mb-3 w-fit rounded-full border border-foreground px-2.5 py-0.5 text-micro font-semibold text-foreground">Best match</p>
        {best}
      </div>
      {entries.length > 0 && (
        <section aria-label={label} className="min-w-0 flex-1">
          <h3 className="mb-3 text-small font-semibold text-muted-foreground">{label}</h3>
          <FilmGallery label={label} entries={entries} />
        </section>
      )}
    </div>
  );
}

// What found a title, unless it's just what was typed ("Shot on film" for "35mm", not "Zendaya" for "zendaya").
function Why({ labels, typed }: { labels: string[]; typed: string }) {
  const shown = labels.filter((label) => !typed.toLowerCase().includes(label.toLowerCase()));
  return shown.length > 0 ? <span className="hidden shrink-0 text-micro font-semibold text-foreground sm:block">{shown.join(" · ")}</span> : null;
}

// A person, studio or festival as Best match: their picture, name, what they do and how much of
// theirs is on Explore; the whole card opens their page.
function NameCard({ hit }: { hit: NameHit }) {
  return (
    <Link
      href={hit.href}
      className="hover-sweep group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:flex-col sm:items-start sm:p-5"
    >
      <NamePicture hit={hit} className="size-20 sm:size-32" large />
      <span className="flex min-w-0 flex-col items-start gap-1">
        <span className="text-xl font-semibold tracking-tight text-foreground">{hit.name}</span>
        <span className="text-small text-muted-foreground">
          {[hit.role, `${titleCount(hit.count)} on Explore`].filter(Boolean).join(" · ")}
        </span>
        <span className={cn(buttonVariants({ variant: "secondary", size: "compact" }), "pointer-events-none mt-2")}>
          {hit.kind === "person" ? "View profile" : hit.kind === "studio" ? "View studio" : "View festival"}
        </span>
      </span>
    </Link>
  );
}

// Other names the search found, as round pictures (logos in a rounded square), left to right.
function NamesRow({ label, names }: { label: string; names: NameHit[] }) {
  return (
    <section aria-label={label}>
      <h3 className="mb-4 text-subtitle font-semibold text-foreground">{label}</h3>
      <ul className="grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
        {names.map((n) => (
          <li key={`${n.kind}-${n.key}`} className="flex justify-center">
            <Link href={n.href} className="group flex flex-col items-center gap-2.5 rounded-xl text-center outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
              <NamePicture hit={n} className="group-sweep size-20 sm:size-24" />
              <span className="flex flex-col gap-0.5">
                <span className="line-clamp-2 text-sm leading-snug font-semibold text-foreground">{n.name}</span>
                <span className="line-clamp-2 text-small leading-snug text-muted-foreground">{[n.role, titleCount(n.count)].filter(Boolean).join(" · ")}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

// A person's photo or initials in a circle; a studio's or festival's logo in a rounded square.
function NamePicture({ hit, className, large = false }: { hit: NameHit; className?: string; large?: boolean }) {
  if (hit.kind === "person") return <PersonPicture name={hit.name} photo={hit.photo} className={className} large={large} />;
  return (
    <span className={cn("relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary", className)}>
      {hit.photo ? (
        <Image src={hit.photo} alt="" fill sizes={large ? "128px" : "96px"} className="object-contain p-3" />
      ) : (
        <span className="text-subtitle font-semibold text-muted-foreground">{initials(hit.name)}</span>
      )}
    </span>
  );
}

// The box: "Search 471 titles, people and studios"; as you type, up to three names (people,
// studios, festivals) then the top five titles, Best match marked only when one stands out, then
// "See all results". Arrow keys move, Enter opens the highlighted one or shows all results,
// Escape closes the list.
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
  const ranked = data && typed.length > 1 ? rankExplore(typed, pool, data.taste) : [];
  // People, studios and festivals, asked of the server a beat after typing stops; while the answer
  // is on its way, the last one's names that still fit stay, so the list doesn't flicker.
  const [asked, setAsked] = useState<{ q: string; hits: NameHit[] } | null>(null);
  useEffect(() => {
    if (!data || typed.length < 2) return;
    let live = true;
    const wait = setTimeout(() => {
      findExploreNames(typed).then(
        (hits) => live && setAsked({ q: typed, hits }),
        () => {},
      );
    }, 120);
    return () => {
      live = false;
      clearTimeout(wait);
    };
  }, [data, typed]);
  const found = typed.length < 2 || !asked ? [] : (asked.q === typed ? asked.hits : asked.hits.filter((n) => matchName(typed, n.name))).slice(0, 3);
  // Best match sits at the top, so Enter opens it: the name first when a name leads, the title
  // first (before any names) when a title does.
  const best = pickBest(typed, found, ranked);
  const titleFirst = best?.kind === "title";
  const titles = (titleFirst ? [best.hit, ...ranked.filter((h) => h !== best.hit)] : ranked).flatMap((r) => {
    const item = data?.itemFor(r.doc.slug);
    return item ? [{ kind: "title" as const, r, item }] : [];
  });
  const named = found.map((n) => ({ kind: "name" as const, n }));
  const options = titleFirst ? [...titles.slice(0, 5), ...named] : [...named, ...titles.slice(0, 5)];
  const open = focused && typed.length > 1 && !!data;
  const seeAll = options.length;
  const optionId = (i: number) => `${id}-option-${i}`;

  const choose = (i: number, input?: HTMLInputElement | null) => {
    const option = options[i];
    if (option) router.push(option.kind === "name" ? option.n.href : option.item.href());
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
          placeholder={`Search ${count} titles, people and studios`}
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
          aria-label="Suggestions"
          className="absolute inset-x-0 top-16 z-50 rounded-2xl border border-border bg-popover p-2 shadow-menu duration-fast animate-in fade-in-0 slide-in-from-top-1"
        >
          {options.length === 0 && (
            <p className="px-3 py-3.5 text-small leading-relaxed text-muted-foreground">
              Nothing on Explore matches that yet. Try a look (&ldquo;golden hour&rdquo;), a camera (&ldquo;handheld&rdquo;) or a place (&ldquo;townships&rdquo;).
            </p>
          )}
          {options.map((o, i) => (
            <div
              key={o.kind === "name" ? `${o.n.kind}-${o.n.key}` : o.r.doc.slug}
              id={optionId(i)}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(i)}
              className={cn("flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2", i === active && "bg-secondary")}
            >
              {o.kind === "name" ? (
                <NamePicture hit={o.n} className={cn("size-10", o.n.kind !== "person" && "rounded-lg")} />
              ) : (
                <span className={cn("relative size-10 shrink-0 overflow-hidden rounded-lg", o.item.image ? "bg-muted" : o.item.grain)}>
                  {o.item.image && <Image src={o.item.image} unoptimized={servedSized(o.item.image)} alt="" fill sizes="40px" className="object-cover" />}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{o.kind === "name" ? o.n.name : o.item.title}</span>
                  {i === 0 && best && <span className="rounded-full border border-foreground px-2 py-0.5 text-micro font-semibold text-foreground">Best match</span>}
                </span>
                <span className="mt-0.5 block truncate text-caption text-muted-foreground">
                  {o.kind === "name" ? [o.n.role, titleCount(o.n.count)].filter(Boolean).join(" · ") : o.item.credit}
                </span>
              </span>
              {o.kind === "title" && <Why labels={o.r.why} typed={typed} />}
            </div>
          ))}
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
