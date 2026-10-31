// Search helpers shared by Nia's searches (Ika, 2026-10-31: tagged searching, autocorrect and
// suggested searches). Plain functions over plain text, so they run anywhere and are tested.

/** Lower case, without accents: "Cinéma" finds "cinema". */
export const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** The words in a piece of text, lower case, letters and digits only. */
export const wordsOf = (s: string) => norm(s).split(/[^a-z0-9]+/).filter(Boolean);

/** How many single-letter changes (add, drop, swap two neighbours, replace) turn `a` into `b`,
 * or `max + 1` as soon as it's clearly more than `max`. */
export function editDistance(a: string, b: string, max = 2): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let before = Array.from({ length: b.length + 1 }, (_, j) => j);
  let prev: number[] = [];
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let d = Math.min(before[j] + 1, row[j - 1] + 1, before[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d = Math.min(d, prev[j - 2] + 1);
      row.push(d);
      best = Math.min(best, d);
    }
    if (best > max) return max + 1;
    prev = before;
    before = row;
  }
  return before[b.length];
}

/** How far off a typed word may be and still count: none for short words, one letter for
 * five to seven letters, two for longer ones. */
export const allowedTypos = (word: string) => (word.length < 5 ? 0 : word.length < 8 ? 1 : 2);

/** Every word that appears in the searchable text, with how often, to correct typing against. */
export type Vocabulary = Map<string, number>;
export function vocabularyOf(texts: Iterable<string>): Vocabulary {
  const vocab: Vocabulary = new Map();
  for (const text of texts) for (const w of wordsOf(text)) vocab.set(w, (vocab.get(w) ?? 0) + 1);
  return vocab;
}

/** The word as typed when something starts with it; else the closest common word within the
 * allowed typos; else the word as typed. */
export function correctWord(word: string, vocab: Vocabulary): string {
  if (vocab.has(word)) return word;
  for (const known of vocab.keys()) if (known.startsWith(word)) return word;
  const max = allowedTypos(word);
  if (!max) return word;
  let best = word;
  let bestDistance = max + 1;
  let bestCount = 0;
  for (const [known, count] of vocab) {
    const d = editDistance(word, known, max);
    if (d < bestDistance || (d === bestDistance && count > bestCount)) {
      best = known;
      bestDistance = d;
      bestCount = count;
    }
  }
  return bestDistance <= max ? best : word;
}

/** The query with each misspelt word corrected, or null when nothing needed correcting. */
export function correctQuery(query: string, vocab: Vocabulary): string | null {
  const words = wordsOf(query);
  const fixed = words.map((w) => correctWord(w, vocab));
  return fixed.some((w, i) => w !== words[i]) ? fixed.join(" ") : null;
}

/** Whether every typed word appears in the text (as the start of one of its words, or anywhere
 * for longer words). */
export function matchesAll(text: string, words: string[]): boolean {
  const hay = norm(text);
  const own = wordsOf(text);
  return words.every((w) => (w.length >= 3 ? hay.includes(w) : own.some((x) => x.startsWith(w))));
}

/** Suggested completions for what's typed: the phrases with a word starting with the last word
 * typed (and containing the words before it), shortest first. */
export function completions(query: string, phrases: Iterable<string>, limit = 5): string[] {
  const words = wordsOf(query);
  if (!words.length) return [];
  const last = words.at(-1)!;
  const rest = words.slice(0, -1);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const phrase of phrases) {
    const own = wordsOf(phrase);
    const key = own.join(" ");
    if (seen.has(key) || key === words.join(" ")) continue;
    if (own.some((w) => w.startsWith(last)) && rest.every((r) => own.some((w) => w.startsWith(r)))) {
      seen.add(key);
      out.push(phrase);
    }
  }
  return out.toSorted((a, b) => a.length - b.length).slice(0, limit);
}

const RECENT_KEY = "nia-recent-searches";
const RECENT_MAX = 6;

/** This device's recent searches, newest first (localStorage; empty when it can't be read). */
export function recentSearches(): string[] {
  try {
    const saved = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(saved) ? saved.filter((x): x is string => typeof x === "string").slice(0, RECENT_MAX) : [];
  } catch {
    return [];
  }
}

/** Remembers a search that led somewhere, for the suggestions next time. */
export function rememberSearch(query: string) {
  const q = query.trim();
  if (q.length < 2) return;
  try {
    const next = [q, ...recentSearches().filter((x) => norm(x) !== norm(q))].slice(0, RECENT_MAX);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {}
}
