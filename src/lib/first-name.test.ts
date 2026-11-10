import { describe, expect, it } from "vitest";

import { firstNameOf } from "./first-name";

describe("firstNameOf", () => {
  it("uses the chosen name first", () => {
    expect(firstNameOf({ preferred: "Alvin", given: "Bukenya", full: "bukenya alvin" })).toBe("Alvin");
  });
  it("uses the Google first name before guessing from the full name", () => {
    expect(firstNameOf({ given: "Alvin", full: "Bukenya Alvin" })).toBe("Alvin");
  });
  it("falls back to the first word, with a capital", () => {
    expect(firstNameOf({ full: "bukenya alvin" })).toBe("Bukenya");
    expect(firstNameOf({ full: "  Ika   Rammutla " })).toBe("Ika");
  });
  it("leaves mixed-case names alone and copes with nothing", () => {
    expect(firstNameOf({ preferred: "deShawn" })).toBe("deShawn");
    expect(firstNameOf({})).toBe("");
  });
});
