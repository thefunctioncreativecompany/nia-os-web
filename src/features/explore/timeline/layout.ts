// Where each title sits on the Timeline's lane (EXPLORE_TIMELINE_SPEC.md §4): centred on its
// date, in up to three rows when posters would overlap, and grouped into a cluster (its strongest
// title in front, a count) when there's no room in any row. Only titles within a screen either
// side of the view are laid out. Pure, tested in layout.test.ts.

import type { PresetId, View } from "./scale";

export type LaneItem = { id: string; at: number; weight: number; aspect?: number };

export type Slot = {
  /** The title shown (the strongest in a cluster). */
  id: string;
  /** Centre, px from the lane's left edge. */
  x: number;
  width: number;
  row: number;
  /** Every title in it, earliest first; more than one makes a cluster. */
  members: string[];
  /** The date range of a cluster, for zooming to fit it. */
  from: number;
  to: number;
};

/** Poster height at each zoom level; at Century the lane shows a density chart instead. */
export const FRAME_HEIGHT: Record<PresetId, number> = { century: 56, decade: 56, year: 72, month: 120, week: 140, day: 140, hour: 140 };
export const MAX_ROWS = 3;
export const GAP = 8;

/** A poster is 2:3; a creator film keeps its own shape, no wider than 16:9. */
export const frameWidth = (height: number, aspect?: number) => Math.round(height * Math.min(aspect ?? 2 / 3, 16 / 9));

export function layoutLane(items: LaneItem[], view: View, width: number, height: number): Slot[] {
  const perMs = width / (view.end - view.start);
  const byId = new Map(items.map((i) => [i.id, i]));
  const rows: Slot[][] = Array.from({ length: MAX_ROWS }, () => []);
  const slots: Slot[] = [];
  for (const it of items) {
    const x = (it.at - view.start) * perMs;
    if (x < -width || x > 2 * width) continue;
    const w = frameWidth(height, it.aspect);
    const row = rows.findIndex((r) => {
      const last = r.at(-1);
      return !last || last.x + last.width / 2 + GAP <= x - w / 2;
    });
    if (row >= 0) {
      const slot = { id: it.id, x, width: w, row, members: [it.id], from: it.at, to: it.at };
      rows[row].push(slot);
      slots.push(slot);
      continue;
    }
    // No room: join the nearest title already placed, which becomes (or grows) a cluster.
    const near = rows.map((r) => r.at(-1)!).reduce((a, b) => (Math.abs(b.x - x) < Math.abs(a.x - x) ? b : a));
    near.members.push(it.id);
    near.to = it.at;
    if (it.weight > (byId.get(near.id)?.weight ?? 0)) near.id = it.id;
  }
  return slots;
}

/** The slot nearest the playhead, within `reach` px. */
export function nearestSlot(slots: Slot[], x: number, reach: number): Slot | null {
  let best: Slot | null = null;
  for (const s of slots) if (Math.abs(s.x - x) <= reach && (!best || Math.abs(s.x - x) < Math.abs(best.x - x))) best = s;
  return best;
}

/** Titles per year, for the Century chart. */
export function perYear(items: LaneItem[], view: View) {
  const counts = new Map<number, number>();
  for (const it of items) {
    if (it.at < view.start || it.at > view.end) continue;
    const y = new Date(it.at).getUTCFullYear();
    counts.set(y, (counts.get(y) ?? 0) + 1);
  }
  return counts;
}
