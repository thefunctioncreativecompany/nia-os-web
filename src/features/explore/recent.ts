import { allSlugs, addedOn } from "./made-in-africa";
import { creatorFilms } from "./creators";
import { exploreItem } from "./items";

// Recently added on Explore, back as a row under Top 10 (Ika, 2026-11-21; removed 2026-11-08, git
// tag parked-2026-11-08-recently-added): titles and creators' films with an `added` day
// (made-in-africa.json, creators.ts), newest first, a row like the others with the rest on View
// all (/explore/recent). The row draws from the newest week of additions, counted back from the
// latest added day rather than today, so it's never empty in a quiet week and needs no clock.

export type Added = { slug: string; added: string };

const WEEK = 7 * 86_400_000;

/** Everything with an `added` day and a cover, newest first; on the same day, the later addition first. */
export function everyAddition(): Added[] {
  const titles = allSlugs.flatMap((slug, i) => {
    const added = addedOn(slug);
    return added ? [{ slug, added, i }] : [];
  });
  const films = creatorFilms.flatMap((f, i) => (f.added ? [{ slug: f.slug, added: f.added, i }] : []));
  return [...titles, ...films]
    .filter(({ slug }) => exploreItem(slug)?.image)
    .toSorted((a, b) => b.added.localeCompare(a.added) || b.i - a.i)
    .map(({ slug, added }) => ({ slug, added }));
}

/** What the row picks from: the week up to the latest added day, and at least `min` of the newest. */
export function recentPool(min: number): string[] {
  const all = everyAddition();
  if (!all.length) return [];
  const latest = Date.parse(all[0].added);
  const week = all.filter(({ added }) => latest - Date.parse(added) < WEEK);
  return (week.length >= min ? week : all.slice(0, min)).map(({ slug }) => slug);
}

/** "21 Nov": the day something was added, as View all shows it. */
export const addedLabel = (added: string) => new Date(`${added}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
