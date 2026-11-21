"use client";

import { BackLink } from "@/components/nia/back-link";
import { exploreItem } from "@/features/explore/items";
import { exploreHome } from "@/features/explore/made-in-africa";
import type { FranchiseRow } from "@/features/explore/franchises";
import { ExploreCard } from "./title-card";

// A franchise's page (Ika, 2026-11-21), opened from the franchise row on any of its titles or from
// search: its name, how many titles, then each film and series in release order, in a grid that
// fills from the left.
export function FranchiseAll({ row }: { row: FranchiseRow }) {
  const items = row.slugs.flatMap((slug) => {
    const item = exploreItem(slug);
    return item ? [item] : [];
  });

  return (
    <div className="flex w-full flex-col px-4 pt-10 pb-24 md:px-page lg:pt-12.5">
      <BackLink
        href={exploreHome()}
        className="w-fit rounded-sm text-sm leading-[1.4] font-bold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        ← Back to Explore
      </BackLink>

      <div className="mt-8 flex flex-col gap-1">
        <h1 className="text-h2 font-semibold tracking-tight text-foreground">{row.name}</h1>
        <p className="text-sm text-muted-foreground">
          {items.length} {items.length === 1 ? "title" : "titles"} on Explore
        </p>
      </div>

      <ul className="mt-10 grid grid-cols-2 items-start gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((item, i) => (
          <li key={item.slug}>
            <ExploreCard item={item} href={item.href()} first={i < 5} sizes="(min-width: 80rem) 18vw, (min-width: 64rem) 23vw, (min-width: 40rem) 31vw, 48vw" />
          </li>
        ))}
      </ul>
    </div>
  );
}
