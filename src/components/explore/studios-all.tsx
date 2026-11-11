"use client";

import { BackLink } from "@/components/nia/back-link";
import { exploreHome } from "@/features/explore/made-in-africa";
import type { StudioRow } from "@/features/explore/studios";
import { StudioLogo } from "./studio-strip";

// By studio, View all (Ika, 2026-11-11): every studio and production company with a title on
// Explore, majors and independents, the ones with the most titles first. A logo opens the studio.
export function StudiosAll({ rows }: { rows: StudioRow[] }) {
  return (
    <div className="flex w-full flex-col px-4 pt-10 pb-24 md:px-7.5 lg:pt-12.5">
      <BackLink
        href={exploreHome()}
        className="w-fit rounded-sm text-sm leading-[1.4] font-bold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        ← Back to Explore
      </BackLink>
      <h1 className="mt-8 text-h2 font-semibold tracking-tight text-foreground">Studios</h1>
      <ul className="mt-10 grid grid-cols-3 gap-x-4 gap-y-8 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-col items-center gap-2.5 text-center">
            <StudioLogo row={r} />
            <span className="line-clamp-2 text-sm leading-snug font-semibold text-foreground">{r.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
