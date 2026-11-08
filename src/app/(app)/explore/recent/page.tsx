import type { Metadata } from "next";

import { BackLink } from "@/components/nia/back-link";
import { dayLabel } from "@/components/nia/new-marker";
import { ExploreCard } from "@/components/explore/title-card";
import { exploreItem } from "@/features/explore/items";
import { exploreHome } from "@/features/explore/made-in-africa";
import { everyAddition } from "@/features/explore/recent";

export const metadata: Metadata = {
  title: "Recently added · Explore · Nia OS",
};

// View all from Recently added on Explore (Ika, 2026-11-08): everything that has joined Explore,
// newest first, each card with the day it was added.
export default function Page() {
  const items = everyAddition().flatMap(({ slug, added }) => {
    const item = exploreItem(slug);
    return item ? [{ item, added }] : [];
  });
  return (
    <div className="flex flex-1 flex-col gap-8 px-4 pt-10 pb-24 md:px-15">
      <BackLink href={exploreHome()} className="w-fit rounded-sm text-sm leading-[1.4] font-bold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50">
        ← Back to Explore
      </BackLink>
      <h1 className="text-h2 font-semibold text-foreground">Recently added on Explore</h1>
      <ul className="grid grid-cols-2 gap-3.25 sm:grid-cols-3 lg:grid-cols-5">
        {items.map(({ item, added }, i) => (
          <li key={item.slug}>
            <ExploreCard item={item} href={item.href()} sizes="(min-width: 64rem) 20vw, (min-width: 40rem) 33vw, 50vw" note={`Added ${dayLabel(added)}`} first={i < 5} />
          </li>
        ))}
      </ul>
    </div>
  );
}
