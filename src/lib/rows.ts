/** How many things a row shows before "View all" (Ika, 2026-11-11: "only 10 per row… as a general rule of thumb"). */
export const ROW_MAX = 10;

/** `count` items spread evenly through a list, in its order (a row that reads as history keeps its span). */
export function spread<T>(items: T[], count = ROW_MAX): T[] {
  if (items.length <= count) return items;
  return Array.from({ length: count }, (_, i) => items[Math.round((i * (items.length - 1)) / (count - 1))]);
}
