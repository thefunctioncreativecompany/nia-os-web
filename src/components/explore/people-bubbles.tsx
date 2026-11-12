"use client";

import { useState } from "react";

import { BackLink } from "@/components/nia/back-link";
import { PersonTile, type RowPerson } from "@/components/nia/cast-crew-row";
import { ChipRow, FilterChip } from "@/components/nia/filter-bar";
import { exploreHome } from "@/features/explore/paths";

// The roles people are grouped by, in a production's usual order; anything else is "More roles".
const ROLES: [string, string][] = [
  ["Director", "Directors"],
  ["Actor", "Actors"],
  ["Writer", "Writers"],
  ["Producer", "Producers"],
  ["Director of Photography", "Directors of photography"],
  ["Editor", "Editors"],
  ["Music", "Music"],
  ["Production Designer", "Production designers"],
  ["Costume Designer", "Costume designers"],
];
const OTHER = "More roles";
const groupOf = (role: string) => ROLES.find(([r]) => r === role)?.[1] ?? OTHER;

// Explore's cast & crew, View all (Ika, 2026-11-10; by role 2026-11-11): everyone credited on
// three or more things on Explore, grouped by what they mainly do (directors, actors, writers…),
// most credits first in each group, as equal round pictures with their name and role. A chip
// narrows the page to one group. Each person opens their page.
export function PeopleBubbles({ people }: { people: RowPerson[] }) {
  const [chosen, setChosen] = useState<string | null>(null);
  const groups = [...ROLES.map(([, label]) => label), OTHER]
    .map((label) => ({ label, people: people.filter((p) => groupOf(p.role) === label) }))
    .filter((g) => g.people.length);
  const shown = chosen ? groups.filter((g) => g.label === chosen) : groups;

  return (
    <div className="flex w-full flex-col px-4 pt-10 pb-24 md:px-7.5 lg:pt-12.5">
      <BackLink
        href={exploreHome()}
        className="w-fit rounded-sm text-sm leading-[1.4] font-bold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        ← Back to Explore
      </BackLink>
      <h1 className="mt-8 text-h2 font-semibold tracking-tight text-foreground">Cast &amp; crew</h1>
      <ChipRow role="group" aria-label="Role" className="mt-6">
        <FilterChip on={chosen === null} onClick={() => setChosen(null)}>
          All
        </FilterChip>
        {groups.map((g) => (
          <FilterChip key={g.label} on={chosen === g.label} onClick={() => setChosen(g.label)}>
            {g.label}
          </FilterChip>
        ))}
      </ChipRow>
      {shown.map((g) => (
        <section key={g.label} aria-label={g.label} className="mt-12">
          <h2 className="text-subtitle font-semibold text-foreground">{g.label}</h2>
          <ul className="mt-6 grid grid-cols-3 gap-x-4 gap-y-8 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8">
            {g.people.map((p) => (
              <li key={p.key} className="flex justify-center">
                <PersonTile person={p} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
