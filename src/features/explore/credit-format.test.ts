import { describe, expect, it } from "vitest";

import { TOP_CREDITS, creditsByDepartment, formatCredits, standardRoles } from "./credit-format";
import { filmCastAndCrew } from "./film-people";
import { castAndCrew } from "./people";
import { creatorFilms } from "./creators";

const person = (name: string, roles: string[], character?: string) => ({ key: name, name, href: `/p/${name}`, roles, character });

describe("Cast & Crew standard format", () => {
  it("gives every role a standard name", () => {
    expect(standardRoles("DOP")[0].label).toBe("Director of Photography");
    expect(standardRoles("Director, DOP and editor").map((r) => r.label)).toEqual(["Director", "Director of Photography", "Editor"]);
    expect(standardRoles("Hair and make-up").map((r) => r.label)).toEqual(["Hair & Make-up", "Hair & Make-up"]);
    expect(standardRoles("Starring")[0].department).toBe("Cast");
    expect(standardRoles("Seamstress")[0]).toMatchObject({ label: "Seamstress", department: "Other" });
  });

  it("leads with the director, the lead cast, writer, producer and DP", () => {
    const credits = formatCredits([
      person("Gaffer G", ["Gaffer"]),
      person("Lead A", ["Cast"], "Smoke"),
      person("Lead B", ["Cast"]),
      person("Lead C", ["Cast"]),
      person("Extra D", ["Cast"]),
      person("Exec E", ["Executive producer"]),
      person("DP F", ["DOP"]),
      person("Director H", ["Director", "Writer"]),
      person("Producer I", ["Producer"]),
    ]);
    expect(credits.map((c) => c.name)).toEqual(["Director H", "Lead A", "Lead B", "Lead C", "Producer I", "DP F", "Extra D", "Exec E", "Gaffer G"]);
    expect(credits[0].role).toBe("Director, Writer");
    expect(credits[1].role).toBe("Smoke");
    expect(credits[2].role).toBe("Cast");
  });

  it("shows each film's director in its top 10, once per person", () => {
    const sinners = filmCastAndCrew("film-sinners");
    expect(sinners.slice(0, TOP_CREDITS).some((c) => c.name === "Ryan Coogler")).toBe(true);
    expect(sinners[1].name).toBe("Michael B. Jordan");
    for (const film of creatorFilms) {
      const keys = castAndCrew(film).map((c) => c.key);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it("groups the full list by department, cast first", () => {
    const groups = creditsByDepartment(filmCastAndCrew("the-godfather"));
    expect(groups[0].department).toBe("Cast");
    expect(groups.reduce((n, g) => n + g.people.length, 0)).toBe(filmCastAndCrew("the-godfather").length);
  });
});
