import { describe, expect, it } from "vitest";

import { UPDATES, groupFor, whatsNew } from "./updates";

describe("what's new", () => {
  it("puts professions in the beta's groups", () => {
    expect(groupFor("Line Producer")).toBe("production");
    expect(groupFor("Stylist")).toBe("fashion");
    expect(groupFor("Photographer")).toBe("fashion");
    expect(groupFor("UGC Creator")).toBe("creator");
    expect(groupFor(null)).toBe("production");
  });

  it("shows only what's newer than the last tour", () => {
    expect(whatsNew("2026-10-31T12:00:00Z", "production").every((u) => u.date > "2026-10-31")).toBe(true);
    expect(whatsNew("2099-01-01T00:00:00Z", "creator")).toEqual([]);
  });

  it("leaves Explore out for people without early access", () => {
    expect(whatsNew("2026-10-01T00:00:00Z", "fashion", { explore: false }).some((u) => u.href.startsWith("/explore"))).toBe(false);
  });

  it("leads with what matters to the group", () => {
    expect(whatsNew("2026-10-01T00:00:00Z", "production")[0].id).toBe("budget-breakdown");
    expect(whatsNew("2026-10-01T00:00:00Z", "creator")[0].id).toBe("creator-templates");
    expect(["cast-crew"]).toContain(whatsNew("2026-10-01T00:00:00Z", "fashion")[0].id);
  });

  it("has a date, link and weights for every update", () => {
    for (const u of UPDATES) {
      expect(u.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(u.href.startsWith("/")).toBe(true);
      expect(Object.values(u.weight).every((w) => w >= 0 && w <= 1)).toBe(true);
    }
  });
});
