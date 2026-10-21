"use client";

import { useState } from "react";
import Link from "next/link";
import { Clapperboard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/nia/empty-state";
import { FilterChip, ResultCount, SearchField } from "@/components/nia/filter-bar";
import { MADE_IN_AFRICA, exploreHome, madeInAfrica, madeInAfricaCollections, titleHref, type Entry } from "@/features/explore/made-in-africa";
import { TitlePoster } from "./title-poster";

const ALL = "all";

// What a search looks through: the title, who made it, where, where it streams and its pairing.
const haystack = (e: Entry) =>
  [e.title.title, e.title.credit, e.title.countries.join(" "), e.title.platform, e.title.pair_with, e.collection.name].filter(Boolean).join(" ").toLowerCase();

// Made in Africa, all of it (Ika, 2026-10-21): back to Explore, a search, a chip per collection
// (Marketplace's filter look), then each collection's posters in a grid. A poster opens the
// title's page, whose back link returns here.
export function MadeInAfricaAll() {
  const [query, setQuery] = useState("");
  const [collection, setCollection] = useState<string>(ALL);
  const q = query.trim().toLowerCase();
  const found = q ? madeInAfrica.filter((e) => haystack(e).includes(q)) : madeInAfrica;
  const countIn = (slug: string) => found.filter((e) => e.collection.slug === slug).length;
  const groups = madeInAfricaCollections
    .filter((c) => collection === ALL || c.slug === collection)
    .map((c) => ({ collection: c, items: found.filter((e) => e.collection.slug === c.slug) }))
    .filter((g) => g.items.length > 0);
  const shown = groups.reduce((n, g) => n + g.items.length, 0);
  const clear = () => {
    setQuery("");
    setCollection(ALL);
  };

  return (
    <div className="flex w-full flex-col px-4 pt-10 pb-24 md:px-7.5 lg:pt-12.5">
      <Link
        href={exploreHome()}
        className="w-fit rounded-sm text-sm leading-[1.4] font-bold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        ← Back to Explore
      </Link>

      <h1 className="mt-8 text-h2 font-semibold tracking-tight text-foreground">{MADE_IN_AFRICA.name}</h1>
      <p className="mt-2 max-w-160 text-lead text-muted-foreground">{MADE_IN_AFRICA.description}</p>

      <div className="mt-8 flex flex-col gap-4">
        <SearchField
          label="Search Made in Africa"
          placeholder="Search titles, directors, countries..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-150"
        />
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Collections" className="flex flex-wrap gap-2">
            <FilterChip on={collection === ALL} count={found.length} onClick={() => setCollection(ALL)}>
              All
            </FilterChip>
            {madeInAfricaCollections.map((c) => (
              <FilterChip key={c.slug} on={collection === c.slug} count={countIn(c.slug)} onClick={() => setCollection(c.slug)}>
                {c.name}
              </FilterChip>
            ))}
          </div>
          <ResultCount className="ml-auto max-sm:w-full">
            {shown} {shown === 1 ? "title" : "titles"}
          </ResultCount>
        </div>
      </div>

      {groups.length === 0 ? (
        <EmptyState
          icon={Clapperboard}
          message="No titles match. Try a director's name or a country."
          action={
            <Button variant="outline" onClick={clear}>
              Clear search
            </Button>
          }
          className="mt-12"
        />
      ) : (
        groups.map(({ collection: c, items }, g) => (
          <section key={c.slug} aria-labelledby={`collection-${c.slug}`} className="mt-12">
            <h2 id={`collection-${c.slug}`} className="text-subtitle font-semibold text-foreground">
              {c.name} <span className="text-micro font-normal text-muted-foreground">{items.length}</span>
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
            <ul className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {items.map((e, i) => (
                <li key={e.title.slug}>
                  <TitlePoster
                    entry={e}
                    href={titleHref(e.title.slug, true)}
                    first={g === 0 && i === 0}
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
