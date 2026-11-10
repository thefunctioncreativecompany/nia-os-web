import { describe, expect, it } from "vitest";

import { ALL_TAGS, tagLabel } from "@/features/explore/tags";
import { EXPLORE_IDEAS, SECTION_IDEAS, pickIdea, sectionOf, type Section } from "./try-ideas";

const all = (o: Omit<Parameters<typeof pickIdea>[0], "visit">) => [...new Set(Array.from({ length: 40 }, (_, visit) => pickIdea({ ...o, visit })))];

describe("try ideas", () => {
  it("never offers an Explore idea without access", () => {
    for (const section of Object.keys(SECTION_IDEAS) as Section[]) {
      const ideas = all({ section, exploreAccess: false, recent: ["Natural light", "handheld"] });
      expect(ideas.filter((i) => EXPLORE_IDEAS.some((e) => e.toLowerCase() === i?.toLowerCase()))).toEqual([]);
    }
  });
  it("offers each idea once, whatever its capitals", () => {
    const ideas = all({ section: "home", exploreAccess: true, recent: ["call sheet", "CALL SHEET", "Lookbook"] });
    expect(ideas.filter((i) => i?.toLowerCase() === "call sheet")).toHaveLength(1);
    expect(ideas).toContain("Lookbook");
  });
  it("changes as the visit count goes up", () => {
    expect(pickIdea({ section: "home", exploreAccess: false, visit: 0 })).not.toBe(pickIdea({ section: "home", exploreAccess: false, visit: 1 }));
  });
  it("falls back to the section's list with no recent searches", () => {
    expect(SECTION_IDEAS.templates).toContain(pickIdea({ section: "templates", exploreAccess: false, visit: 3 }));
  });
  it("uses only real Explore tags", () => {
    const labels = new Set(ALL_TAGS.map(tagLabel));
    expect(EXPLORE_IDEAS.filter((i) => !labels.has(i))).toEqual([]);
  });
  it("knows the section from the address", () => {
    expect(sectionOf("/explore/title/benji")).toBe("explore");
    expect(sectionOf("/templates/D07")).toBe("templates");
    expect(sectionOf("/projects/abc/crew")).toBe("projects");
    expect(sectionOf("/settings/profile")).toBe("home");
  });
});
