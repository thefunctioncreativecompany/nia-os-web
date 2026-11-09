"use client";

import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { DriftColumns } from "@/components/nia/drift-columns";
import { dayLabel } from "@/components/nia/new-marker";
import { exploreItem, type ExploreItem } from "@/features/explore/items";
import { LIBRARY_HREF } from "@/features/explore/made-in-africa";
import type { Added } from "@/features/explore/recent";
import { CategorySections } from "./explore-categories";
import type { StudioRow } from "@/features/explore/studios";
import { ExploreCard } from "./title-card";
import { POSTER } from "./film-gallery";
import { TopTen } from "./top-ten";

// How far each of the five columns slides as the pointer moves down the grid (EXPLORE_SPEC.md),
// in pixels between the top and bottom of the grid. Odd columns also sit higher.
const DRIFT = [-50, 40, -80, 30, -45];
const ODD_OFFSET = -60;

// Explore, the library: Ika's Claude Design "ExploreLibrary" as designed (layout, motion, images),
// in the platform's font, colours, buttons and sentence case. Drawn from explore-data.ts. The
// rows under By category come in a new order on each visit (`seed`, Ika 2026-10-22).
export function ExploreLibrary({ seed, gallery, top, studios }: { seed: number; gallery: { items: Added[]; thisWeek: boolean; more: boolean }; top: Promise<string[]>; studios: StudioRow[] }) {
  const items = gallery.items.flatMap(({ slug, added }) => {
    const item = exploreItem(slug);
    return item ? [{ item, added }] : [];
  });

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

      {/* This week's additions, or the latest ones: 15 here, the rest on View all. */}
      <section aria-labelledby="recently-added" className="mt-14">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="recently-added" className="text-subtitle font-semibold text-foreground">
            Recently added on Explore
          </h2>
          {gallery.more && (
            <Button variant="outline" asChild>
              <Link href="/explore/recent">
                View all
                <ArrowRight aria-hidden data-icon="inline-end" />
              </Link>
            </Button>
          )}
        </div>
        <RecentGallery items={items} />
      </section>

      {/* Every category under a heading that shows or hides it (Ika, 2026-10-29). */}
      <CategorySections seed={seed} studios={studios} />
    </div>
  );
}

// Five columns of posters that drift apart as the pointer moves down them (wide screens only);
// phones and tablets get a plain two- or three-column grid. Each card says when it was added.
// Five posters fill the first row on wide screens (two to three on phones and tablets).
const FIRST_ROW = 5;

function RecentGallery({ items }: { items: { item: ExploreItem; added: string }[] }) {
  return (
    <DriftColumns
      label="Recently added on Explore"
      items={items}
      getKey={({ item }) => item.slug}
      // The first row is the page's main picture: fetched at once, not when scrolled to.
      renderItem={({ item, added }, i) => (
        <ExploreCard item={item} href={item.href()} sizes="(min-width: 64rem) 20vw, (min-width: 40rem) 33vw, 50vw" note={`Added ${dayLabel(added)}`} first={i < FIRST_ROW} />
      )}
      drift={DRIFT}
      oddOffset={ODD_OFFSET}
      getAspect={({ item }) => item.aspect ?? POSTER}
      className="mt-8 lg:-mx-1.5 lg:max-h-295 lg:overflow-hidden lg:px-1.5"
      gridClassName="grid-cols-2 gap-3.25 sm:grid-cols-3 lg:pt-2.5"
      columnClassName="lg:gap-3.25"
    />
  );
}
