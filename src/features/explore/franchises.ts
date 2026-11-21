import data from "./franchises.json";
import { exploreItem } from "./items";

export { franchiseHref } from "./paths";

// Franchises on Explore (Ika, 2026-11-21: "tv shows/films that have 5+ sequels/seasons … all
// pieces should be able to be searched individually, but also can be found within each"): every
// film and series in a franchise is a title of its own, and the franchise groups them in release
// order (franchises.json) with a page of its own (/explore/franchise/[id]), a row on each of its
// titles' pages, and a place in search. Not an Explore category: no row on Explore's home.
// A franchise shows its titles that have a cover, and shows at all once two do.

export type FranchiseRow = { id: string; name: string; slugs: string[] };

const ROWS: FranchiseRow[] = data.franchises
  .map((f) => ({ id: f.id, name: f.name, slugs: f.slugs.filter((slug) => exploreItem(slug)?.image) }))
  .filter((f) => f.slugs.length > 1);

export function franchiseRows(): FranchiseRow[] {
  return ROWS;
}

/** The franchise a title belongs to, if any. */
export function franchiseOf(slug: string): FranchiseRow | null {
  return ROWS.find((f) => f.slugs.includes(slug)) ?? null;
}
