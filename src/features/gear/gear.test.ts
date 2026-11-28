import { describe, expect, it } from "vitest";

import catalogFile from "../../data/gear/catalog.json";
import { GEAR_DEPARTMENTS, categoriesOf, guessDepartment, parseGearLines, rankCatalog, type CatalogItem } from "./catalog";
import { SAMPLE, byDepartment, byVendor, gearTotals, nextStatus } from "./list";

const catalog: CatalogItem[] = catalogFile.items.map((i) => ({ ...i, kind: i.kind as CatalogItem["kind"], imageUrl: null }));

describe("the gear catalogue", () => {
  it("files every item under a department and category it knows", () => {
    for (const item of catalog) expect(categoriesOf(item.department)).toContain(item.category);
  });

  it("keeps ids readable and unique", () => {
    const ids = catalog.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("finds gear the way people type it", () => {
    expect(rankCatalog(catalog, "fx3")[0].name).toBe("Sony FX3");
    expect(rankCatalog(catalog, "c stand")[0].name).toMatch(/^C-Stand/);
    expect(rankCatalog(catalog, "skypanel s60")[0].name).toBe("ARRI SkyPanel S60-C");
    expect(rankCatalog(catalog, "600x")[0].name).toBe("Aputure LS 600x Pro");
    expect(rankCatalog(catalog, "ntg2")[0].name).toBe("RØDE NTG2 Shotgun Mic");
    expect(rankCatalog(catalog, "")).toEqual([]);
  });

  it("puts typed gear in a department", () => {
    expect(guessDepartment("Sony FX3 body")).toBe("Cameras");
    expect(guessDepartment("35mm prime")).toBe("Lenses");
    expect(guessDepartment("C-stand")).toBe("Grip");
    expect(guessDepartment("Lav mic")).toBe("Audio");
    expect(guessDepartment("1x1 LED panel")).toBe("Lighting");
    expect(guessDepartment("Craft services table")).toBe("Other");
    expect(GEAR_DEPARTMENTS).toContain(guessDepartment("Hazer"));
  });
});

describe("pasted gear lists", () => {
  it("reads quantities at either end, and keeps sizes in the name", () => {
    expect(parseGearLines("2x C-stand\n2 Sandbags\nSony FX3, 1\nApple box x 4\nV-mount batteries (6)")).toEqual([
      { name: "C-stand", quantity: 2 },
      { name: "Sandbags", quantity: 2 },
      { name: "Sony FX3", quantity: 1 },
      { name: "Apple box", quantity: 4 },
      { name: "V-mount batteries", quantity: 6 },
    ]);
    expect(parseGearLines("4x4 floppy\n12x12 full silk\nAputure 600x Pro")).toEqual([
      { name: "4x4 floppy", quantity: 1 },
      { name: "12x12 full silk", quantity: 1 },
      { name: "Aputure 600x Pro", quantity: 1 },
    ]);
  });

  it("drops bullets and blank lines", () => {
    expect(parseGearLines("- Tripod\n\n• 3 x Light stand\n1. Hazer")).toEqual([
      { name: "Tripod", quantity: 1 },
      { name: "Light stand", quantity: 3 },
      { name: "Hazer", quantity: 1 },
    ]);
  });
});

describe("a project's gear list", () => {
  it("groups by department in list order", () => {
    expect(byDepartment(SAMPLE).map((g) => g.department)).toEqual(["Cameras", "Lenses", "Camera accessories", "Camera support", "Monitors & video", "Lighting", "Grip", "Audio", "Media & DIT"]);
  });

  it("counts what's left to book", () => {
    const t = gearTotals(SAMPLE);
    expect(t.lines).toBe(14);
    expect(t.needed).toBe(3);
    expect(t.ready).toBe(false);
    expect(gearTotals([]).ready).toBe(false);
    expect(gearTotals(SAMPLE.map((e) => ({ ...e, status: "booked" as const }))).ready).toBe(true);
  });

  it("groups rentals by rental house for the pick-up run", () => {
    expect(byVendor(SAMPLE).map((v) => v.vendor)).toEqual(["Magic Lightbox", "Glow Hire"]);
  });

  it("steps a status forward and stops at returned", () => {
    expect(nextStatus("needed")).toBe("booked");
    expect(nextStatus("packed")).toBe("returned");
    expect(nextStatus("returned")).toBe("returned");
  });
});
