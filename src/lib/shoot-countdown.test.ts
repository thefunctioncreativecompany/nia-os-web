import { describe, expect, it } from "vitest";

import { shootCountdown } from "@/lib/projects";

// Noon on 14 Nov 2026, local time.
const now = new Date(2026, 10, 14, 12).getTime();

describe("shootCountdown", () => {
  it.each([
    [null, null, ""],
    ["2026-11-15", null, "Tomorrow"],
    ["2026-11-20", "2026-11-22", "In 6 days"],
    ["2026-11-14", null, "Shooting today"],
    ["2026-11-13", "2026-11-15", "Shoot day 2 of 3"],
    ["2026-11-10", "2026-11-13", "Wrapped yesterday"],
    ["2026-11-01", "2026-11-10", "Wrapped 4 days ago"],
  ])("%s – %s → %s", (start, end, out) => expect(shootCountdown(start, end, now)).toBe(out));
});
