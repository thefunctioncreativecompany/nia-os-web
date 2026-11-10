"use client";

import Image from "next/image";
import { useState } from "react";

import { ChipRow, FilterChip } from "@/components/nia/filter-bar";
import { ScrollRow } from "@/components/nia/scroll-row";
import { exploreItem } from "@/features/explore/items";
import type { StudioRow } from "@/features/explore/studios";
import { cn } from "@/lib/utils";
import { ExploreCard, cardSpan } from "./title-card";

// By studio (src/features/explore/studios.ts): a round logo per studio (Ika, 2026-11-10: "round
// profile pictures with the company logos", from TMDB), the chosen one ringed like an "on" chip;
// a line under the row names it, how many of its titles are on Explore, and the group that owns it
// today when that differs (Universal: NBCUniversal). Then the chosen studio's titles in one row.
export function StudioStrip({ rows }: { rows: StudioRow[] }) {
  const [chosen, setChosen] = useState(rows[0]?.id ?? null);
  const row = rows.find((r) => r.id === chosen) ?? rows[0];
  if (!row) return null;
  const items = row.slugs.flatMap((slug) => {
    const item = exploreItem(slug);
    return item ? [item] : [];
  });
  const count = `${row.slugs.length} ${row.slugs.length === 1 ? "title" : "titles"}`;

  return (
    <section aria-label="By studio" className="flex flex-col gap-4">
      <ChipRow role="group" aria-label="Studio" className="-mx-1 gap-3 px-1">
        {rows.map((r) =>
          r.logo ? (
            <StudioLogo key={r.id} row={r} on={r.id === row.id} onClick={() => setChosen(r.id)} />
          ) : (
            <FilterChip key={r.id} on={r.id === row.id} count={r.slugs.length} onClick={() => setChosen(r.id)}>
              {r.name}
            </FilterChip>
          ),
        )}
      </ChipRow>
      <p className="text-small text-muted-foreground" aria-live="polite">
        <span className="font-semibold text-foreground">{row.name}</span>
        {row.group !== row.name && `, part of ${row.group}`} · {count}
      </p>
      <ScrollRow label={row.name}>
        {items.map((item) => (
          <li key={item.slug} className="w-[calc(44%*var(--span,1))] flex-none snap-start sm:w-[calc(30%*var(--span,1))] md:w-[calc(22%*var(--span,1))] lg:w-[calc(18%*var(--span,1))]" style={cardSpan(item)}>
            <ExploreCard item={item} href={item.href()} sizes="(min-width: 64rem) 18vw, (min-width: 40rem) 30vw, 44vw" />
          </li>
        ))}
      </ScrollRow>
    </section>
  );
}

/** A studio's logo on a round white plate, like a profile picture; pressed when it's the chosen one. */
function StudioLogo({ row, on, onClick }: { row: StudioRow; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={`${row.name}, ${row.slugs.length} on Explore`}
      title={row.name}
      onClick={onClick}
      className={cn(
        "relative size-20 shrink-0 overflow-hidden rounded-full border bg-logo-plate outline-none transition-[border-color,box-shadow] duration-fast focus-visible:ring-3 focus-visible:ring-ring/50",
        on ? "border-foreground ring-2 ring-foreground ring-offset-2 ring-offset-background" : "border-border hover:border-ring",
      )}
    >
      <Image src={row.logo!} alt="" fill unoptimized sizes="80px" className="object-contain p-2" />
    </button>
  );
}
