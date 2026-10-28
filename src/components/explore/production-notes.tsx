import Link from "next/link";

import { groupedTags } from "@/features/explore/tags";

// "Production notes" on a title's or creator film's page (Ika, 2026-10-28): its tags by group
// (look, camera, setting, subject, mood, how it was made, what it was made for). Each tag opens
// View all narrowed to it, to find more made the same way.
export function ProductionNotes({ slug, listHref }: { slug: string; listHref: string }) {
  const groups = groupedTags(slug);
  if (!groups.length) return null;
  return (
    <section aria-labelledby="production-notes" className="flex flex-col gap-4">
      <h2 id="production-notes" className="text-xl leading-[1.4] font-bold text-foreground">
        Production notes
      </h2>
      <dl className="flex flex-col gap-3.5">
        {groups.map((g) => (
          <div key={g.group} className="grid grid-cols-1 gap-1.5 sm:grid-cols-[10.5rem_1fr] sm:gap-4">
            <dt className="pt-1 text-sm font-bold text-foreground">{g.label}</dt>
            <dd className="flex flex-wrap gap-1.5">
              {g.tags.map((t) => (
                <Link
                  key={t.id}
                  href={`${listHref}?tag=${t.id}`}
                  className="rounded-full bg-secondary px-3 py-1 text-small text-foreground/80 outline-none transition-colors duration-fast hover:bg-accent hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {t.label}
                </Link>
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
