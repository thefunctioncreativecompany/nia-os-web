import { describe, expect, it } from "vitest";

import { getTemplate } from "@/features/templates/catalog";
import { PRODUCTION_TYPES } from "@/lib/projects";
import { FREE_LIMITS } from "@/lib/plans";
import { ICPS, WORKFLOWS, icpFor } from "./workflows";

describe("workflows", () => {
  it("has three for each group", () => {
    for (const { id } of ICPS) expect(WORKFLOWS.filter((w) => w.icp === id), id).toHaveLength(3);
  });
  it("uses only working templates, each once, within the free plan's limit", () => {
    for (const w of WORKFLOWS) {
      expect(w.templates.filter((code) => !getTemplate(code)), w.id).toEqual([]);
      expect(new Set(w.templates).size, w.id).toBe(w.templates.length);
      expect(w.templates.length, w.id).toBeLessThanOrEqual(FREE_LIMITS.documentsPerProject);
      expect(w.templates.length, w.id).toBeGreaterThanOrEqual(3);
    }
  });
  it("gives every project a production type Nia knows, and a name of its own", () => {
    for (const w of WORKFLOWS) expect(PRODUCTION_TYPES as readonly string[], w.id).toContain(w.productionType);
    expect(new Set(WORKFLOWS.map((w) => w.id)).size).toBe(WORKFLOWS.length);
    expect(new Set(WORKFLOWS.map((w) => w.name)).size).toBe(WORKFLOWS.length);
  });
  it("places a profession in its group", () => {
    expect(icpFor("Photographer")).toBe("photographers");
    expect(icpFor("Content Creator / Influencer")).toBe("creators");
    expect(icpFor("Director of Photography")).toBe("filmmakers");
    expect(icpFor("Producer")).toBe("studios");
    expect(icpFor("Line Producer")).toBe("studios");
    expect(icpFor(null)).toBeNull();
  });
});
