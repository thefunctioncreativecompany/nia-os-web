import { describe, expect, it } from "vitest";
import { groupOf, namedIn, openOrder, shortName } from "./rules";

const crew = [
  { id: "1", name: "Maya Okafor", role: "Producer" },
  { id: "2", name: "Maya Dlamini", role: "Stylist" },
  { id: "3", name: "Sipho Ndlovu", role: "Gaffer" },
  { id: "4", name: "Will Smith", role: "Grip" },
];

describe("who the words name", () => {
  it("finds a full name however it's typed", () => {
    expect(namedIn("send call sheet to sipho ndlovu", crew)?.people.map((p) => p.id)).toEqual(["3"]);
  });
  it("finds a capitalised first name", () => {
    expect(namedIn("Book the truck with Sipho", crew)?.people.map((p) => p.id)).toEqual(["3"]);
  });
  it("offers everyone who shares a first name", () => {
    expect(namedIn("Send call sheet to Maya", crew)?.people.map((p) => p.id)).toEqual(["1", "2"]);
  });
  it("prefers the full name when it's given", () => {
    expect(namedIn("Fitting with Maya Dlamini", crew)?.people.map((p) => p.id)).toEqual(["2"]);
  });
  it("leaves everyday words alone", () => {
    expect(namedIn("we will send it tomorrow", crew)).toBeNull();
    expect(namedIn("Mayan temple location scout", crew)).toBeNull();
  });
  it("shows the full name only when first names clash", () => {
    expect(shortName(crew[0], crew)).toBe("Maya Okafor");
    expect(shortName(crew[2], crew)).toBe("Sipho");
  });
});

describe("groups and order", () => {
  const today = "2026-11-25";
  it("groups by when it's due", () => {
    expect(groupOf({ due_on: "2026-11-24" }, today)).toBe("overdue");
    expect(groupOf({ due_on: "2026-11-25" }, today)).toBe("week");
    expect(groupOf({ due_on: "2026-12-01" }, today)).toBe("week");
    expect(groupOf({ due_on: "2026-12-02" }, today)).toBe("later");
    expect(groupOf({ due_on: null }, today)).toBe("none");
  });
  it("keeps the team's order within a group, and groups before it", () => {
    const at = "2026-11-01T00:00:00Z";
    const items = [
      { id: "later", due_on: "2026-12-20", position: 0, created_at: at },
      { id: "b", due_on: "2026-11-26", position: 1, created_at: at },
      { id: "a", due_on: "2026-11-28", position: 0, created_at: at },
      { id: "late", due_on: "2026-11-20", position: null, created_at: at },
    ];
    expect(items.toSorted(openOrder(today)).map((i) => i.id)).toEqual(["late", "a", "b", "later"]);
  });
});
