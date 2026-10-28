// "Recently added on Explore" (Ika, 2026-10-28): titles and creators' films that joined Explore in
// the last RECENT_DAYS days, newest first. A title or film joins the row when it's given an
// `added` day (made-in-africa.json, creators.ts) and leaves it on its own after a week.
import { creatorFilms } from "./creators";
import { titleAddedOn } from "./made-in-africa";

export const RECENT_DAYS = 7;
export type Added = { slug: string; added: string };
const DAY = 24 * 60 * 60 * 1000;

// Built on first use: the data modules load each other, so this mustn't run while they load.
const allAdded = (): Added[] => [
  ...[...titleAddedOn].map(([slug, added]) => ({ slug, added })),
  ...creatorFilms.flatMap((f) => (f.added ? [{ slug: f.slug, added: f.added }] : [])),
];

/** What joined Explore in the week before this request, for the server to hand to the page. */
export const recentlyAddedToday = (): Added[] => recentlyAdded(Date.now());

/** What joined Explore in the week before `now`, newest first, with the day each joined. */
export function recentlyAdded(now: number): Added[] {
  return allAdded().filter(({ added }) => {
    const since = now - Date.parse(`${added}T00:00:00Z`);
    return since >= 0 && since < RECENT_DAYS * DAY;
  }).toSorted((a, b) => b.added.localeCompare(a.added));
}
