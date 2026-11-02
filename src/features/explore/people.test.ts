import { describe, expect, it } from "vitest";

import { creatorFilms } from "./creators";
import { castAndCrew, companies, initials, isCompanyRole } from "./people";
import { findPerson, workedWith } from "./people-index";
import { filmCastAndCrew } from "./film-people";

describe("people on Explore", () => {
  it("makes initials from names and handles", () => {
    expect(initials("Austin Banks")).toBe("AB");
    expect(initials("@austincbanks")).toBe("AU");
    expect(initials("Sofia")).toBe("SO");
  });

  it("keeps companies out of Cast & Crew", () => {
    expect(isCompanyRole("Brand")).toBe(true);
    expect(isCompanyRole("Director")).toBe(false);
    for (const film of creatorFilms) {
      const people = castAndCrew(film).map((p) => p.key);
      expect(new Set(people).size).toBe(people.length);
      for (const c of companies(film)) expect(isCompanyRole(c.role)).toBe(true);
    }
  });

  it("leads creator films with the director, then the cast", () => {
    const film = creatorFilms.find((f) => f.credits.some((c) => /^director$/i.test(c.role)) && f.credits.some((c) => /^(starring|talent)$/i.test(c.role)))!;
    const row = castAndCrew(film);
    expect(row[0].roles).toContain("Director");
    expect(row[1].roles).toContain("Cast");
  });

  it("finds a person across their films and who they worked with", () => {
    const austin = findPerson("austincbanks")!;
    expect(austin.films.length).toBeGreaterThan(1);
    expect(workedWith(austin).some((p) => p.key === austin.key)).toBe(false);
  });

  it("gives films their cast first, with who they play, and finds film people", () => {
    const row = filmCastAndCrew("film-sinners");
    expect(row[0].name).toBe("Ryan Coogler");
    expect(row[1].name).toBe("Michael B. Jordan");
    expect(row[1].role).toMatch(/Smoke/);
    expect(new Set(row.map((m) => m.key)).size).toBe(row.length);
    const coogler = row.find((m) => m.name === "Ryan Coogler")!;
    const person = findPerson(coogler.key)!;
    expect(person.roles).toContain("Director");
    expect(person.films.some((f) => f.slug === "film-sinners")).toBe(true);
    expect(workedWith(person).some((p) => p.name === "Michael B. Jordan")).toBe(true);
  });

  it("gives each person on a long credit line their own short page", () => {
    const keys = creatorFilms.flatMap((f) => castAndCrew(f).map((m) => m.key));
    expect(Math.max(...keys.map((k) => k.length))).toBeLessThanOrEqual(80);
    expect(keys).toContain("taylor-russell");
  });
});
