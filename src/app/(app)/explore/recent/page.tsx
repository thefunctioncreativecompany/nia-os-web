import type { Metadata } from "next";

import { BackLink } from "@/components/nia/back-link";
import { dayLabel } from "@/components/nia/new-marker";
import { FilmMosaic } from "@/components/explore/film-mosaic";
import { exploreItem } from "@/features/explore/items";
import { exploreHome } from "@/features/explore/made-in-africa";
import { everyAddition } from "@/features/explore/recent";

export const metadata: Metadata = {
  title: "Recently added · Explore · Nia OS",
};

// View all from Recently added on Explore (Ika, 2026-11-08): everything that has joined Explore,
// newest first, each with the day it was added, as a mosaic of true shapes with no gaps, filled
// across so the newest sit along the top (FilmMosaic).
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
      <FilmMosaic label="Recently added on Explore" entries={items.map(({ item: { href, ...item }, added }) => ({ item, href: href(), note: `Added ${dayLabel(added)}` }))} />
    </div>
  );
}
