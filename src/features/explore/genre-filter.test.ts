import { describe, expect, it } from "vitest";

import { genreChoices, inGenre, type SearchDoc } from "./search";
import { searchDocs } from "./search-data";
import { GENRES } from "@/lib/projects";

const doc = (slug: string, genres?: string[]): SearchDoc => ({ slug, title: slug, credit: "", extra: "", tags: [], genres });

describe("Explore genre filter", () => {
  const docs = [doc("a", ["Drama", "Crime"]), doc("b", ["Drama"]), doc("c", ["Comedy"]), doc("d")];

  it("keeps only titles in the chosen genre, in order, and everything when none is chosen", () => {
    expect(inGenre(docs, "Drama").map((d) => d.slug)).toEqual(["a", "b"]);
    expect(inGenre(docs, null)).toBe(docs);
    expect(inGenre(docs, "Western")).toEqual([]);
  });

  it("offers the genres present, most used first", () => {
    expect(genreChoices(docs)).toEqual([
      { id: "Drama", count: 2 },
      { id: "Comedy", count: 1 },
      { id: "Crime", count: 1 },
    ]);
  });

  it("gives Explore's titles genres only in the platform's words", () => {
    const all = searchDocs();
    const used = new Set(all.flatMap((d) => d.genres ?? []));
    expect([...used].filter((g) => !(GENRES as readonly string[]).includes(g))).toEqual([]);
    expect(all.filter((d) => d.genres?.length).length).toBeGreaterThan(all.length * 0.75);
  });
});
