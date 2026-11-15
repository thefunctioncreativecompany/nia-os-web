"use client";

import { use } from "react";

import { ScrollRow } from "@/components/nia/scroll-row";
import { exploreItem } from "@/features/explore/items";
import { ROW_CELL, ROW_SIZES } from "./row-cell";
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
          className={`relative ${ROW_CELL}`}
          style={cardSpan(item)}
        >
          <span className="sr-only">Number {i + 1}:</span>
          <ExploreCard item={item} href={item.href()} sizes={ROW_SIZES} first={i < 5} />
          <span aria-hidden className="pointer-events-none absolute top-1.5 right-3 text-rank font-bold text-white drop-shadow-md">
            {i + 1}
          </span>
        </li>
      ))}
    </ScrollRow>
  );
}
