"use client";

import { useSyncExternalStore } from "react";

import { GalleryCard, POSTER, type CardItem } from "./film-gallery";

export type MosaicEntry = { item: CardItem; href: string; note?: string };

// A mosaic for lists read in order, newest first (Ika, 2026-11-08: Recently added's View all):
// like FilmGallery, every film at its true shape with no gaps, but filled across rather than down,
// so the first titles sit along the top. Each goes into the shortest column so far; the columns
// stay level. Column count follows the screen (2 on phones, up to 5 on wide screens).

const QUERIES: [string, number][] = [
  ["(min-width: 96rem)", 5],
  ["(min-width: 64rem)", 4],
  ["(min-width: 48rem)", 3],
];
const columnCount = () => QUERIES.find(([q]) => window.matchMedia(q).matches)?.[1] ?? 2;
const onResize = (cb: () => void) => {
  window.addEventListener("resize", cb);
  return () => window.removeEventListener("resize", cb);
};
// Each card's height in column widths: the picture, plus about a third for its lines of text.
const TEXT = 0.35;

export function FilmMosaic({ entries, label }: { entries: MosaicEntry[]; label: string }) {
  const count = useSyncExternalStore(onResize, columnCount, () => 4);
  const columns = Array.from({ length: count }, () => ({ height: 0, items: [] as { entry: MosaicEntry; index: number }[] }));
  entries.forEach((entry, index) => {
    const shortest = columns.reduce((best, col, k) => (col.height < columns[best].height ? k : best), 0);
    columns[shortest].items.push({ entry, index });
    columns[shortest].height += 1 / (entry.item.aspect ?? POSTER) + TEXT;
  });
  return (
    <div role="list" aria-label={label} className="flex gap-5">
      {columns.map((col, k) => (
        <div key={k} className="flex min-w-0 flex-1 flex-col gap-6">
          {col.items.map(({ entry, index }) => (
            <div role="listitem" key={entry.item.slug}>
              <GalleryCard item={entry.item} href={entry.href} aspect={entry.item.aspect ?? POSTER} first={index < count} note={entry.note} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
