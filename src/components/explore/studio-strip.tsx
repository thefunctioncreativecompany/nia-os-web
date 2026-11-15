"use client";

import Image from "next/image";
import Link from "next/link";

import { ScrollRow, TEN_ACROSS } from "@/components/nia/scroll-row";
import { cn } from "@/lib/utils";
import type { StudioRow } from "@/features/explore/studios";

/** A studio's View all page. */
export const studioHref = (id: string) => `/explore/studio/${id}`;

// By studio (src/features/explore/studios.ts), just under Top 10 (Ika, 2026-11-10): a round logo
// per studio, half as wide as a Top 10 card, on a plate that stays white in both themes, like a
// profile picture (logos from TMDB). Each opens the studio's View all page. A studio without a
// logo shows its name on the plate.
/** A studio's round logo on its plate, opening its page. */
export function StudioLogo({ row: r }: { row: StudioRow }) {
  return <LogoPlate href={studioHref(r.id)} name={r.name} logo={r.logo} count={r.slugs.length} />;
}

/** A round logo on a plate that stays white in both themes, or the name when there's no logo
 * (studios and festivals). */
export function LogoPlate({ href, name, logo, count }: { href: string; name: string; logo: string | null; count: number }) {
  return (
    <Link
      href={href}
      aria-label={`${name}, ${count} on Explore`}
      title={name}
      className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-full border border-border bg-logo-plate outline-none transition-colors duration-fast hover:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {logo ? (
        <Image src={logo} alt="" fill unoptimized sizes="(min-width: 64rem) 12vw, (min-width: 40rem) 18vw, 30vw" className="object-contain p-[14%]" />
      ) : (
        <span className="px-3 text-center text-small font-semibold text-logo-ink">{name}</span>
      )}
    </Link>
  );
}

export function StudioLogos({ rows }: { rows: StudioRow[] }) {
  return (
    <ScrollRow label="Studios">
      {rows.map((r) => (
        <li key={r.id} className={cn("w-[22%] flex-none snap-start sm:w-[15%] md:w-[11%]", TEN_ACROSS)}>
          <StudioLogo row={r} />
        </li>
      ))}
    </ScrollRow>
  );
}
