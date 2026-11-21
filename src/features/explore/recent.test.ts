import { describe, expect, it } from "vitest";

import { addedLabel, everyAddition, recentPool } from "./recent";

describe("recently added", () => {
  it("lists additions newest first", () => {
    const all = everyAddition();
    expect(all.length).toBeGreaterThan(10);
    expect(all.every((a, i) => i === 0 || all[i - 1].added >= a.added)).toBe(true);
  });

  it("always has a row's worth to pick from, starting with the newest", () => {
    const pool = recentPool(10);
    expect(pool.length).toBeGreaterThanOrEqual(10);
    expect(pool[0]).toBe(everyAddition()[0].slug);
  });

  it("shows the day as people read it", () => {
    expect(addedLabel("2026-11-21")).toBe("21 Nov");
  });
});
