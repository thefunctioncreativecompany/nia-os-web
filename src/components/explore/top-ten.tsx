"use client";

import { use } from "react";

import { ScrollRow } from "@/components/nia/scroll-row";
import { exploreItem } from "@/features/explore/items";
import { ExploreCard, cardSpan } from "./title-card";

// Top 10 on Explore (Ika, 2026-10-31; src/features/explore/top.ts): what people on Nia open, save
// and add to projects most, ranked again on every visit. Laid out like the Top 10 press kits (Ika,
// 2026-11-08): one still row, number 1 on the left to 10 on the right, swiped, scrolled or moved
// with the arrows. Each card keeps its film's shape; the rank sits top right on its picture (the
// type label has top left).
export function TopTen({ top }: { top: Promise<string[]> }) {
  const items = use(top).flatMap((slug) => {
    const item = exploreItem(slug);
    return item ? [item] : [];
  });
  return (
    <ScrollRow label="Top 10 on Explore">
      {items.map((item, i) => (
        <li
          key={item.slug}
          className="relative w-[calc(44%*var(--span,1))] flex-none snap-start sm:w-[calc(30%*var(--span,1))] md:w-[calc(22%*var(--span,1))] lg:w-[calc(18%*var(--span,1))]"
          style={cardSpan(item)}
        >
          <span className="sr-only">Number {i + 1}:</span>
          <ExploreCard item={item} href={item.href()} sizes="(min-width: 64rem) 18vw, (min-width: 40rem) 30vw, 44vw" first={i < 5} />
          <span aria-hidden className="pointer-events-none absolute top-1.5 right-3 text-rank font-bold text-white drop-shadow-md">
            {i + 1}
          </span>
        </li>
      ))}
    </ScrollRow>
  );
}
