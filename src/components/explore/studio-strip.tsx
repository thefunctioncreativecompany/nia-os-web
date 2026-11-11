"use client";

import Image from "next/image";
import Link from "next/link";

import { ScrollRow } from "@/components/nia/scroll-row";
import type { StudioRow } from "@/features/explore/studios";

/** A studio's View all page. */
export const studioHref = (id: string) => `/explore/studio/${id}`;

// By studio (src/features/explore/studios.ts), just under Top 10 (Ika, 2026-11-10): a round logo
// per studio, half as wide as a Top 10 card, on a plate that stays white in both themes, like a
// profile picture (logos from TMDB). Each opens the studio's View all page. A studio without a
// logo shows its name on the plate.
/** A studio's round logo on its plate, opening its page. */
export function StudioLogo({ row: r }: { row: StudioRow }) {
  return (
    <Link
      href={studioHref(r.id)}
      aria-label={`${r.name}, ${r.slugs.length} on Explore`}
      title={r.name}
      className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-full border border-border bg-logo-plate outline-none transition-colors duration-fast hover:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {r.logo ? (
        <Image src={r.logo} alt="" fill unoptimized sizes="(min-width: 64rem) 12vw, (min-width: 40rem) 18vw, 30vw" className="object-contain p-[14%]" />
      ) : (
        <span className="px-3 text-center text-small font-semibold text-logo-ink">{r.name}</span>
      )}
    </Link>
  );
}

export function StudioLogos({ rows }: { rows: StudioRow[] }) {
  return (
    <ScrollRow label="Studios">
      {rows.map((r) => (
        <li key={r.id} className="w-[22%] flex-none snap-start sm:w-[15%] md:w-[11%] lg:w-[9%]">
          <StudioLogo row={r} />
        </li>
      ))}
    </ScrollRow>
  );
}
