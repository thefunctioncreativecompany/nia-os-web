import "server-only";

import data from "./festivals.json";
import { exploreItem } from "./items";

// By festival on Explore (Ika, 2026-11-15): the festivals where titles on Explore screened or won,
// and only those (festivals.json, scripts/build-explore-festivals.mjs: from each title's
// recognition line, Wikidata and the recent line-ups). A festival shows when it has a title with a
// cover; the festivals with the most titles come first. Worked out on the server.

export type FestivalRow = { id: string; name: string; logo: string | null; slugs: string[] };

export function festivalRows(): FestivalRow[] {
  return data.festivals
    .map((f) => ({ id: f.id, name: f.name, logo: f.logo ? `/explore/festivals/${f.id}.png` : null, slugs: f.slugs.filter((slug) => exploreItem(slug)?.image) }))
    .filter((f) => f.slugs.length > 0)
    .toSorted((a, b) => b.slugs.length - a.slugs.length);
}
