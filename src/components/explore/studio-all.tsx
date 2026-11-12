"use client";

import Image from "next/image";

import { BackLink } from "@/components/nia/back-link";
import { exploreItem } from "@/features/explore/items";
import { exploreHome } from "@/features/explore/made-in-africa";
import type { StudioRow } from "@/features/explore/studios";
import { ExploreCard } from "./title-card";
import { TmdbCredit } from "./tmdb-credit";

// A studio's View all (Ika, 2026-11-10), opened from its logo under Top 10: the logo, the studio's
// name, the group that owns it today when that differs, and every one of its titles on Explore,
// most notable first, in a grid that fills from the left.
export function StudioAll({ row }: { row: StudioRow }) {
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

      <div className="mt-8 flex items-center gap-5">
        {row.logo && (
          <div className="relative size-20 flex-none overflow-hidden rounded-full border border-border bg-logo-plate">
            <Image src={row.logo} alt="" fill unoptimized sizes="80px" className="object-contain p-[14%]" />
          </div>
        )}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1">
            <h1 className="text-h2 font-semibold tracking-tight text-foreground">{row.name}</h1>
            <TmdbCredit />
          </div>
          <p className="text-sm text-muted-foreground">
            {row.group !== row.name && `Part of ${row.group} · `}
            {items.length} {items.length === 1 ? "title" : "titles"} on Explore
          </p>
        </div>
      </div>

      {/* A grid, not masonry columns: with two or three titles, columns left gaps between them. */}
      <ul className="mt-10 grid grid-cols-2 items-start gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((item) => (
          <li key={item.slug}>
            <ExploreCard item={item} href={item.href()} sizes="(min-width: 80rem) 18vw, (min-width: 64rem) 23vw, (min-width: 40rem) 31vw, 48vw" />
          </li>
        ))}
      </ul>
    </div>
  );
}
