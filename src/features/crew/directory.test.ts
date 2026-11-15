import { describe, expect, it } from "vitest";

import { SAMPLE, byDepartment, departmentFor, isCastRole, parsePeople } from "./directory";

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

  it("groups crew by department in call-sheet order", () => {
    expect(byDepartment(SAMPLE).map((g) => g.department)).toEqual(["Direction", "Production", "Camera & lighting", "Art & set"]);
  });
});

describe("roles that contain other words", () => {
  it("files an editor under post-production and a DIT under camera", () => {
    expect(departmentFor("Editor")).toBe("Post-production");
    expect(departmentFor("Assistant Editor")).toBe("Post-production");
    expect(departmentFor("DIT")).toBe("Camera & lighting");
    expect(departmentFor("Set Decorator")).toBe("Art & set");
  });
});

describe("pasting a list of people", () => {
  it("reads a name and a role from each line, in the usual shapes", () => {
    expect(parsePeople("Thandi Mokoena, Director of Photography\nSipho Dube – Gaffer\nLerato Khumalo\tMake-up Artist")).toEqual([
      { name: "Thandi Mokoena", role: "Director of Photography", email: null },
      { name: "Sipho Dube", role: "Gaffer", email: null },
      { name: "Lerato Khumalo", role: "Make-up Artist", email: null },
    ]);
  });
  it("keeps hyphens inside names and finds an email anywhere on the line", () => {
    expect(parsePeople("Mary-Jane Smith - Producer - mj@studio.co")).toEqual([{ name: "Mary-Jane Smith", role: "Producer", email: "mj@studio.co" }]);
    expect(parsePeople("ana@crew.com, Ana Silva, Editor")).toEqual([{ name: "Ana Silva", role: "Editor", email: "ana@crew.com" }]);
  });
  it("leaves the role empty when there isn't one, and skips blank lines", () => {
    expect(parsePeople("\n  Kabelo  \n\n")).toEqual([{ name: "Kabelo", role: "", email: null }]);
  });
});
