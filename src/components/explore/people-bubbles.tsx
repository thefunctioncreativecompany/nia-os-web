"use client";

import Link from "next/link";

import { BackLink } from "@/components/nia/back-link";
import { PersonPicture } from "@/components/nia/cast-crew-row";
import { exploreHome } from "@/features/explore/made-in-africa";
import { cn } from "@/lib/utils";

export type BubblePerson = { key: string; name: string; role: string; href: string; photo: string | null; credits: number };

// Five bubble sizes, by how many things on Explore a person is credited on: 3, 4, 5, 6 to 7,
// and 8 or more (most people have three, so the steps are by count, not spread evenly).
const SIZES = ["size-14 sm:size-18", "size-18 sm:size-24", "size-22 sm:size-32", "size-28 sm:size-40", "size-36 sm:size-52"];
const sizeFor = (credits: number) => SIZES[credits >= 8 ? 4 : credits >= 6 ? 3 : credits === 5 ? 2 : credits === 4 ? 1 : 0];
// A steady mix (the same on every visit), so big and small bubbles sit among each other.
const mixOf = (key: string) => [...key].reduce((a, c) => (a * 33 + c.charCodeAt(0)) % 9973, 11);
// Every third bubble sits a little lower, so the rows don't read as a grid.
const DROP = ["", "sm:mt-6", "sm:-mt-4"];

// Explore's cast & crew, View all (Ika, 2026-11-10: "different sized bubble-like approach"):
// everyone credited on three or more things, each a round picture (or initials) sized by how
// many, big and small mixed together like bubbles. A bubble opens the person's page; their name
// shows on hover and to screen readers.
export function PeopleBubbles({ people }: { people: BubblePerson[] }) {
  const mixed = people.toSorted((a, b) => mixOf(a.key) - mixOf(b.key));
  return (
    <div className="flex w-full flex-col overflow-x-clip px-4 pt-10 pb-24 md:px-7.5 lg:pt-12.5">
      <BackLink
        href={exploreHome()}
        className="w-fit rounded-sm text-sm leading-[1.4] font-bold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        ← Back to Explore
      </BackLink>
      <h1 className="mt-8 text-h2 font-semibold tracking-tight text-foreground">Cast &amp; crew</h1>
      <ul className="mt-10 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5">
        {mixed.map((p, i) => (
          <li key={p.key} className={DROP[i % 3]}>
            <Link
              href={p.href}
              aria-label={`${p.name}, ${p.role}, ${p.credits} on Explore`}
              className="group relative block rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <PersonPicture name={p.name} photo={p.photo} large={p.credits >= 6} className={cn("group-sweep transition-[scale] duration-base ease-out group-hover:scale-105 group-focus-visible:scale-105 motion-reduce:scale-100!", sizeFor(p.credits))} />
              <span aria-hidden className="pointer-events-none absolute inset-x-0 -bottom-2 z-10 mx-auto w-max max-w-40 translate-y-full truncate rounded-full bg-foreground px-2.5 py-1 text-caption font-medium text-background opacity-0 transition-opacity duration-fast group-hover:opacity-100 group-focus-visible:opacity-100">
                {p.name}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
