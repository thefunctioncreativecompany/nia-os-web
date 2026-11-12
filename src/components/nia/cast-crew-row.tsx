import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { initials } from "@/lib/initials";
import { ScrollRow } from "@/components/nia/scroll-row";

// Cast & Crew (Ika, 2026-11-01, after Apple TV's row): a round picture per person, their name, and
// their character or role under it, in one row that scrolls sideways. Initials stand in where
// there's no picture (pictures only with the person's say-so, see people.ts). Each opens the
// person's page. On Explore's creator films, films and series, and (smaller) on projects.

/** Under the row on Explore's films and series. */
export const WIKIDATA_NOTE = "Credits from Wikidata. Photos from Wikimedia Commons, credited on each person\u2019s page.";

export type RowPerson = { key: string; name: string; role: string; href: string; photo?: string | null };

export function CastCrewRow({
  label = "Cast & Crew",
  people,
  total = people.length,
  viewAll,
  note,
  className,
}: {
  label?: string;
  people: RowPerson[];
  /** Everyone credited, when the row shows only the top ones. */
  total?: number;
  /** "View all", shown when there are more than the row shows. */
  viewAll?: React.ReactNode;
  note?: React.ReactNode;
  className?: string;
}) {
  if (!people.length) return null;
  return (
    <section aria-labelledby="cast-crew" className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="cast-crew" className="text-subtitle font-semibold text-foreground">
          {label} <span className="text-micro font-normal text-muted-foreground">{total}</span>
        </h2>
        {total > people.length && viewAll}
      </div>
      <ScrollRow label={label}>
        {people.map((p) => (
          <li key={p.key} className="w-28 flex-none snap-start sm:w-32 lg:w-36">
            <PersonTile person={p} />
          </li>
        ))}
      </ScrollRow>
      {note && <p className="text-caption text-muted-foreground">{note}</p>}
    </section>
  );
}

/** A person in a row. Without an `href` (a shared link's visitors) it's the same look, not a link. */
export function PersonTile({ person: p, small = false }: { person: Omit<RowPerson, "href"> & { href?: string }; small?: boolean }) {
  const inner = (
    <>
      <PersonPicture name={p.name} photo={p.photo} className={cn(p.href && "group-sweep", small ? "size-20 sm:size-24" : "size-24 sm:size-28 lg:size-32")} />
      <span className="flex flex-col gap-0.5">
        <span className="line-clamp-2 text-sm leading-snug font-semibold text-foreground">{p.name}</span>
        <span className="line-clamp-2 text-small leading-snug text-muted-foreground">{p.role}</span>
      </span>
    </>
  );
  if (!p.href) return <div className="flex flex-col items-center gap-2.5 text-center">{inner}</div>;
  return (
    <Link href={p.href} className="group flex flex-col items-center gap-2.5 rounded-xl text-center outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
      {inner}
    </Link>
  );
}

/** A round picture, or initials on the theme's grey. */
export function PersonPicture({ name, photo, className, large = false }: { name: string; photo?: string | null; className?: string; large?: boolean }) {
  return (
    <span className={cn("relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary", className)}>
      {photo ? (
        // Commons photos load from Wikimedia itself: it turns away other servers' image requests.
        <Image src={photo} alt="" fill sizes={large ? "224px" : "128px"} unoptimized={photo.startsWith("https://upload.wikimedia.org/")} className="object-cover" />
      ) : (
        <span aria-hidden className={cn("font-semibold tracking-tight text-muted-foreground", large ? "text-h1 md:text-display" : "text-h3 lg:text-h2")}>
          {initials(name)}
        </span>
      )}
    </span>
  );
}
