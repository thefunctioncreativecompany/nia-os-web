// Explore search (Ika, 2026-11-19: "search bar and filters linked to production detail tagging",
// shaped like Templates search). Plain words are scored against a title's name, its production
// tags (tags.ts), who made it, its cast and crew, then where it came from (studios, festivals,
// collection, type, year, country). A tag named in full ("golden hour") counts as one match, and everyday words
// reach their tag ("35mm" is Shot on film). Pure functions over plain data (search-data.ts builds
// it), so it's tested on its own and the page loads it only when search is first used.

export type SearchDoc = {
  slug: string;
  title: string;
  credit: string;
  /** Studios, festivals, collection, category, type, year, country: lower-case words. */
  extra: string;
  /** Cast and crew names. */
  people?: string[];
  tags: { id: string; label: string }[];
  /** Its genres, in the platform's words (GENRES in src/lib/projects.ts, stored in Title Case). */
  genres?: string[];
};

export type SearchHit = {
  doc: SearchDoc;
  score: number;
  /** The words that found it, as typed. */
  matched: string[];
  /** How many words were searched for. */
  of: number;
  /** The production tags it matched, for the line under its name. */
  why: string[];
};

/** A person's lean to each tag, 0 to 1 (match.ts `Taste`). */
export type TasteMap = Map<string, number>;

const STOPWORDS = new Set("a an the and or of in on at with for by to from my our i im i'm we some show me find films film titles title like that shot".split(" "));

/** Everyday words that mean a tag (each target is checked against the tag list in the tests). */
export const TAG_WORDS: Record<string, string[]> = {
  "35mm": ["shot-on-film"], "16mm": ["shot-on-film"], celluloid: ["shot-on-film"], analogue: ["shot-on-film", "film-grain"], analog: ["shot-on-film", "film-grain"],
  iphone: ["shot-on-iphone"], phone: ["shot-on-iphone"], komodo: ["red-komodo"], fx3: ["sony-fx"], fx6: ["sony-fx"], sony: ["sony-fx"],
  monochrome: ["black-and-white"], mono: ["black-and-white"], bw: ["black-and-white"], "b&w": ["black-and-white"],
  moody: ["low-key", "moody"], dark: ["low-key"], sunset: ["golden-hour"], sunrise: ["golden-hour"], grain: ["film-grain"], grainy: ["film-grain"],
  aerial: ["drone"], slowmo: ["slow-motion"], "slo-mo": ["slow-motion"], steadicam: ["tracking"], oner: ["long-takes"],
  street: ["city-streets"], streets: ["city-streets"], city: ["city-streets"], beach: ["water"], ocean: ["water"], sea: ["water"], river: ["water"],
  car: ["roads", "car-rig"], cars: ["roads", "car-rig"], train: ["transit"], bus: ["transit"],
  vertical: ["vertical"], reel: ["vertical"], reels: ["vertical"], tiktok: ["vertical", "social-first"],
  ai: ["ai-shots"], archival: ["archive"], vfx: ["vfx"],
};

