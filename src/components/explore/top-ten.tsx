"use client";

import { use } from "react";

import { ScrollRow } from "@/components/nia/scroll-row";
import { exploreItem } from "@/features/explore/items";
import { TrailerCell } from "./trailer-cell";

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
        <TrailerCell key={item.slug} item={item} first={i < 5} className="relative" before={<span className="sr-only">Number {i + 1}:</span>}>
          {/* Hidden while the trailer plays: nothing may cover YouTube's player. */}
          <span aria-hidden className="pointer-events-none absolute top-1.5 right-3 text-rank font-bold text-white drop-shadow-md transition-opacity duration-fast [[data-open]_&]:opacity-0">
            {i + 1}
          </span>
        </TrailerCell>
      ))}
    </ScrollRow>
  );
}
