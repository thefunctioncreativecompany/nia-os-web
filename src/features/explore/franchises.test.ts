import { describe, expect, it } from "vitest";

import data from "./franchises.json";
import { franchiseOf, franchiseRows } from "./franchises";
import { allSlugs } from "./made-in-africa";

describe("franchises", () => {
  it("lists only titles that are on Explore", () => {
    const missing = data.franchises.flatMap((f) => f.slugs.filter((slug) => !allSlugs.includes(slug)).map((slug) => `${f.id}: ${slug}`));
    expect(missing).toEqual([]);
  });

  it("puts each title in one franchise at most", () => {
    const slugs = data.franchises.flatMap((f) => f.slugs);
    expect(slugs.length).toBe(new Set(slugs).size);
  });

  it("finds a title's franchise, in release order", () => {
    const row = franchiseOf("the-hobbit-the-desolation-of-smaug");
    expect(row?.name).toBe("The Lord of the Rings");
    expect(franchiseRows().find((f) => f.id === "the-hunger-games")?.slugs[0]).toBe("the-hunger-games");
    expect(franchiseOf("goat")).toBeNull();
  });
});
