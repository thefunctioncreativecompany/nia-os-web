// Explore shows its work in a new order on each visit (Ika, 2026-10-22), so people keep finding
// films they haven't seen. The server picks a seed per request; the order comes from the seed, so
// the server's first paint and the browser agree and nothing jumps on load.

/** A new seed for this visit. On the server, call it after `await connection()`. */
export const newSeed = () => Math.floor(Math.random() * 2 ** 32);

/** `items` in an order set by `seed`: the same seed always gives the same order. */
export function shuffled<T>(items: readonly T[], seed: number): T[] {
  // mulberry32: a small, fast generator that's good enough for ordering cards.
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** A seed for one row, so rows drawn from the same visit's seed don't all pick alike. */
export function seedFor(seed: number, key: string): number {
  let h = seed >>> 0;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 0x01000193) >>> 0;
  return h;
}

/** `count` of `items` chosen by `seed`, kept in their own order (a rank, a release order), so a row
 * shows different things on each visit and still reads in order (Ika, 2026-11-19). */
export function pick<T>(items: readonly T[], seed: number, count: number): T[] {
  if (items.length <= count) return [...items];
  const chosen = new Set(shuffled(items, seed).slice(0, count));
  return items.filter((item) => chosen.has(item));
}
