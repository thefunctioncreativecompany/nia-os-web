import { describe, expect, it } from "vitest";

import { MAX_SPAN, MIN_SPAN, PRESETS, boundsFor, fitView, nearestPreset, panBy, rangeLabel, ticksFor, zoomAround } from "./scale";

const now = Date.UTC(2026, 10, 2);
const bounds = boundsFor([Date.UTC(1927, 0, 1)], now);
const year = PRESETS.find((p) => p.id === "year")!.span;
const view = { start: now - year, end: now };

describe("timeline scale", () => {
  it("keeps the time under the pointer still while zooming", () => {
    const anchor = view.start + (view.end - view.start) * 0.3;
    const z = zoomAround(view, anchor, 0.5, bounds);
    expect((anchor - z.start) / (z.end - z.start)).toBeCloseTo(0.3, 6);
    expect(z.end - z.start).toBeCloseTo((view.end - view.start) / 2, 0);
  });

  it("stops at two hours and 150 years, and inside the bounds", () => {
    let z = view;
    for (let i = 0; i < 60; i++) z = zoomAround(z, now - 1000, 0.5, bounds);
    expect(z.end - z.start).toBe(MIN_SPAN);
    for (let i = 0; i < 60; i++) z = zoomAround(z, now, 2, bounds);
    expect(z.end - z.start).toBeLessThanOrEqual(MAX_SPAN);
    expect(z.start).toBeGreaterThanOrEqual(bounds.start);
    const far = panBy(view, -1e15, bounds);
    expect(far.start).toBe(bounds.start);
    expect(far.end - far.start).toBeCloseTo(year, 0);
  });

  it("starts the bounds at 1900, or the decade of an older title", () => {
    expect(new Date(bounds.start).getUTCFullYear()).toBe(1900);
    expect(new Date(boundsFor([Date.UTC(1888, 5, 1)], now).start).getUTCFullYear()).toBe(1880);
  });

  it("lights the nearest preset", () => {
    expect(nearestPreset(year * 1.4)).toBe("year");
    expect(nearestPreset(3 * 3_600_000)).toBe("hour");
    expect(nearestPreset(80 * year)).toBe("century");
  });

  it("picks ticks at least 64px apart, with the next unit up underneath", () => {
    const t = ticksFor(view, 1200);
    const gaps = t.major.slice(1).map((m, i) => m.x - t.major[i].x);
    expect(Math.min(...gaps)).toBeGreaterThanOrEqual(64 * 0.9);
    expect(t.major.some((m) => m.label === "Jan")).toBe(true);
    expect(t.context.some((c) => c.label === "2026")).toBe(true);
    const day = ticksFor({ start: now, end: now + 86_400_000 }, 1200);
    expect(day.major[0].label).toMatch(/^\d\d:00$/);
    const century = ticksFor({ start: Date.UTC(1910, 0, 1), end: Date.UTC(2030, 0, 1) }, 1200);
    expect(century.major.every((m) => /^\d{4}$/.test(m.label!))).toBe(true);
    expect(century.context).toEqual([]);
  });

  it("fits everything with room either side, and names the range", () => {
    const f = fitView([Date.UTC(1950, 0, 1), Date.UTC(2020, 0, 1)], bounds)!;
    expect(f.start).toBeLessThan(Date.UTC(1950, 0, 1));
    expect(f.end).toBeGreaterThan(Date.UTC(2020, 0, 1));
    expect(rangeLabel(f)).toMatch(/^19\d\d – 20\d\d$/);
    expect(rangeLabel({ start: +new Date(2025, 2, 1), end: +new Date(2026, 1, 28) })).toBe("Mar 2025 – Feb 2026");
  });
});
