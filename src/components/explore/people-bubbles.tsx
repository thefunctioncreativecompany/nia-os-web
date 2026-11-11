"use client";

import { BackLink } from "@/components/nia/back-link";
import { PersonTile, type RowPerson } from "@/components/nia/cast-crew-row";
import { exploreHome } from "@/features/explore/made-in-africa";

// Explore's cast & crew, View all (Ika, 2026-11-10): everyone credited on three or more things on
// Explore, most credits first, as equal round pictures (or initials) with their name and main
// role, the same tile as the row on Explore. Each opens the person's page. (Bubbles of different
// sizes were tried the same day and dropped: Ika, "keep it as equal circles".)
export function PeopleBubbles({ people }: { people: RowPerson[] }) {
  return (
    <div className="flex w-full flex-col px-4 pt-10 pb-24 md:px-7.5 lg:pt-12.5">
      <BackLink
        href={exploreHome()}
        className="w-fit rounded-sm text-sm leading-[1.4] font-bold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        ← Back to Explore
      </BackLink>
      <h1 className="mt-8 text-h2 font-semibold tracking-tight text-foreground">Cast &amp; crew</h1>
      <ul className="mt-10 grid grid-cols-3 gap-x-4 gap-y-8 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8">
        {people.map((p) => (
          <li key={p.key} className="flex justify-center">
            <PersonTile person={p} />
          </li>
        ))}
      </ul>
    </div>
  );
}
