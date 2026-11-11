// Everyone credited on Explore, for person pages: creator films' people (people.ts, from captions)
// and films' and series' cast and crew (film-people.ts, from Wikidata). Server only.

import { creatorFilms } from "./creators";
import { castAndCrew, personCredits, personKey, type CastCrewMember } from "./people";
import { filmCastAndCrew, filmCreditSlugs, filmPerson, type CommonsPhoto } from "./film-people";
import { exploreItem } from "./items";

export type Person = {
  key: string;
  name: string;
  handle: string | null;
  /** A free photo from Wikimedia Commons (film people), with its credit. */
  photo: CommonsPhoto | null;
  /** Where the credits come from. */
  source: "caption" | "wikidata";
  /** Their roles, most frequent first ("Director", "DOP"). */
  roles: string[];
  films: { slug: string; title: string; role: string }[];
};

type RowMember = CastCrewMember;

// Each Explore item's row, by slug: creator films and titles alike.
let rows: Map<string, RowMember[]> | null = null;
function allRows() {
  if (rows) return rows;
  rows = new Map();
  for (const film of creatorFilms) rows.set(film.slug, castAndCrew(film));
  for (const slug of filmCreditSlugs()) if (exploreItem(slug)) rows.set(slug, filmCastAndCrew(slug));
  return rows;
}

let people: Map<string, Person> | null = null;
function allPeople() {
  if (people) return people;
  people = new Map();
  for (const film of creatorFilms) {
    for (const m of castAndCrew(film)) {
      const credit = personCredits(film).find((c) => personKey(c) === m.key);
      const p = people.get(m.key) ?? { key: m.key, name: m.name, handle: credit?.handle ?? null, photo: null, source: "caption" as const, roles: [], films: [] };
      p.films.push({ slug: film.slug, title: film.title, role: m.role });
      people.set(m.key, p);
    }
  }
  for (const slug of filmCreditSlugs()) {
    const item = exploreItem(slug);
    if (!item) continue;
    for (const m of filmCastAndCrew(slug)) {
      const p = people.get(m.key) ?? { key: m.key, name: m.name, handle: null, photo: filmPerson(m.wikidata)?.photo ?? null, source: "wikidata" as const, roles: [], films: [] };
      p.films.push({ slug, title: item.title, role: m.role });
      people.set(m.key, p);
    }
  }
  for (const p of people.values()) {
    const count = new Map<string, number>();
    for (const f of p.films) for (const r of rolesOn(f.slug, p.key)) count.set(r, (count.get(r) ?? 0) + 1);
    p.roles = [...count.entries()].toSorted((a, b) => b[1] - a[1]).map(([r]) => r);
  }
  return people;
}

// Their standard roles on one film or title ("Cast" reads "Actor" on a person's page).
const rolesOn = (slug: string, key: string) => (allRows().get(slug)?.find((x) => x.key === key)?.roles ?? []).map((r) => (r === "Cast" ? "Actor" : r));

export const findPerson = (key: string): Person | null => allPeople().get(key.toLowerCase()) ?? null;

/** Creator films' people, drawn once at build; film people's pages are drawn on first visit. */
export const creatorPeopleKeys = () => [...new Set(creatorFilms.flatMap((f) => castAndCrew(f).map((m) => m.key)))];

/** Everyone they've made films with on Explore, most shared films first. */
export function workedWith(person: Person, limit = 16): RowMember[] {
  const shared = new Map<string, RowMember & { n: number }>();
  for (const f of person.films) {
    for (const m of allRows().get(f.slug) ?? []) {
      if (m.key === person.key) continue;
      const hit = shared.get(m.key);
      if (hit) hit.n += 1;
      else shared.set(m.key, { ...m, n: 1 });
    }
  }
  return [...shared.values()].toSorted((a, b) => b.n - a.n || a.rank - b.rank).slice(0, limit).map(({ n: _n, ...m }) => m);
}

/**
 * People credited on at least `min` things on Explore, most credits first (Ika, 2026-11-10: the
 * By cast & crew row). Each as the row shows them: their most frequent role, their page, and
 * their Commons photo where there is one, with how many things they're credited on.
 */
export function featuredPeople(min = 3, limit = Infinity) {
  return [...allPeople().values()]
    .map((p) => ({ p, n: new Set(p.films.map((f) => f.slug)).size }))
    .filter((x) => x.n >= min)
    .toSorted((a, b) => b.n - a.n || Number(!!b.p.photo) - Number(!!a.p.photo) || a.p.name.localeCompare(b.p.name))
    .slice(0, limit)
    .map(({ p, n }) => ({ key: p.key, name: p.name, role: p.roles[0] ?? "", href: `/explore/person/${encodeURIComponent(p.key)}`, photo: p.photo?.src ?? null, credits: n }));
}