const words = (s: string) => s.toLowerCase().split(/[^a-z0-9&'-]+/).filter(Boolean);
const startsAny = (ws: string[], term: string) => ws.some((w) => w.startsWith(term));
const singular = (w: string) => (w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w);

/** The searched words, without filler. */
export function searchTerms(query: string) {
  return words(query).filter((w) => !STOPWORDS.has(w));
}

/** How strongly a person's taste leans to an item, 0 to about 1. */
export function tasteScore(doc: SearchDoc, taste?: TasteMap) {
  if (!taste?.size) return 0;
  const leans = doc.tags.map((t) => taste.get(t.id) ?? 0).sort((a, b) => b - a);
  return (leans[0] ?? 0) * 0.5 + (leans[1] ?? 0) * 0.3 + (leans[2] ?? 0) * 0.2;
}

/** Explore's items for a search, best first. Taste only breaks near-ties. */
export function rankExplore(query: string, docs: SearchDoc[], taste?: TasteMap): SearchHit[] {
  const lower = ` ${words(query).join(" ")} `;
  // A tag named in full ("golden hour", "shot on film") is one thing to find, for every item: it
  // matches items with that tag (or that phrase in their name), never "Hourglass" for "hour".
  // So is a person named in full ("tom holland"): only items they worked on, not any Tom and any Holland.
  const phrases = new Map<string, string>();
  const named = new Map<string, string>();
  for (const d of docs) {
    for (const t of d.tags) {
      const phrase = words(t.label).join(" ");
      if (phrase.includes(" ") && lower.includes(` ${phrase} `)) phrases.set(phrase, t.label);
    }
    for (const name of [...(d.people ?? []), d.credit]) {
      const phrase = words(name).join(" ");
      if (phrase.includes(" ") && lower.includes(` ${phrase} `) && !phrases.has(phrase)) named.set(phrase, name);
    }
  }
  for (const [phrase, name] of named) phrases.set(phrase, name);
  const inPhrase = new Set([...phrases.keys()].flatMap((p) => p.split(" ")));
  const terms = searchTerms(query).filter((w) => !inPhrase.has(w));
  const of = terms.length + [...phrases.keys()].reduce((n, p) => n + p.split(" ").length, 0);
  if (!of) return [];

  return docs
    .map((doc) => {
      const titleW = words(doc.title);
      const creditW = words(doc.credit);
      const extraW = words(doc.extra);
      const people = (doc.people ?? []).map((name) => ({ name, w: words(name) }));
      const person = (w: string) => people.find((p) => startsAny(p.w, w));
      let score = 0;
      const matched: string[] = [];
      const why = new Set<string>();

      for (const [phrase, label] of phrases) {
        const inTitle = ` ${titleW.join(" ")} `.includes(` ${phrase} `);
        if (named.has(phrase)) {
          // A person: in its credit line (director, creator) or its cast and crew.
          const credited = ` ${creditW.join(" ")} `.includes(` ${phrase} `);
          const inCast = people.some((p) => p.w.join(" ") === phrase);
          if (!inTitle && !credited && !inCast) continue;
          score += inTitle ? 12 : 10;
          matched.push(phrase);
          if (inCast && !credited) why.add(label);
          continue;
        }
        const has = doc.tags.some((t) => t.label === label);
        if (!has && !inTitle) continue;
        score += inTitle ? 12 : 9;
        matched.push(phrase);
        if (has) why.add(label);
      }

      for (const term of terms) {
        const base = singular(term);
        const tagHit = (w: string) => doc.tags.find((t) => startsAny(words(t.label), w));
        const viaWord = (TAG_WORDS[term] ?? TAG_WORDS[base] ?? []).map((id) => doc.tags.find((t) => t.id === id)).find(Boolean);
        const tag = tagHit(term) ?? tagHit(base);
        const best =
          startsAny(titleW, term) || startsAny(titleW, base)
            ? 12
            : tag
              ? 8
              : viaWord
                ? 7
                : startsAny(creditW, term) || startsAny(creditW, base)
                  ? 6
                  : person(term)
                    ? 5
                    : startsAny(extraW, term) || startsAny(extraW, base)
                      ? 3
                      : 0;
        if (!best) continue;
        score += best;
        matched.push(term);
        const shown = best === 8 ? tag : best === 7 ? viaWord : undefined;
        if (shown) why.add(shown.label);
        if (best === 5) why.add(person(term)!.name);
      }

      const hit = { doc, score, matched, of, why: [...why].slice(0, 2) };
      if (score > 0) hit.score += tasteScore(doc, taste) * 1.5;
      return hit;
    })
    .filter((h) => h.score > 0)
    // Everything typed first (as Templates search does), then the closest.
    .sort((a, b) => Number(coversAll(b)) - Number(coversAll(a)) || b.score - a.score);
}

/** Whether a hit covers everything typed (a tag named in full counts for its words). */
export const coversAll = (hit: SearchHit) => hit.matched.reduce((n, m) => n + m.split(" ").length, 0) >= hit.of;

/** Items carrying every chosen tag, in the order given (or by taste when there is one). */
export function withTags(docs: SearchDoc[], chosen: string[], taste?: TasteMap): SearchDoc[] {
  const found = docs.filter((d) => chosen.every((id) => d.tags.some((t) => t.id === id)));
  if (!taste?.size) return found;
  const order = new Map(found.map((d, i) => [d.slug, i]));
  return [...found].sort((a, b) => tasteScore(b, taste) - tasteScore(a, taste) || order.get(a.slug)! - order.get(b.slug)!);
}

/** Items in a genre (all of them when none is chosen), in the order given. */
export function inGenre(docs: SearchDoc[], genre: string | null): SearchDoc[] {
  return genre ? docs.filter((d) => d.genres?.includes(genre)) : docs;
}

/** The genres some of these items have, most used first, with how many. */
export function genreChoices(docs: SearchDoc[]): { id: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const d of docs) for (const g of d.genres ?? []) counts.set(g, (counts.get(g) ?? 0) + 1);
  return [...counts].map(([id, count]) => ({ id, count })).sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));
}
