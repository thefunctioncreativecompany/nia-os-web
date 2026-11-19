import { describe, expect, it } from "vitest";

import { isTitleMatch, matchName, pickBest, rankNames } from "./name-search";
import { rankExplore, type SearchDoc } from "./search";
import { creditsOf, peopleForSearch } from "./people-index";

const people = [
  { name: "Tom Holland", count: 4, photo: "x" },
  { name: "Tom Hardy", count: 2, photo: null },
  { name: "Zendaya", count: 5, photo: "x" },
  { name: "Jools Holland", count: 1, photo: null },
  { name: "Thomas Newman", count: 3, photo: null },
];

describe("matchName", () => {
  it("knows a whole name, whole words and the start of words", () => {
    expect(matchName("Zendaya", "Zendaya")).toBe("exact");
    expect(matchName("holland tom", "Tom Holland")).toBe("words");
    expect(matchName("tom hol", "Tom Holland")).toBe("prefix");
  });

  it("needs every word to find a different word of the name", () => {
    expect(matchName("tom hardy", "Tom Holland")).toBeNull();
    expect(matchName("tom tom", "Tom Holland")).toBeNull();
    expect(matchName("golden hour", "Zendaya")).toBeNull();
  });

  it("ignores accents, case and a handle's @", () => {
    expect(matchName("penelope cruz", "Penélope Cruz")).toBe("exact");
    expect(matchName("amabello", "@amabello")).toBe("exact");
  });
});

describe("rankNames", () => {
  it("puts the closest match first, then the most credited", () => {
    expect(rankNames("tom", people).map((p) => p.name)).toEqual(["Tom Holland", "Tom Hardy"]);
    expect(rankNames("tom holland", people).map((p) => p.name)).toEqual(["Tom Holland"]);
    expect(rankNames("holland", people).map((p) => p.name)).toEqual(["Tom Holland", "Jools Holland"]);
  });
});

const doc = (slug: string, title: string, people: string[] = [], tags: string[] = []): SearchDoc => ({
  slug,
  title,
  credit: "",
  extra: "",
  people,
  tags: tags.map((t) => ({ id: t, label: t })),
});

describe("pickBest", () => {
  const films = [doc("a", "Spider-Man: Homecoming", ["Zendaya"]), doc("b", "The Odyssey", ["Zendaya"]), doc("c", "Golden Fields", [], ["Golden hour"]), doc("d", "Night Walk", [], ["Golden hour"])];

  it("leads with a person when the search is their name", () => {
    expect(pickBest("zendaya", rankNames("zendaya", people), rankExplore("zendaya", films))).toEqual({ kind: "name" });
  });

  it("leads with a title named exactly what was typed", () => {
    const best = pickBest("the odyssey", [], rankExplore("the odyssey", films));
    expect(best?.kind === "title" && best.hit.doc.slug).toBe("b");
    expect(isTitleMatch("spider-man", "Spider-Man: Homecoming")).toBe(true);
  });

  it("crowns nothing when several fit equally", () => {
    expect(pickBest("golden hour", [], rankExplore("golden hour", films))).toBeNull();
    expect(pickBest("tom", rankNames("tom", people), [])).toBeNull();
    const series = [doc("e", "Spider-Man: Homecoming"), doc("f", "Spider-Man: Far From Home")];
    expect(pickBest("spider-man", [], rankExplore("spider-man", series))).toBeNull();
    // The film called exactly that wins, even when taste ranked a sequel first.
    const withFirst = rankExplore("spider-man", [...series, doc("g", "Spider-Man")]);
    const best = pickBest("spider-man", [], withFirst);
    expect(best?.kind === "title" && best.hit.doc.slug).toBe("g");
    const odyssey = rankExplore("the odyssey", [doc("h", "2001: A Space Odyssey"), doc("i", "The Odyssey")]).toReversed();
    const named = pickBest("the odyssey", [], odyssey);
    expect(named?.kind === "title" && named.hit.doc.slug).toBe("i");
    expect(pickBest("holland tom", rankNames("holland tom", people), [])).toEqual({ kind: "name" });
  });
});

describe("Explore's people", () => {
  it("finds Zendaya and lists her lead roles first, with who she plays", () => {
    const [hit] = rankNames("zendaya", peopleForSearch());
    expect(hit.name).toBe("Zendaya");
    expect(hit.match).toBe("exact");
    const credits = creditsOf(hit.key);
    expect(credits.length).toBeGreaterThan(1);
    expect(credits[0].label.startsWith("as ")).toBe(true);
    expect(credits.map((c) => c.billing)).toEqual(credits.map((c) => c.billing).toSorted((a, b) => a - b));
  });
});
