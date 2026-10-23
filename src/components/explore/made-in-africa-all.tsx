"use client";

import { useState } from "react";
import Link from "next/link";
import { Clapperboard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/nia/empty-state";
import { ChipMenu, FilterChip, RangeChip, ResultCount, SearchField, type YearRange } from "@/components/nia/filter-bar";
import {
  COUNTRY_OPTIONS,
  GENRE_OPTIONS,
  MADE_IN_AFRICA,
  TYPE_OPTIONS,
  YEAR_RANGE,
  exploreHome,
  madeInAfrica,
  madeInAfricaCollections,
  titleHref,
  typeName,
  type Entry,
} from "@/features/explore/made-in-africa";
import { TitleCard } from "./title-card";
import { TmdbCredit } from "./tmdb-credit";

const ALL = "all";
const SORTS = { relevance: "Relevance", title: "Title A–Z", newest: "Newest first", oldest: "Oldest first", country: "Country A–Z" } as const;
type Sort = keyof typeof SORTS;
const all = (label: string) => ({ value: ALL, label });

// How well a title matches the search: its name first, then who made it, then the rest.
function relevance(e: Entry, q: string) {
  const t = e.title;
  const name = t.title.toLowerCase();
  if (name.startsWith(q)) return 6;
  if (name.includes(q)) return 5;
  if (t.credit?.toLowerCase().includes(q)) return 4;
  if (t.countries.some((c) => c.toLowerCase().includes(q))) return 3;
  if (t.genres.some((g) => g.toLowerCase().includes(q))) return 3;
  const rest = [t.platform, t.pair_with, t.study_note, t.recognition, e.collection.name].filter(Boolean).join(" ").toLowerCase();
  return rest.includes(q) ? 1 : 0;
}

// Made in Africa, all of it (Ika, 2026-10-21): back to Explore, a search, a chip per collection,
// then Genre, Country, Year (one year or a span) and Type, in the projects' own genre and
// production-type lists so Explore and projects speak the same language, and Sort. With nothing
// narrowed and Relevance chosen, titles sit in their collections; otherwise one grid.
export function MadeInAfricaAll() {
  const [query, setQuery] = useState("");
  const [collection, setCollection] = useState<string>(ALL);
  const [genre, setGenre] = useState<string>(ALL);
  const [country, setCountry] = useState<string>(ALL);
  const [type, setType] = useState<string>(ALL);
  const [years, setYears] = useState<YearRange>(null);
  const [sort, setSort] = useState<Sort>("relevance");

  const q = query.trim().toLowerCase();
  // Everything but the collection, so each collection chip can say how many it would show.
  const narrowed = madeInAfrica.filter((e) => {
    const t = e.title;
    if (q && relevance(e, q) === 0) return false;
    if (genre !== ALL && !t.genres.includes(genre)) return false;
    if (country !== ALL && !t.countries.includes(country)) return false;
    if (type !== ALL && typeName(t) !== type) return false;
    if (years && (t.year === null || t.year < years.from || t.year > years.to)) return false;
    return true;
  });
  const found = collection === ALL ? narrowed : narrowed.filter((e) => e.collection.slug === collection);
  const order = new Map(madeInAfrica.map((e, i) => [e.title.slug, i]));
  const curated = (a: Entry, b: Entry) => order.get(a.title.slug)! - order.get(b.title.slug)!;
  const sorted = found.toSorted((a, b) => {
    if (sort === "title") return a.title.title.localeCompare(b.title.title);
    if (sort === "newest") return (b.title.year ?? 0) - (a.title.year ?? 0) || curated(a, b);
    if (sort === "oldest") return (a.title.year ?? 9999) - (b.title.year ?? 9999) || curated(a, b);
    if (sort === "country") return a.title.countries[0].localeCompare(b.title.countries[0]) || curated(a, b);
    return (q ? relevance(b, q) - relevance(a, q) : 0) || curated(a, b);
  });
  const anyFilter = q !== "" || genre !== ALL || country !== ALL || type !== ALL || years !== null;
  const grouped = sort === "relevance" && !anyFilter;
  const groups = grouped
    ? madeInAfricaCollections
        .filter((c) => collection === ALL || c.slug === collection)
        .map((c) => ({ id: c.slug, name: c.name, description: c.description, items: sorted.filter((e) => e.collection.slug === c.slug) }))
        .filter((g) => g.items.length > 0)
    : [{ id: "results", name: null, description: null, items: sorted }];
  const clear = () => {
    setQuery("");
    setCollection(ALL);
    setGenre(ALL);
    setCountry(ALL);
    setType(ALL);
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
        <h1 className="text-h2 font-semibold tracking-tight text-foreground">{MADE_IN_AFRICA.name}</h1>
        <TmdbCredit />
      </div>
      <p className="mt-2 max-w-160 text-lead text-muted-foreground">{MADE_IN_AFRICA.description}</p>

      <div className="mt-8 flex flex-col gap-4">
        <SearchField
          label="Search Made in Africa"
          placeholder="Search titles, directors, countries, genres..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-150"
        />
        <div role="group" aria-label="Collections" className="flex flex-wrap gap-2">
          <FilterChip on={collection === ALL} count={narrowed.length} onClick={() => setCollection(ALL)}>
            All
          </FilterChip>
          {madeInAfricaCollections.map((c) => (
            <FilterChip key={c.slug} on={collection === c.slug} count={narrowed.filter((e) => e.collection.slug === c.slug).length} onClick={() => setCollection(c.slug)}>
              {c.name}
            </FilterChip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ChipMenu label="Genre" value={genre} defaultValue={ALL} options={[all("All"), ...GENRE_OPTIONS.map((g) => ({ value: g, label: g }))]} onChange={setGenre} />
          <ChipMenu label="Country" value={country} defaultValue={ALL} columns={2} options={[all("All"), ...COUNTRY_OPTIONS.map((c) => ({ value: c, label: c }))]} onChange={setCountry} />
          <RangeChip label="Year" min={YEAR_RANGE.min} max={YEAR_RANGE.max} value={years} onChange={setYears} />
          <ChipMenu label="Type" value={type} defaultValue={ALL} options={[all("All"), ...TYPE_OPTIONS.map((t) => ({ value: t, label: t }))]} onChange={setType} />
          {(anyFilter || collection !== ALL) && (
            <Button variant="ghost" size="compact" onClick={clear}>
              Clear all
            </Button>
          )}
          <span className="flex-1" />
          <ResultCount>
            {found.length} {found.length === 1 ? "title" : "titles"}
          </ResultCount>
          <ChipMenu label="Sort" value={sort} align="end" options={(Object.keys(SORTS) as Sort[]).map((key) => ({ value: key, label: SORTS[key] }))} onChange={setSort} />
        </div>
      </div>

      {found.length === 0 ? (
        <EmptyState
          icon={Clapperboard}
          message="No titles match. Try another genre, a wider span of years, or a director's name."
          action={
            <Button variant="outline" onClick={clear}>
              Clear all
            </Button>
          }
          className="mt-12"
        />
      ) : (
        groups.map((g, gi) => (
          <section key={g.id} aria-labelledby={g.name ? `collection-${g.id}` : undefined} aria-label={g.name ? undefined : "Results"} className="mt-12">
            {g.name && (
              <>
                <h2 id={`collection-${g.id}`} className="text-subtitle font-semibold text-foreground">
                  {g.name} <span className="text-micro font-normal text-muted-foreground">{g.items.length}</span>
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{g.description}</p>
              </>
            )}
            <ul className={g.name ? "mt-5 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" : "grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"}>
              {g.items.map((e, i) => (
                <li key={e.title.slug}>
                  <TitleCard
                    entry={e}
                    href={titleHref(e.title.slug, "all")}
                    first={gi === 0 && i === 0}
                    sizes="(min-width: 80rem) 18vw, (min-width: 64rem) 23vw, (min-width: 40rem) 31vw, 48vw"
                  />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
