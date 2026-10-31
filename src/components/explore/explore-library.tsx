"use client";

import Link from "next/link";
import { ExploreTabs } from "@/components/explore/explore-tabs";
import { ChevronRight } from "lucide-react";

import { DriftColumns } from "@/components/nia/drift-columns";
import { dayLabel } from "@/components/nia/new-marker";
import { exploreItem, type ExploreItem } from "@/features/explore/items";
import { LIBRARY_HREF } from "@/features/explore/made-in-africa";
import type { Added } from "@/features/explore/recent";
import { features } from "@/lib/features";
import { getCategory } from "./explore-data";
import { CategorySections } from "./explore-categories";
import { LatestStrips } from "./latest-strips";
import { ExploreCard } from "./title-card";

// How far each of the five columns slides as the pointer moves down the grid (EXPLORE_SPEC.md),
// in pixels between the top and bottom of the grid. Odd columns also sit higher.
const DRIFT = [-50, 40, -80, 30, -45];
const ODD_OFFSET = -60;

// Explore, the library: Ika's Claude Design "ExploreLibrary" as designed (layout, motion, images),
// in the platform's font, colours, buttons and sentence case. Drawn from explore-data.ts. The
// rows under By category come in a new order on each visit (`seed`, Ika 2026-10-22).
export function ExploreLibrary({ seed, gallery }: { seed: number; gallery: { items: Added[]; thisWeek: boolean } }) {
  const items = gallery.items.flatMap(({ slug, added }) => {
    const item = exploreItem(slug);
    return item ? [{ item, added }] : [];
  });

  return (
    <div className="flex w-full flex-col px-4 pt-10 pb-24 md:px-7.5 lg:pt-12.5">
      {features.exploreFeedShown && <ExploreTabs current="library" className="mb-10" />}
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

      {/* The gallery is what's new (Ika, 2026-10-29): this week's additions, or the latest 20.
          Headings carry no count or explaining line (Ika, 2026-10-30). */}
      <section aria-labelledby="recently-added" className="mt-7">
        <h2 id="recently-added" className="text-subtitle font-semibold text-foreground">
          Recently added on Explore
        </h2>
        <RecentGallery items={items} />
      </section>

      {/* Every category under a heading that shows or hides it (Ika, 2026-10-29). */}
      <CategorySections seed={seed} />
      {features.exploreLatestShown && <LatestStrips category={getCategory("latest")} />}
    </div>
  );
}

// Five columns of posters that drift apart as the pointer moves down them (wide screens only);
// phones and tablets get a plain two- or three-column grid. Each card says when it was added.
function RecentGallery({ items }: { items: { item: ExploreItem; added: string }[] }) {
  return (
    <DriftColumns
      label="Recently added on Explore"
      items={items}
      getKey={({ item }) => item.slug}
      renderItem={({ item, added }) => (
        <ExploreCard item={item} href={item.href()} sizes="(min-width: 64rem) 20vw, (min-width: 40rem) 33vw, 50vw" note={`Added ${dayLabel(added)}`} />
      )}
      drift={DRIFT}
      oddOffset={ODD_OFFSET}
      className="mt-8 lg:-mx-1.5 lg:h-295 lg:overflow-hidden lg:px-1.5"
      gridClassName="grid-cols-2 gap-3.25 sm:grid-cols-3 lg:pt-2.5"
      columnClassName="lg:gap-3.25"
    />
  );
}
