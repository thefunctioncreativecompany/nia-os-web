"use client";

import { BackLink } from "@/components/nia/back-link";
import { exploreItem } from "@/features/explore/items";
import { exploreHome } from "@/features/explore/made-in-africa";
import { ExploreCard } from "./title-card";

// Recently added's View all (Ika, 2026-11-21): every title and creator film on Explore, newest
// first, each with the day it joined, in a grid that fills from the left.
export function RecentAll({ entries }: { entries: { slug: string; note: string }[] }) {
  const items = entries.flatMap(({ slug, note }) => {
    const item = exploreItem(slug);
    return item ? [{ item, note }] : [];
  });

  return (
    <div className="flex w-full flex-col px-4 pt-10 pb-24 md:px-page lg:pt-12.5">
      <BackLink
        href={exploreHome()}
        className="w-fit rounded-sm text-sm leading-[1.4] font-bold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        ← Back to Explore
      </BackLink>

      <h1 className="mt-8 text-h2 font-semibold tracking-tight text-foreground">Recently added</h1>

      <ul className="mt-10 grid grid-cols-2 items-start gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.map(({ item, note }, i) => (
          <li key={item.slug}>
            <ExploreCard item={item} href={item.href()} note={note} first={i < 5} sizes="(min-width: 80rem) 18vw, (min-width: 64rem) 23vw, (min-width: 40rem) 31vw, 48vw" />
          </li>
        ))}
      </ul>
    </div>
  );
}
