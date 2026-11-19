// What Explore search searches (search.ts): every item on Explore all, each with its production
// tags, who made it and where it came from, plus the tag choices for the filter menus. Kept out
// of the Explore page's first load: explore-search.tsx loads this module the first time someone
// reaches for the search box or a filter (CLAUDE.md: data a control needs loads on first use).
import { LIBRARY } from "./library";
import { exploreItem, type ExploreItem } from "./items";
import { CATEGORY_NAMES, findEntry } from "./made-in-africa";
import { findCreatorFilm } from "./creators";
import { GROUP_LABELS, tagGroup, tagLabel, tagsFor, type TagGroup } from "./tags";
import type { SearchDoc } from "./search";

/** The four production details the filter menus offer (Ika, 2026-11-19); the rest are found by typing. */
export const FILTER_GROUPS = ["look", "camera", "setting", "mood"] as const satisfies readonly TagGroup[];
export type FilterGroup = (typeof FILTER_GROUPS)[number];
export const filterLabel = (g: FilterGroup) => GROUP_LABELS[g];

const slugOf = (key: string) => (key.startsWith("t:") ? key.slice(2) : key.startsWith("c:") ? `creator-${key.slice(2)}` : `film-${key.slice(2)}`);

/** Every item, in Explore all's order, as a card. */
export const ITEMS: ExploreItem[] = LIBRARY.flatMap((i) => exploreItem(slugOf(i.key)) ?? []);
const BY_SLUG = new Map(ITEMS.map((i) => [i.slug, i]));
export const itemFor = (slug: string) => BY_SLUG.get(slug) ?? null;

/** The search documents; `places` adds each title's studios and festivals, `castCrew` its cast and
 * crew (search-index.ts; a creator film's credits are already here). */
export function searchDocs(places: Record<string, string[]> = {}, castCrew: Record<string, string[]> = {}): SearchDoc[] {
  return ITEMS.map((item) => {
    const entry = findEntry(item.slug);
    const film = entry ? null : findCreatorFilm(item.slug);
    const extra = [
      item.meta,
      ...(places[item.slug] ?? []),
      ...(entry ? [entry.collection.name, CATEGORY_NAMES.get(entry.category) ?? "", ...entry.title.genres] : []),
      film?.brand ?? "",
    ];
    return {
      slug: item.slug,
      title: item.title,
      credit: item.credit,
      extra: extra.join(" ").toLowerCase(),
      people: film ? film.credits.map((c) => c.name) : (castCrew[item.slug] ?? []),
      tags: tagsFor(item.slug).map((id) => ({ id, label: tagLabel(id) })),
    };
  });
}

/** A group's tags that some of these items carry, most used first, with how many. */
export function groupChoices(docs: SearchDoc[], group: FilterGroup): { id: string; label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const d of docs) for (const t of d.tags) if (tagGroup(t.id) === group) counts.set(t.id, (counts.get(t.id) ?? 0) + 1);
  return [...counts]
    .map(([id, count]) => ({ id, label: tagLabel(id), count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export { tagGroup, tagLabel };
