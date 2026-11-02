// Cast & crew of Explore's films and series (Ika, 2026-11-01), from Wikidata
// (scripts/build-explore-credits.mjs), in the standard format (credit-format.ts). Pictures are free photos on Wikimedia Commons, credited on each
// person's page; everyone else shows initials. Read on the server only: the lists are large.

import credits from "./film-credits.json";
import filmPeople from "./film-people.json";
import { creatorFilms } from "./creators";
import { castAndCrew, personHref } from "./people";
import { formatCredits, type Credit } from "./credit-format";

export type CommonsPhoto = { src: string; page: string; author: string; licence: string };
type FilmPerson = { name: string; photo?: CommonsPhoto };
type CreditRow = { id: string; role: string; character?: string };

const PEOPLE = filmPeople as Record<string, FilmPerson>;
const CREDITS = credits as Record<string, { qid: string; people: CreditRow[] }>;

const slugify = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80).replace(/-$/, "");

// One address per person: their name, or name and Wikidata id when two people share a name (or a
// creator on Explore already has it).
let keys: Map<string, string> | null = null;
export function filmPersonKey(wikidata: string) {
  if (!keys) {
    keys = new Map();
    const creators = new Set(creatorFilms.flatMap((f) => castAndCrew(f).map((m) => m.key)));
    const byName = new Map<string, string[]>();
    for (const [id, p] of Object.entries(PEOPLE)) byName.set(slugify(p.name), [...(byName.get(slugify(p.name)) ?? []), id]);
    for (const [slug, ids] of byName) for (const id of ids) keys.set(id, ids.length > 1 || creators.has(slug) ? `${slug}-${id.toLowerCase()}` : slug);
  }
  return keys.get(wikidata) ?? wikidata.toLowerCase();
}

export type FilmCredit = Credit & { wikidata: string };

/** A title's Cast & Crew (`film-<id>` for press-kit films), in the standard format
 * (credit-format.ts): top credits first. */
export function filmCastAndCrew(slug: string): FilmCredit[] {
  const raw = (CREDITS[slug]?.people ?? []).flatMap((r) => {
    const p = PEOPLE[r.id];
    if (!p) return [];
    const key = filmPersonKey(r.id);
    return [{ key, wikidata: r.id, name: p.name, href: personHref(key), photo: p.photo?.src ?? null, roles: r.role.split(", "), character: r.character }];
  });
  const wikidata = new Map(raw.map((r) => [r.key, r.wikidata]));
  return formatCredits(raw).map((c) => ({ ...c, wikidata: wikidata.get(c.key)! }));
}

export const filmPerson = (wikidata: string) => PEOPLE[wikidata] ?? null;
export const filmCreditSlugs = () => Object.keys(CREDITS);
export const filmCredits = (slug: string) => CREDITS[slug]?.people ?? [];
