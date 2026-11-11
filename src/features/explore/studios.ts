import "server-only";

import catalogue from "./studio-catalogue.json";
import list from "./studios.json";
import byTitle from "./title-studios.json";
import logos from "./studio-logos.json";
import { exploreItem } from "./items";

// By studio on Explore (Ika, 2026-10-31; more studios and independents 2026-11-11, "a recently
// loved and requested feature"): the studios and production companies behind what's on Explore,
// majors and independents alike (studios.json). A title is under a studio when TMDB lists it among
// the title's production companies or networks, or the title's platform names it
// (title-studios.json, scripts/build-explore-studios.mjs), or the Wikidata catalogue says so
// (studio-catalogue.json). A studio shows when it has a title with a cover; the studios with the
// most titles come first, and a studio's titles are in the catalogue's order of notability, then
// Explore's. Each is picked by its logo (studio-logos.json, public/explore/studios/<id>.png).
// Worked out on the server, so none of this reaches the browser.

export type StudioRow = { id: string; name: string; group: string; logo: string | null; slugs: string[] };

type Entry = { studios: string[]; onExplore: string | null; notability: number };

export function studioRows(): StudioRow[] {
  const titles = catalogue.titles as Entry[];
  const tagged = byTitle as Record<string, { studios: string[] }>;
  return list.studios
    .map((s) => {
      const fromCatalogue = titles.filter((t) => t.studios.includes(s.id) && t.onExplore).map((t) => t.onExplore!);
      const fromTmdb = Object.entries(tagged).filter(([, v]) => v.studios.includes(s.id)).map(([slug]) => slug);
      const slugs = [...new Set([...fromCatalogue, ...fromTmdb])].filter((slug) => exploreItem(slug)?.image);
      const logo = s.id in logos ? `/explore/studios/${s.id}.png` : null;
      return { id: s.id, name: s.name, group: s.group, logo, slugs };
    })
    .filter((r) => r.slugs.length > 0)
    .toSorted((a, b) => b.slugs.length - a.slugs.length);
}
