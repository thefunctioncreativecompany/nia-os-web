"use client";
import { ViewAll } from "@/components/nia/view-all";

import { Suspense } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

import { BEST_OF_2026, BEST_OF_2026_HREF, BEST_OF_2026_MIN, LIBRARY_HREF, bestOf2026 } from "@/features/explore/made-in-africa";
import { CategorySections } from "./explore-categories";
import { CategoryStrip } from "./category-strip";
import type { StudioRow } from "@/features/explore/studios";
import { LogoPlate, StudioLogos } from "./studio-strip";
import { festivalHref } from "./festival-all";
import type { FestivalRow } from "@/features/explore/festivals";
import { TopTen } from "./top-ten";
import { ExploreSearch } from "./explore-search";
import { ROW_MAX } from "@/lib/rows";
import { exploreItem } from "@/features/explore/items";
import { TrailerCell } from "./trailer-cell";
import { PersonTile, type RowPerson } from "@/components/nia/cast-crew-row";
import { ScrollRow, TEN_ACROSS } from "@/components/nia/scroll-row";
import { cn } from "@/lib/utils";

// Explore, the library: Ika's Claude Design "ExploreLibrary" as designed (layout, motion, images),
// in the platform's font, colours, buttons and sentence case. Drawn from explore-data.ts. The
// rows under By category come in a new order on each visit (`seed`, Ika 2026-10-22).
// Recently added is back under Top 10 as a row like the others (Ika, 2026-11-21).
export function ExploreLibrary({ seed, top, recent = [], studios, people = [], festivals = [], inSeason = [], searchCount }: { seed: number; top: Promise<string[]>; recent?: string[]; studios: StudioRow[]; people?: RowPerson[]; festivals?: FestivalRow[]; inSeason?: string[]; searchCount: number }) {
  return (
    <div className="flex w-full flex-col px-4 pt-10 pb-24 md:px-page lg:pt-12.5">
      {/* Opens the whole library as one canvas (Ika, 2026-10-21). */}
      <h1 id="explore-all" className="text-h2 font-semibold tracking-tight text-foreground">
        <Link
          href={LIBRARY_HREF}
          className="group inline-flex items-center gap-3.5 rounded-md outline-none hover:text-foreground/80 focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Explore all
          <ChevronRight aria-hidden className="size-5.5 transition-transform duration-fast ease-out group-hover:translate-x-1 motion-reduce:translate-x-0!" strokeWidth={2} />
        </Link>
      </h1>

      {/* Search and production-detail filters (Ika, 2026-11-19); results take the rows' place. */}
      <ExploreSearch count={searchCount}>
      {/* Best of 2026 leads, above Top 10 (Ika, 2026-11-15), once enough of its twenty are here;
          it isn't repeated under By category. */}
      {bestOf2026.length >= BEST_OF_2026_MIN && (
        <section aria-labelledby="best-of-2026" className="mt-7">
          <div className="flex items-center justify-between gap-3">
            <h2 id="best-of-2026" className="text-subtitle font-semibold text-foreground">
              {BEST_OF_2026.name}
            </h2>
            <ViewAll href={BEST_OF_2026_HREF} />
          </div>
          <div className="mt-6">
            <CategoryStrip category="best-of-2026" seed={seed} />
          </div>
        </section>
      )}

      {/* Top 10, then what's new (Ika, 2026-11-08). Headings carry no count or explaining
          line (Ika, 2026-10-30). */}
      <section aria-labelledby="top-ten" className="mt-12">
        <h2 id="top-ten" className="text-subtitle font-semibold text-foreground">
          Top 10 on Explore
        </h2>
        <div className="mt-6">
          <Suspense fallback={<Skeleton className="h-96 rounded-xl" />}>
            <TopTen top={top} />
          </Suspense>
        </div>
      </section>

      {/* Recently added, just under Top 10 (Ika, 2026-11-21): ten of the newest week's additions,
          newest first, a different ten on each visit; View all has everything, newest first. */}
      {recent.length > 0 && (
        <section aria-labelledby="recently-added" className="mt-12">
          <div className="flex items-center justify-between gap-3">
            <h2 id="recently-added" className="text-subtitle font-semibold text-foreground">
              Recently added
            </h2>
            <ViewAll href="/explore/recent" />
          </div>
          <div className="mt-6">
            <ScrollRow label="Recently added">
              {recent.flatMap((slug) => {
                const item = exploreItem(slug);
                return item ? [<TrailerCell key={slug} item={item} />] : [];
              })}
            </ScrollRow>
          </div>
        </section>
      )}

      {/* By studio, just under Top 10 (Ika, 2026-11-10): logos that open each studio's View all. */}
      {studios.length > 0 && (
        <section aria-labelledby="by-studio" className="mt-12">
          <div className="flex items-center justify-between gap-3">
            <h2 id="by-studio" className="text-subtitle font-semibold text-foreground">
              By studio
            </h2>
            {studios.length > ROW_MAX && <ViewAll href="/explore/studios" />}
          </div>
          <div className="mt-6">
            <StudioLogos rows={studios.slice(0, ROW_MAX)} />
          </div>
        </section>
      )}

      {/* By cast & crew, under By studio (Ika, 2026-11-10): the ten people credited on the most
          things on Explore; each opens their page. View all has everyone with three or more. */}
      {people.length > 0 && (
        <section aria-labelledby="by-cast-crew" className="mt-12">
          <div className="flex items-center justify-between gap-3">
            <h2 id="by-cast-crew" className="text-subtitle font-semibold text-foreground">
              By cast &amp; crew
            </h2>
            <ViewAll href="/explore/people" />
          </div>
          <div className="mt-6">
            <ScrollRow label="Cast and crew">
              {people.map((p) => (
                <li key={p.key} className={cn("w-28 flex-none snap-start sm:w-32", TEN_ACROSS)}>
                  <PersonTile person={p} fill />
                </li>
              ))}
            </ScrollRow>
          </div>
        </section>
      )}

      {/* By festival, under By cast & crew (Ika, 2026-11-15): only festivals where titles on Explore
          screened or won; each logo opens the festival's titles. */}
      {festivals.length > 0 && (
        <section aria-labelledby="by-festival" className="mt-12">
          <h2 id="by-festival" className="text-subtitle font-semibold text-foreground">
            By festival
          </h2>
          <div className="mt-6">
            <ScrollRow label="Festivals">
              {festivals.map((f) => (
                <li key={f.id} className={cn("w-[22%] flex-none snap-start sm:w-[15%] md:w-[11%]", TEN_ACROSS)}>
                  <LogoPlate href={festivalHref(f.id)} name={f.name} logo={f.logo} count={f.slugs.length} />
                </li>
              ))}
            </ScrollRow>
          </div>
        </section>
      )}

      {/* Every category under a heading that shows or hides it (Ika, 2026-10-29). */}
      <CategorySections seed={seed} inSeason={inSeason} />
      </ExploreSearch>
    </div>
  );
}
