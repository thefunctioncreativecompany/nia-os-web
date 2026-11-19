"use server";

import { creditsOf, peopleForSearch } from "./people-index";
import { rankNames, type NameMatch } from "./name-search";
import { itemFor } from "./search-data";
import { filmCreditSlugs, filmCredits, filmPerson } from "./film-people";
import { festivalRows } from "./festivals";
import { studioRows } from "./studios";

export type ExploreSearchIndex = {
  studios: { id: string; name: string; group: string; logo: string | null; count: number }[];
  festivals: { id: string; name: string; logo: string | null; count: number }[];
  /** Each title's studio names, so "Netflix" or "A24" finds their titles. */
  titleStudios: Record<string, string[]>;
};

// What global search needs from Explore beyond its titles (Ika, 2026-11-11: "every time we change
// the platform's data, improve search to consider it"): the studios, the festivals, and which
// studios made each title. Worked out on the server from Explore's curated data (nothing private),
// and fetched when search first opens. People come from findExploreNames as people type (2026-11-19).
export async function loadExploreSearchIndex(): Promise<ExploreSearchIndex> {
  const rows = studioRows();
  const titleStudios: Record<string, string[]> = {};
  for (const r of rows) for (const slug of r.slugs) (titleStudios[slug] ??= []).push(r.name);
  // Festivals too, so "Cannes" or "Sundance" finds the titles that screened there.
  const festivals = festivalRows();
  for (const f of festivals) for (const slug of f.slugs) (titleStudios[slug] ??= []).push(f.name);
  return {
    studios: rows.map((r) => ({ id: r.id, name: r.name, group: r.group, logo: r.logo, count: r.slugs.length })),
    festivals: festivals.map((f) => ({ id: f.id, name: f.name, logo: f.logo, count: f.slugs.length })),
    titleStudios,
  };
}

/** Each title's cast and crew names (slug → names), for Explore search (2026-11-19: "zendaya" found
 * nothing). Large, so it's its own request, made only when Explore search is first used. */
export async function loadExploreCastCrew(): Promise<Record<string, string[]>> {
  const out: Record<string, string[]> = {};
  for (const slug of filmCreditSlugs()) {
    const names = filmCredits(slug).flatMap((r) => filmPerson(r.id)?.name ?? []);
    if (names.length) out[slug] = [...new Set(names)];
  }
  return out;
}

export type NameHit = {
  kind: "person" | "studio" | "festival";
  key: string;
  name: string;
  /** Under the name: their main role, or "Studio" / "Festival". */
  role: string;
  href: string;
  /** A person's photo, or a studio's or festival's logo. */
  photo: string | null;
  /** How many things on Explore they're credited on, or carry. */
  count: number;
  match: NameMatch;
  /** What's theirs on Explore, in order (top billing first for people), with a line for each
   * ("as MJ", "Director"). */
  titles: { slug: string; label: string }[];
};

/** People, studios and festivals named in a search (name-search.ts), best first (Ika, 2026-11-19:
 * a search for a name shows its page, not only what it's credited on). Matched here, so the
 * 4,000-odd names never travel to the browser; Explore search asks as people type. */
export async function findExploreNames(query: string): Promise<NameHit[]> {
  const q = query.trim().slice(0, 80);
  if (q.length < 2) return [];
  // Each person's titles that show on Explore (a credit can point at an entry Explore doesn't show),
  // so the count on their card is what the page lists.
  const people = rankNames(q, peopleForSearch(), 10).map((p): NameHit => {
    const titles = creditsOf(p.key)
      .filter((c) => itemFor(c.slug))
      .map(({ slug, label }) => ({ slug, label }));
    return { kind: "person", key: p.key, name: p.name, role: p.role, href: p.href, photo: p.photo, count: titles.length, match: p.match, titles };
  });
  const places = rankNames(
    q,
    [
      ...studioRows().map((s) => ({ kind: "studio" as const, key: s.id, name: s.name, logo: s.logo, slugs: s.slugs, count: s.slugs.length })),
      ...festivalRows().map((f) => ({ kind: "festival" as const, key: f.id, name: f.name, logo: f.logo, slugs: f.slugs, count: f.slugs.length })),
    ],
    4,
  ).map(
    (p): NameHit => ({
      kind: p.kind,
      key: p.key,
      name: p.name,
      role: p.kind === "studio" ? "Studio" : "Festival",
      href: `/explore/${p.kind}/${p.key}`,
      photo: p.logo,
      count: p.count,
      match: p.match,
      titles: p.slugs.map((slug) => ({ slug, label: "" })),
    }),
  );
  // A studio or festival named in full leads a partly matched person, and the other way round.
  const strength = { exact: 3, words: 2, prefix: 1 };
  return [...people, ...places].toSorted((a, b) => strength[b.match] - strength[a.match] || b.count - a.count);
}
