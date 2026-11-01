import { describe, expect, it } from "vitest";

import { SAMPLE, byDepartment, departmentFor, fromCrewList, isCastRole } from "./directory";

describe("cast and crew directory", () => {
  it("puts roles in departments", () => {
    expect(departmentFor("Director")).toBe("Direction");
    expect(departmentFor("Director of Photography")).toBe("Camera & lighting");
    expect(departmentFor("Line Producer")).toBe("Production");
    expect(departmentFor("Hair & Make-up")).toBe("Wardrobe, hair & make-up");
    expect(departmentFor("Colourist")).toBe("Post-production");
    expect(departmentFor("Caterer")).toBe("Other");
  });

  it("tells cast from crew", () => {
    expect(isCastRole("Talent")).toBe(true);
    expect(isCastRole("Model")).toBe(true);
    expect(isCastRole("Director")).toBe(false);
  });

  it("reads a project's Crew & talent list, with Nia photos where people have accounts", () => {
    const entries = fromCrewList(
      [
        { role: "Director", name: "Ama Bello", userId: "u1" },
        { role: "Talent", name: "Kofi Mensah" },
      ],
      new Map([["u1", "https://example.com/ama.jpg"]]),
    );
    expect(entries.map((e) => [e.name, e.kind, e.department, e.photo])).toEqual([
      ["Ama Bello", "crew", "Direction", "https://example.com/ama.jpg"],
      ["Kofi Mensah", "cast", "Other", null],
    ]);
  });

  it("groups crew by department in call-sheet order", () => {
    expect(byDepartment(SAMPLE).map((g) => g.department)).toEqual(["Direction", "Production", "Camera & lighting", "Art & set"]);
  });
});
