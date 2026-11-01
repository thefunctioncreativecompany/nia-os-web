// The people credited on Explore (Ika, 2026-11-01: Cast & Crew rows and a page per person). For
// now, creator films' credits (creators.ts, from each post's caption); films and series join when
// their cast and crew come from Wikidata. A person is known by their Instagram handle where the
// caption gave one, else by their name. Companies credited (brand, client, agency, label…) are
// kept apart: they aren't people.
//
// Photos: none yet. Everyone shows their initials until they claim their credit ("This is me")
// and choose a picture, or a free photo exists (Wikimedia Commons, credited) for film people.

import { creatorFilms, type Credit, type CreatorFilm } from "./creators";

/** Credits for companies, not people. */
const COMPANY_ROLES = new Set(
  [
    "brand", "brands", "client", "agency", "production company", "production", "production partner", "production supplies",
    "label", "magazine", "club", "retailer", "post house", "post-production", "equipment", "licence", "catering", "social team",
    "partner", "film", "series", "streamer", "thanks to", "artwork",
  ].map((r) => r.toLowerCase()),
);
/** On screen: they lead the row. */
const CAST_ROLES = /^(talent|starring|featuring|cast|main cast|supporting cast|lead character|model|athlete|narrator|voice-over|artist|swing|interviewer)$/i;

export const isCompanyRole = (role: string) => COMPANY_ROLES.has(role.toLowerCase());

const slugify = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const personKey = (c: Credit) => (c.handle ? c.handle.toLowerCase() : slugify(c.name));
export const personHref = (key: string) => `/explore/person/${encodeURIComponent(key)}`;

/** "AB" from "Ama Bello" or "@amabello". */
export function initials(name: string) {
  const words = name.replace(/^@/, "").split(/[\s._-]+/).filter(Boolean);
  return ((words[0]?.[0] ?? "") + (words.length > 1 ? words.at(-1)![0] : (words[0]?.[1] ?? ""))).toUpperCase();
}

export type CastCrewMember = { key: string; name: string; role: string; href: string };

/** A creator film's people for its Cast & Crew row: cast first, then crew in credit order; someone
 * credited twice shows once with both roles. */
export function castAndCrew(film: CreatorFilm): CastCrewMember[] {
  const byKey = new Map<string, CastCrewMember & { cast: boolean; at: number }>();
  film.credits.forEach((c, at) => {
    if (isCompanyRole(c.role)) return;
    const key = personKey(c);
    const hit = byKey.get(key);
    if (hit) {
      if (!hit.role.toLowerCase().includes(c.role.toLowerCase())) hit.role = `${hit.role}, ${c.role}`;
      hit.cast ||= CAST_ROLES.test(c.role);
      return;
    }
    const name = c.handle && c.name === c.handle ? `@${c.name}` : c.name;
    byKey.set(key, { key, name, role: c.role, href: personHref(key), cast: CAST_ROLES.test(c.role), at });
  });
  return [...byKey.values()]
    .toSorted((a, b) => Number(b.cast) - Number(a.cast) || a.at - b.at)
    .map(({ key, name, role, href }) => ({ key, name, role, href }));
}

/** A creator film's companies (brand, agency, label…), in credit order. */
export const companies = (film: CreatorFilm) => film.credits.filter((c) => isCompanyRole(c.role));

export type Person = {
  key: string;
  name: string;
  handle: string | null;
  /** Their roles, most frequent first ("Director", "DOP"). */
  roles: string[];
  films: { slug: string; title: string; role: string }[];
};

let people: Map<string, Person> | null = null;
function allPeople() {
  if (people) return people;
  people = new Map();
  for (const film of creatorFilms) {
    for (const m of castAndCrew(film)) {
      const credit = film.credits.find((c) => personKey(c) === m.key)!;
      const p = people.get(m.key) ?? { key: m.key, name: m.name, handle: credit.handle ?? null, roles: [], films: [] };
      p.films.push({ slug: film.slug, title: film.title, role: m.role });
      people.set(m.key, p);
    }
  }
  for (const p of people.values()) {
    const count = new Map<string, number>();
    for (const f of p.films) for (const r of f.role.split(/, | and /)) count.set(r.toLowerCase(), (count.get(r.toLowerCase()) ?? 0) + 1);
    // Each role on its own and capitalised (captions write "Director, producer and photographer").
    p.roles = [...count.entries()].toSorted((a, b) => b[1] - a[1]).map(([r]) => r.charAt(0).toUpperCase() + r.slice(1));
  }
  return people;
}

export const findPerson = (key: string): Person | null => allPeople().get(key.toLowerCase()) ?? null;

/** Everyone they've made films with on Explore, most shared films first. */
export function workedWith(person: Person, limit = 16): CastCrewMember[] {
  const shared = new Map<string, CastCrewMember & { n: number }>();
  for (const f of person.films) {
    const film = creatorFilms.find((x) => x.slug === f.slug);
    if (!film) continue;
    for (const m of castAndCrew(film)) {
      if (m.key === person.key) continue;
      const hit = shared.get(m.key);
      if (hit) hit.n += 1;
      else shared.set(m.key, { ...m, n: 1 });
    }
  }
  return [...shared.values()].toSorted((a, b) => b.n - a.n).slice(0, limit).map(({ key, name, role, href }) => ({ key, name, role, href }));
}
