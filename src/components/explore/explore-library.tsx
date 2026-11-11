"use client";
import { ViewAll } from "@/components/nia/view-all";

import { Suspense } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

import { LIBRARY_HREF } from "@/features/explore/made-in-africa";
import { CategorySections } from "./explore-categories";
import type { StudioRow } from "@/features/explore/studios";
import { StudioLogos } from "./studio-strip";
import { TopTen } from "./top-ten";
import { ROW_MAX } from "@/lib/rows";
import { PersonTile, type RowPerson } from "@/components/nia/cast-crew-row";
import { ScrollRow } from "@/components/nia/scroll-row";

// Explore, the library: Ika's Claude Design "ExploreLibrary" as designed (layout, motion, images),
// in the platform's font, colours, buttons and sentence case. Drawn from explore-data.ts. The
// rows under By category come in a new order on each visit (`seed`, Ika 2026-10-22).
// Recently added was removed for now (Ika, 2026-11-08; git tag parked-2026-11-08-recently-added).
export function ExploreLibrary({ seed, top, studios, people = [] }: { seed: number; top: Promise<string[]>; studios: StudioRow[]; people?: RowPerson[] }) {
  return (
    <div className="flex w-full flex-col px-4 pt-10 pb-24 md:px-7.5 lg:pt-12.5">
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

      {/* Top 10 first, then what's new (Ika, 2026-11-08). Headings carry no count or explaining
          line (Ika, 2026-10-30). */}
      <section aria-labelledby="top-ten" className="mt-7">
        <h2 id="top-ten" className="text-subtitle font-semibold text-foreground">
          Top 10 on Explore
        </h2>
        <div className="mt-6">
          <Suspense fallback={<Skeleton className="h-96 rounded-xl" />}>
            <TopTen top={top} />
          </Suspense>
        </div>
      </section>

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
                <li key={p.key} className="w-28 flex-none snap-start sm:w-32 lg:w-36">
                  <PersonTile person={p} />
                </li>
              ))}
            </ScrollRow>
          </div>
        </section>
      )}

      {/* Every category under a heading that shows or hides it (Ika, 2026-10-29). */}
      <CategorySections seed={seed} />
    </div>
  );
}
