"use client";

import { useState } from "react";

import { ChipRow, FilterChip } from "@/components/nia/filter-bar";
import { ScrollRow } from "@/components/nia/scroll-row";
import { exploreItem } from "@/features/explore/items";
import type { StudioRow } from "@/features/explore/studios";
import { ExploreCard, cardSpan } from "./title-card";

// By studio (src/features/explore/studios.ts): a chip per studio with how many of its titles are
// on Explore, and the chosen studio's titles in one still row. The group that owns a studio today
// shows beside its name when it differs (Universal: NBCUniversal).
export function StudioStrip({ rows }: { rows: StudioRow[] }) {
  const [chosen, setChosen] = useState(rows[0]?.id ?? null);
  const row = rows.find((r) => r.id === chosen) ?? rows[0];
  if (!row) return null;
  const items = row.slugs.flatMap((slug) => {
    const item = exploreItem(slug);
    return item ? [item] : [];
  });

  return (
    <section aria-label="By studio" className="flex flex-col gap-5">
      <ChipRow role="group" aria-label="Studio">
        {rows.map((r) => (
          <FilterChip key={r.id} on={r.id === row.id} count={r.slugs.length} onClick={() => setChosen(r.id)}>
            {r.name}
          </FilterChip>
        ))}
      </ChipRow>
      {row.group !== row.name && <p className="-mt-2 text-small text-muted-foreground">{row.name} is part of {row.group}.</p>}
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
