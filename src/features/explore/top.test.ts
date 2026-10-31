import { describe, expect, it } from "vitest";

import { topScore, topTen, type TopActivity } from "./top";

const a = (slug: string, viewers = 0, recent_viewers = 0, saves = 0, adds = 0): TopActivity => ({ slug, viewers, recent_viewers, saves, adds });
const all = () => true;

describe("top ten", () => {
  it("weighs saves and additions to projects above opens, and recent opens twice", () => {
    expect(topScore(a("x", 2, 1, 1, 1))).toBe(2 + 1 + 3 + 5);
  });

  it("ranks by use, then fills with picks in order, each once", () => {
    const list = topTen([a("seen", 4), a("added", 0, 0, 0, 1), a("saved", 0, 0, 1)], ["saved", "pick-1", "pick-2"], all, 5);
    expect(list).toEqual(["added", "seen", "saved", "pick-1", "pick-2"]);
  });

  it("leaves out what can't be shown and anything with no activity", () => {
    const list = topTen([a("hidden", 9), a("idle")], ["pick"], (s) => s !== "hidden");
    expect(list).toEqual(["pick"]);
  });

  it("stops at ten", () => {
    const activity = Array.from({ length: 14 }, (_, i) => a(`t${i}`, 14 - i));
    expect(topTen(activity, [], all)).toHaveLength(10);
  });
});
