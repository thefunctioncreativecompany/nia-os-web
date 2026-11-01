import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { initials } from "@/features/explore/people";
import { ScrollRow } from "@/components/nia/scroll-row";

// Cast & Crew (Ika, 2026-11-01, after Apple TV's row): a round picture per person, their name, and
// their character or role under it, in one row that scrolls sideways. Initials stand in where
// there's no picture (pictures only with the person's say-so, see people.ts). Each opens the
// person's page. Used on Explore's creator films; projects and Explore's films next.

export type RowPerson = { key: string; name: string; role: string; href: string; photo?: string | null };

export function CastCrewRow({ label = "Cast & Crew", people, className }: { label?: string; people: RowPerson[]; className?: string }) {
  if (!people.length) return null;
  return (
    <section aria-labelledby="cast-crew" className={cn("flex flex-col gap-4", className)}>
      <h2 id="cast-crew" className="text-xl leading-[1.4] font-bold text-foreground">
        {label} <span className="text-micro font-normal text-muted-foreground">{people.length}</span>
      </h2>
      <ScrollRow label={label}>
        {people.map((p) => (
          <li key={p.key} className="w-28 flex-none snap-start sm:w-32 lg:w-36">
            <PersonTile person={p} />
          </li>
        ))}
      </ScrollRow>
    </section>
  );
}

export function PersonTile({ person: p, small = false }: { person: RowPerson; small?: boolean }) {
  return (
    <Link href={p.href} className="group flex flex-col items-center gap-2.5 rounded-xl text-center outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
      <PersonPicture name={p.name} photo={p.photo} className={cn("group-sweep", small ? "size-20 sm:size-24" : "size-24 sm:size-28 lg:size-32")} />
      <span className="flex flex-col gap-0.5">
        <span className="line-clamp-2 text-sm leading-snug font-semibold text-foreground">{p.name}</span>
        <span className="line-clamp-2 text-small leading-snug text-muted-foreground">{p.role}</span>
      </span>
    </Link>
  );
}

/** A round picture, or initials on the theme's grey. */
export function PersonPicture({ name, photo, className, large = false }: { name: string; photo?: string | null; className?: string; large?: boolean }) {
  return (
    <span className={cn("relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary", className)}>
      {photo ? (
        <Image src={photo} alt="" fill sizes={large ? "224px" : "128px"} className="object-cover" />
      ) : (
        <span aria-hidden className={cn("font-semibold tracking-tight text-muted-foreground", large ? "text-h1 md:text-display" : "text-h3 lg:text-h2")}>
          {initials(name)}
        </span>
      )}
    </span>
  );
}
