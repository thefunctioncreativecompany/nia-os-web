import { describe, expect, it } from "vitest";

import { TAG_WORDS, coversAll, rankExplore, withTags, type SearchDoc } from "./search";
import { FILTER_GROUPS, ITEMS, groupChoices, searchDocs } from "./search-data";
import { isTag, tagGroup } from "./tags";
import { filmCreditSlugs, filmCredits, filmPerson } from "./film-people";

const doc = (slug: string, title: string, credit: string, tags: [string, string][], extra = ""): SearchDoc => ({
  slug,
  title,
  credit,
  extra,
  tags: tags.map(([id, label]) => ({ id, label })),
});

const docs = [
  doc("a", "Night Market", "Thandi Mokoena", [["night", "Night"], ["handheld", "Handheld"], ["city-streets", "City streets"]], "short 2024 south africa"),
  doc("b", "Golden Fields", "Sam Okafor", [["golden-hour", "Golden hour"], ["shot-on-film", "Shot on film"], ["rural", "Rural"]], "feature film 2019 nigeria sundance"),
  doc("c", "Studio Days", "Lebo Dube", [["studio", "Studio"], ["shot-on-iphone", "Shot on iPhone"], ["close-ups", "Close-ups"]], "commercial 2025 south africa"),
];

describe("rankExplore", () => {
  it("puts a title match first", () => {
    expect(rankExplore("night market", docs)[0].doc.slug).toBe("a");
  });

  it("finds titles by their production tags and says which", () => {
    const [hit] = rankExplore("handheld", docs);
    expect(hit.doc.slug).toBe("a");
    expect(hit.why).toEqual(["Handheld"]);
  });

  it("counts a tag named in full as one match", () => {
    const [hit] = rankExplore("golden hour", docs);
    expect(hit.doc.slug).toBe("b");
    expect(hit.why).toContain("Golden hour");
    expect(coversAll(hit)).toBe(true);
  });

  it("understands everyday words for a tag", () => {
    expect(rankExplore("35mm", docs)[0].doc.slug).toBe("b");
    expect(rankExplore("iphone", docs)[0].doc.slug).toBe("c");
  });

  it("finds by who made it and where it came from", () => {
    expect(rankExplore("okafor", docs)[0].doc.slug).toBe("b");
    expect(rankExplore("sundance", docs)[0].doc.slug).toBe("b");
  });

  it("ranks an item covering every word above a partial one", () => {
    const hits = rankExplore("handheld south africa", docs);
    expect(hits[0].doc.slug).toBe("a");
    expect(coversAll(hits[0])).toBe(true);
    expect(coversAll(hits[1])).toBe(false);
  });

  it("finds by cast and crew, and says who", () => {
    const withCast = [...docs, { ...doc("d", "Harbour Lights", "Ama Mensah", []), people: ["Zendaya", "Tom Holland"] }];
    const [hit] = rankExplore("zendaya", withCast);
    expect(hit.doc.slug).toBe("d");
    expect(hit.why).toEqual(["Zendaya"]);
    // A full name finds only their work, not any Tom and any Holland.
    const mixed = [...withCast, { ...doc("e", "Other", "", []), people: ["Tom Hardy", "Jools Holland"] }];
    expect(rankExplore("tom holland", mixed).map((h) => h.doc.slug)).toEqual(["d"]);
  });

  it("returns nothing for filler or no match", () => {
    expect(rankExplore("the and of", docs)).toEqual([]);
    expect(rankExplore("zzzz", docs)).toEqual([]);
  });

  it("lets taste break near-ties", () => {
    const tied = [doc("x", "Alpha", "", [["night", "Night"]]), doc("y", "Beta", "", [["night", "Night"], ["studio", "Studio"]])];
    expect(rankExplore("night", tied)[0].doc.slug).toBe("x");
    expect(rankExplore("night", tied, new Map([["studio", 1]]))[0].doc.slug).toBe("y");
  });
});

describe("withTags", () => {
  it("keeps only items with every chosen tag", () => {
    expect(withTags(docs, ["night", "handheld"]).map((d) => d.slug)).toEqual(["a"]);
    expect(withTags(docs, ["night", "studio"])).toEqual([]);
  });
});

describe("Explore's real data", () => {
  const real = searchDocs();

  it("covers every item on Explore all, each once", () => {
    expect(real.length).toBe(ITEMS.length);
    expect(new Set(real.map((d) => d.slug)).size).toBe(real.length);
    expect(real.length).toBeGreaterThan(300);
  });

  it("finds a title by someone in its cast (Zendaya)", () => {
    // As loadExploreCastCrew builds it (search-index.ts is server-only).
    const castCrew = Object.fromEntries(filmCreditSlugs().map((slug) => [slug, filmCredits(slug).flatMap((r) => filmPerson(r.id)?.name ?? [])]));
    const withCast = searchDocs({}, castCrew);
    const titles = rankExplore("zendaya", withCast).map((h) => h.doc.slug);
    expect(titles).toContain("spider-man-no-way-home");
    expect(titles).toContain("the-odyssey");
    expect(rankExplore("christopher nolan", withCast).every((h) => h.doc.credit.includes("Nolan") || h.doc.people?.includes("Christopher Nolan"))).toBe(true);
  });

  it("maps everyday words only to real tags", () => {
    for (const ids of Object.values(TAG_WORDS)) for (const id of ids) expect(isTag(id), id).toBe(true);
  });

  it("offers choices in every filter menu, each from its own group", () => {
    for (const g of FILTER_GROUPS) {
      const choices = groupChoices(real, g);
      expect(choices.length, g).toBeGreaterThan(5);
      for (const c of choices) expect(tagGroup(c.id)).toBe(g);
    }
  });
});
