import { describe, expect, it, vi } from "vitest";

import catalogFile from "../../data/gear/catalog.json";
import { GEAR_DEPARTMENTS, categoriesOf, guessDepartment, parseGearLines, rankCatalog, type CatalogItem } from "./catalog";
import { SAMPLE, byDepartment, byVendor, gearTotals, nextStatus } from "./list";
import { addGear, setGearStatuses } from "./mutations";
import { keyWord } from "./search";

// The browser's database client, faked: it records the calls and answers what each test sets.
const db = vi.hoisted(() => ({ calls: [] as { fn: string; args: unknown[] }[], answer: { data: null as unknown, error: null as unknown } }));
vi.mock("@/lib/supabase/client", () => {
  const chain: Record<string, unknown> = {};
  for (const fn of ["from", "update", "eq", "in", "select"]) chain[fn] = (...args: unknown[]) => (db.calls.push({ fn, args }), chain);
  chain.then = (resolve: (v: unknown) => void) => resolve(db.answer);
  return { createClient: () => ({ ...chain, rpc: (...args: unknown[]) => (db.calls.push({ fn: "rpc", args }), Promise.resolve(db.answer)) }) };
});

const catalog: CatalogItem[] = catalogFile.items.map((i) => ({ ...i, kind: i.kind as CatalogItem["kind"], imageUrl: null }));

describe("the gear catalogue", () => {
  it("files every item under a department and category it knows", () => {
    for (const item of catalog) expect(categoriesOf(item.department)).toContain(item.category);
  });

  it("keeps ids readable and unique", () => {
    const ids = catalog.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    // Ids never change once kit points at them, so no doubled brands ("rode-rode-") or mangled
    // letters ("h-hnel" for Hähnel, "photographer-s").
    for (const id of ids) expect(id).not.toMatch(/(^|-)([a-z]+)-\2-|h-hnel|m-vi-|photographer-s-/);
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
    expect(guessDepartment("Zoom H6 recorder")).toBe("Audio");
    expect(guessDepartment("Monitor headphones")).toBe("Audio");
    expect(guessDepartment("Atomos Ninja recorder")).toBe("Monitors & video");
    expect(guessDepartment("Clapperboard")).toBe("Camera accessories");
    expect(guessDepartment("24-70mm zoom")).toBe("Lenses");
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
    expect(parseGearLines("4 x 4 floppy\n2x 4x4 floppy\n2 x 4ft tubes")).toEqual([
      { name: "4 x 4 floppy", quantity: 1 },
      { name: "4x4 floppy", quantity: 2 },
      { name: "4ft tubes", quantity: 2 },
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

  it("files a line in a department it doesn't know under Other, never dropping it", () => {
    const sound = { ...SAMPLE[0], id: "sound", department: "Sound" };
    const other = { ...SAMPLE[0], id: "other", department: "Other" };
    expect(byDepartment([sound]).map((g) => [g.department, g.lines.length])).toEqual([["Other", 1]]);
    expect(byDepartment([sound, other]).flatMap((g) => g.lines.map((l) => l.id))).toEqual(["sound", "other"]);
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

describe("searching", () => {
  it("narrows by the longest plain word, so punctuation can't break the read", () => {
    expect(keyWord("fx3,")).toBe("fx3");
    expect(keyWord("Sony CineAlta (PL)")).toBe("CineAlta");
    expect(keyWord("c-stand")).toBe("stand");
    expect(keyWord("100%_off")).toBe("100");
    expect(keyWord("RØDE")).toBe("RØDE");
  });
});

describe("changing gear", () => {
  it("sends a batch in one call: typed gear with its department, picks without", async () => {
    db.calls = [];
    db.answer = { data: { added: 2, raised: [] }, error: null };
    const fx3 = catalog.find((c) => c.id === "sony-fx3")!;
    await expect(addGear("p1", [{ name: "", quantity: 2, catalog: fx3 }, { name: " Lav mic ", quantity: 1.6 }, { name: "  ", quantity: 1 }, { name: "Own FX6", quantity: 1, gearId: "g1" }])).resolves.toEqual({ added: 2, raised: [] });
    expect(db.calls).toEqual([
      {
        fn: "rpc",
        args: [
          "add_project_gear",
          {
            p_project_id: "p1",
            p_picks: [
              { gearId: null, catalogId: "sony-fx3", name: "Sony FX3", department: null, quantity: 2 },
              { gearId: null, catalogId: null, name: "Lav mic", department: "Audio", quantity: 2 },
              { gearId: "g1", catalogId: null, name: "Own FX6", department: null, quantity: 1 },
            ],
          },
        ],
      },
    ]);
  });

  it("says so when the database changed fewer lines than asked", async () => {
    db.answer = { data: [{ id: "a" }], error: null };
    await expect(setGearStatuses(["a", "b"], "packed")).rejects.toThrow(/wasn't saved/);
    db.answer = { data: [{ id: "a" }, { id: "b" }], error: null };
    await expect(setGearStatuses(["a", "b"], "packed")).resolves.toBeUndefined();
  });
});
