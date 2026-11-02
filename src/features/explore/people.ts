// The people credited on Explore's creator films (Ika, 2026-11-01: Cast & Crew rows and a page per
// person), from each post's caption (creators.ts); films and series are in film-people.ts, and
// people-index.ts puts the two together for person pages. A person is known by their Instagram
// handle where the caption gave one, else by their name. Companies credited (brand, client, agency, label…) are
// kept apart: they aren't people.
//
// Photos: creators show their initials until they claim their credit ("This is me") and choose a
// picture; film people have their free Wikimedia Commons photo where one exists, credited.

import type { Credit as CaptionCredit, CreatorFilm } from "./creators";
import { formatCredits, type Credit, type RawCredit } from "./credit-format";

/** Credits for companies, not people. */
const COMPANY_ROLES = new Set(
  [
    "brand", "brands", "client", "agency", "production company", "production", "production partner", "production supplies",
    "label", "magazine", "club", "retailer", "post house", "post-production", "equipment", "licence", "catering", "social team",
    "partner", "film", "series", "streamer", "thanks to", "artwork",
  ].map((r) => r.toLowerCase()),
);
export const isCompanyRole = (role: string) => COMPANY_ROLES.has(role.toLowerCase());

const slugify = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const personKey = (c: CaptionCredit) => (c.handle ? c.handle.toLowerCase() : slugify(c.name));
export const personHref = (key: string) => `/explore/person/${encodeURIComponent(key)}`;

export { initials } from "@/lib/initials";

export type CastCrewMember = Credit;

/** A creator film's people for its Cast & Crew row, in the standard format (credit-format.ts):
 * top credits first; someone credited twice shows once with both roles. */
export function castAndCrew(film: CreatorFilm): CastCrewMember[] {
  const byKey = new Map<string, RawCredit>();
  for (const c of film.credits) {
    if (isCompanyRole(c.role)) continue;
    const key = personKey(c);
    const hit = byKey.get(key);
    if (hit) hit.roles.push(c.role);
    else byKey.set(key, { key, name: c.handle && c.name === c.handle ? `@${c.name}` : c.name, href: personHref(key), roles: [c.role] });
  }
  return formatCredits([...byKey.values()]);
}

/** A creator film's companies (brand, agency, label…), in credit order. */
export const companies = (film: CreatorFilm) => film.credits.filter((c) => isCompanyRole(c.role));
