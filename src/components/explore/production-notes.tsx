import Link from "next/link";

import { groupedTags } from "@/features/explore/tags";

// "Production notes" on a title's or creator film's page (Ika, 2026-10-28): its tags by group
// (look, camera, setting, subject, mood, how it was made, what it was made for). Each tag opens
// Explore search narrowed to it, across all of Explore, to find more made the same way (Alvin,
// FB7, 2026-11-19; it used to narrow only the title's own View all).
export function ProductionNotes({ slug }: { slug: string }) {
  const groups = groupedTags(slug);
  if (!groups.length) return null;
  return (
    <section aria-labelledby="production-notes" className="flex flex-col gap-4">
      <h2 id="production-notes" className="text-subtitle font-semibold text-foreground">
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
                  href={`/explore?tag=${t.id}`}
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
