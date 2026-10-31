import "server-only";

import catalogue from "./studio-catalogue.json";
import { exploreItem } from "./items";

// By studio on Explore (Ika, 2026-10-31): the studios behind what's on Explore (Paramount,
// Universal and Focus for NBCUniversal, Columbia, Warner Bros., Disney, 20th Century, MGM,
// Netflix, Lionsgate, A24, Neon). The catalogue (scripts/build-studio-catalogue.mjs, 300+
// titles from Wikidata) says which studio made each title; a studio shows the titles that are on
// Explore with their cover, most notable first. Titles join as scripts/explore-update.mjs adds
// them. Worked out on the server, so the catalogue itself never reaches the browser.

export type StudioRow = { id: string; name: string; group: string; slugs: string[] };

type Entry = { studios: string[]; onExplore: string | null; notability: number };

export function studioRows(): StudioRow[] {
  const titles = catalogue.titles as Entry[];
  return catalogue.studios.flatMap((s) => {
    const slugs = titles
      .filter((t) => t.studios.includes(s.id) && t.onExplore && exploreItem(t.onExplore)?.image)
      .map((t) => t.onExplore!);
    return slugs.length ? [{ id: s.id, name: s.name, group: s.group, slugs }] : [];
  });
}
