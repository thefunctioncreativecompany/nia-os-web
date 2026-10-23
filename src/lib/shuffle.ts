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
