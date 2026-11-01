import { describe, expect, it } from "vitest";

import { creatorFilms } from "./creators";
import { castAndCrew, companies, findPerson, initials, isCompanyRole, workedWith } from "./people";

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

  it("puts the cast first", () => {
    const film = creatorFilms.find((f) => f.credits.some((c) => /^(starring|talent)$/i.test(c.role)) && !/^(starring|talent)$/i.test(f.credits[0].role))!;
    expect(/starring|talent/i.test(castAndCrew(film)[0].role)).toBe(true);
  });

  it("finds a person across their films and who they worked with", () => {
    const austin = findPerson("austincbanks")!;
    expect(austin.films.length).toBeGreaterThan(1);
    expect(workedWith(austin).some((p) => p.key === austin.key)).toBe(false);
  });
});
