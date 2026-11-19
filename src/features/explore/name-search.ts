// Names in Explore search (Ika, 2026-11-19: "should also display crew/cast profile when searching
// their name, not just the films they're in"; "I love Best match, although could be executed
// better"). People, studios and festivals have their own pages, so a search for a name finds the
// name itself, not only what it's credited on. Pure functions, tested on their own: the server
// matches names (search-index.ts) and the page decides what leads (explore-search.tsx).

import { coversAll, searchTerms, type SearchHit } from "./search";

/** How a name met the search: the whole name, every word whole, or the start of each word. */
export type NameMatch = "exact" | "words" | "prefix";

export type NameEntry = { name: string; count: number; photo?: string | null };

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/^@/, "");
const nameWords = (s: string) => norm(s).split(/[^a-z0-9&']+/).filter(Boolean);

/** How a name meets the search, or null. Every searched word must start a different word of the
 * name ("tom hol" finds Tom Holland; "holland tom" too), so a name search never finds someone
 * from one stray word. */
export function matchName(query: string, name: string): NameMatch | null {
  const terms = searchTerms(norm(query)).flatMap(nameWords);
  if (!terms.length) return null;
  const ws = nameWords(name);
  if (terms.join(" ") === ws.join(" ")) return "exact";
  const left = [...ws];
  let whole = true;
  for (const t of terms) {
    const exactAt = left.indexOf(t);
    const at = exactAt >= 0 ? exactAt : left.findIndex((w) => w.startsWith(t));
    if (at < 0) return null;
    if (exactAt < 0) whole = false;
    left.splice(at, 1);
  }
  return whole ? "words" : "prefix";
}

const STRENGTH: Record<NameMatch, number> = { exact: 3, words: 2, prefix: 1 };

/** Names for a search, best first: the closest match, then the most credited, then those with a
 * photo, then A to Z. */
export function rankNames<T extends NameEntry>(query: string, entries: T[], limit = 10): (T & { match: NameMatch })[] {
  return entries
    .flatMap((e) => {
      const match = matchName(query, e.name);
      return match ? [{ ...e, match }] : [];
    })
    .toSorted((a, b) => STRENGTH[b.match] - STRENGTH[a.match] || b.count - a.count || Number(!!b.photo) - Number(!!a.photo) || a.name.localeCompare(b.name))
    .slice(0, limit);
}

/** Whether the first name answers the search on its own: the whole name, or every word of it
 * whole, and no other name fits as well ("tom" fits Tom Holland and Tom Hardy alike, so neither
 * leads; "zendaya" or "holland tom" do). */
export function nameLeads(names: { match: NameMatch }[]) {
  const [first, second] = names;
  return !!first && first.match !== "prefix" && (!second || STRENGTH[second.match] < STRENGTH[first.match]);
}

/** How a title meets what was typed: its full name word for word ("Spider-Man"), or its name up
 * to a colon ("Spider-Man: Homecoming"). */
export function titleMatch(query: string, title: string): "full" | "main" | null {
  const q = nameWords(query).join(" ");
  if (!q) return null;
  if (nameWords(title).join(" ") === q) return "full";
  return title.includes(":") && nameWords(title.split(":")[0]).join(" ") === q ? "main" : null;
}
export const isTitleMatch = (query: string, title: string) => titleMatch(query, title) !== null;

/**
 * What leads the results as Best match:
 * - a title named exactly what was typed, wherever taste ranked it: the one whose full name it is,
 *   else the one whose name before a colon it is; when several share it ("spider-man" names four
 *   sequels after a colon), none of them;
 * - else a name (person, studio, festival) when the search is that name and no other name fits as
 *   well (nameLeads);
 * - else a title that stands out: the only result, or clearly ahead of the next. When many fit
 *   equally ("golden hour"), nothing is crowned.
 */
export function pickBest(query: string, names: { match: NameMatch }[], hits: SearchHit[]): { kind: "name" } | { kind: "title"; hit: SearchHit } | null {
  const covering = hits.filter(coversAll);
  const full = covering.filter((h) => titleMatch(query, h.doc.title) === "full");
  const main = covering.filter((h) => titleMatch(query, h.doc.title) === "main");
  const named = full.length === 1 ? full[0] : full.length === 0 && main.length === 1 ? main[0] : null;
  if (named) return { kind: "title", hit: named };
  if (nameLeads(names)) return { kind: "name" };
  if (full.length > 1 || main.length > 1) return null;
  const [top, next] = hits;
  if (!top || !coversAll(top)) return null;
  return !next || top.score - next.score >= 3 ? { kind: "title", hit: top } : null;
}
