import { describe, expect, it } from "vitest";

import { MAX_ROWS, frameWidth, layoutLane, nearestSlot, perYear } from "./layout";

const DAY = 86_400_000;
const view = { start: 0, end: 100 * DAY };
const item = (id: string, day: number, weight = 1, aspect?: number) => ({ id, at: day * DAY, weight, aspect });

describe("timeline lane layout", () => {
  it("centres each title on its date", () => {
    const [s] = layoutLane([item("a", 50)], view, 1000, 72);
    expect(s.x).toBe(500);
    expect(s.width).toBe(frameWidth(72));
  });

  it("stacks overlapping titles in up to three rows, then clusters", () => {
    const slots = layoutLane([item("a", 50), item("b", 50), item("c", 50), item("d", 50, 5), item("e", 50)], view, 1000, 72);
    expect(slots.map((s) => s.row)).toEqual([0, 1, 2]);
    expect(slots.reduce((n, s) => n + s.members.length, 0)).toBe(5);
    const cluster = slots.find((s) => s.members.length > 1)!;
    expect(cluster.id).toBe("d"); // the strongest title goes in front
    expect(Math.max(...slots.map((s) => s.row))).toBeLessThan(MAX_ROWS);
  });

  it("keeps titles apart in one row when there's room", () => {
    const slots = layoutLane([item("a", 10), item("b", 30), item("c", 60)], view, 1000, 72);
    expect(slots.every((s) => s.row === 0 && s.members.length === 1)).toBe(true);
  });

  it("lays out only what's near the view", () => {
    expect(layoutLane([item("far", 1000)], view, 1000, 72)).toEqual([]);
  });

  it("keeps a creator film's shape", () => {
    expect(layoutLane([item("reel", 50, 1, 9 / 16)], view, 1000, 120)[0].width).toBe(68);
  });

  it("finds the title at the playhead and counts titles per year", () => {
    const slots = layoutLane([item("a", 10), item("b", 60)], view, 1000, 72);
    expect(nearestSlot(slots, 590, 50)?.id).toBe("b");
    expect(nearestSlot(slots, 300, 50)).toBeNull();
    expect(perYear([item("a", 10), item("b", 20)], view).get(1970)).toBe(2);
  });
});
