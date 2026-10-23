"use client";

import { useState } from "react";
import Link from "next/link";
import { Clapperboard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/nia/empty-state";
import { ChipMenu, FilterChip, RangeChip, ResultCount, SearchField, type YearRange } from "@/components/nia/filter-bar";
import { CREATORS, creatorFilms, creatorYear, type CreatorFilm } from "@/features/explore/creators";
import { exploreItem } from "@/features/explore/items";
import { exploreHome } from "@/features/explore/made-in-africa";
import { recentFirst, recentViews } from "@/features/explore/views";
import { shuffled } from "@/lib/shuffle";
import { CreatorCredit } from "./creators-strip";
import { FilmGallery } from "./film-gallery";

const ALL = "all";
const SORTS = { relevance: "Relevance", recent: "Recently viewed", title: "Title A–Z", newest: "Newest first", oldest: "Oldest first" } as const;
type Sort = keyof typeof SORTS;
const all = (label: string) => ({ value: ALL, label });

// The lists to narrow by: only values some film has, types in the projects' own order.
const TYPES = [...new Set(creatorFilms.map((f) => f.type))];
const COUNTRIES = [...new Set(creatorFilms.flatMap((f) => (f.country ? [f.country] : [])))].sort((a, b) => a.localeCompare(b));
const YEARS = { min: Math.min(...creatorFilms.map(creatorYear)), max: Math.max(...creatorFilms.map(creatorYear)) };

// How well a film matches the search: its title first, then the brand and who posted it, then
// anyone in its credits, then the rest.
function relevance(f: CreatorFilm, q: string) {
  const title = f.title.toLowerCase();
  if (title.startsWith(q)) return 6;
  if (title.includes(q)) return 5;
  if ([f.brand, f.account].some((x) => x?.toLowerCase().includes(q))) return 4;
  if (f.credits.some((x) => x.name.toLowerCase().includes(q) || x.handle?.toLowerCase().includes(q))) return 3;
  return [f.type, f.country, f.summary].filter(Boolean).join(" ").toLowerCase().includes(q) ? 1 : 0;
}

// Creators, all of it (Ika, 2026-10-22), like Made in Africa's View all: back to Explore, a search
// across titles, brands and everyone credited, a chip per production type, then Country, Year and
// Sort. Films sit in a gallery at their true shape, tagged with their type and frame. Relevance
// without a search is a new order on each visit (`seed`); Recently viewed brings back the films
// this person opened, most recent first (Ika, 2026-10-22).
export function CreatorsAll({ seed }: { seed: number }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<string>(ALL);
  const [country, setCountry] = useState<string>(ALL);
  const [years, setYears] = useState<YearRange>(null);
  const [sort, setSort] = useState<Sort>("relevance");
  // What this person opened, loaded the first time they sort by it.
  const [recent, setRecent] = useState<string[] | null>(null);
  const chooseSort = (next: Sort) => {
    setSort(next);
    if (next === "recent" && recent === null) void recentViews().then(setRecent);
  };

  const q = query.trim().toLowerCase();
  // Everything but the type, so each type chip can say how many it would show.
  const narrowed = creatorFilms.filter((f) => {
    if (q && relevance(f, q) === 0) return false;
    if (country !== ALL && f.country !== country) return false;
    const year = creatorYear(f);
    if (years && (year < years.from || year > years.to)) return false;
    return true;
  });
  const found = type === ALL ? narrowed : narrowed.filter((f) => f.type === type);
  // This visit's order, which settles ties and is the order when nothing else decides.
  const order = new Map(shuffled(creatorFilms, seed).map((f, i) => [f.code, i]));
  const visit = (a: CreatorFilm, b: CreatorFilm) => order.get(a.code)! - order.get(b.code)!;
  const ranked = found.toSorted((a, b) => {
    if (sort === "title") return a.title.localeCompare(b.title);
    if (sort === "newest") return b.date.localeCompare(a.date) || visit(a, b);
    if (sort === "oldest") return a.date.localeCompare(b.date) || visit(a, b);
    return (q ? relevance(b, q) - relevance(a, q) : 0) || visit(a, b);
  });
  const sorted = sort === "recent" ? recentFirst(ranked, recent ?? [], (f) => f.slug) : ranked;
  const anyFilter = q !== "" || type !== ALL || country !== ALL || years !== null;
  const clear = () => {
    setQuery("");
    setType(ALL);
    setCountry(ALL);
    setYears(null);
  };

  return (
    <div className="flex w-full flex-col px-4 pt-10 pb-24 md:px-7.5 lg:pt-12.5">
      <Link
        href={exploreHome()}
        className="w-fit rounded-sm text-sm leading-[1.4] font-bold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        ← Back to Explore
      </Link>

      <div className="mt-8 flex items-center gap-1">
        <h1 className="text-h2 font-semibold tracking-tight text-foreground">{CREATORS.name}</h1>
        <CreatorCredit />
      </div>
      <p className="mt-2 max-w-160 text-lead text-muted-foreground">{CREATORS.description}</p>

      <div className="mt-8 flex flex-col gap-4">
        <SearchField
          label="Search Creators"
          placeholder="Search films, brands, directors, crew..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-150"
        />
        <div role="group" aria-label="Types" className="flex flex-wrap gap-2">
          <FilterChip on={type === ALL} count={narrowed.length} onClick={() => setType(ALL)}>
            All
          </FilterChip>
          {TYPES.map((t) => (
            <FilterChip key={t} on={type === t} count={narrowed.filter((f) => f.type === t).length} onClick={() => setType(t)}>
              {t}
            </FilterChip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ChipMenu label="Country" value={country} defaultValue={ALL} options={[all("All"), ...COUNTRIES.map((c) => ({ value: c, label: c }))]} onChange={setCountry} />
          <RangeChip label="Year" min={YEARS.min} max={YEARS.max} value={years} onChange={setYears} />
          {anyFilter && (
            <Button variant="ghost" size="compact" onClick={clear}>
              Clear all
            </Button>
          )}
          <span className="flex-1" />
          <ResultCount>
            {found.length} {found.length === 1 ? "film" : "films"}
          </ResultCount>
          <ChipMenu label="Sort" value={sort} align="end" options={(Object.keys(SORTS) as Sort[]).map((key) => ({ value: key, label: SORTS[key] }))} onChange={chooseSort} />
        </div>
        {sort === "recent" && recent?.length === 0 && <p className="text-sm text-muted-foreground">Nothing viewed yet. Films you open will show here first.</p>}
      </div>

      {found.length === 0 ? (
        <EmptyState
          icon={Clapperboard}
          message="No films match. Try another type, a wider span of years, or a director's or brand's name."
          action={
            <Button variant="outline" onClick={clear}>
              Clear all
            </Button>
          }
          className="mt-12"
        />
      ) : (
        <FilmGallery
          label="Results"
          className="mt-12"
          entries={sorted.map((f) => {
            const item = exploreItem(f.slug)!;
            return { item, href: item.href("all") };
          })}
        />
      )}
    </div>
  );
}
