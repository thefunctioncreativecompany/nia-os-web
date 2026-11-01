// The people credited on Explore's creator films (Ika, 2026-11-01: Cast & Crew rows and a page per
// person), from each post's caption (creators.ts); films and series are in film-people.ts, and
// people-index.ts puts the two together for person pages. A person is known by their Instagram handle where the
// caption gave one, else by their name. Companies credited (brand, client, agency, label…) are
// kept apart: they aren't people.
//
// Photos: creators show their initials until they claim their credit ("This is me") and choose a
// picture; film people have their free Wikimedia Commons photo where one exists, credited.

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

export { initials } from "@/lib/initials";

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
