import { describe, expect, it } from "vitest";

import { completions, correctQuery, correctWord, editDistance, matchesAll, vocabularyOf } from "./search";

const vocab = vocabularyOf(["Call Sheet", "Shotlist", "Documentary short", "Natural light", "Natural light", "Production Budget", "Cinematography"]);

describe("search", () => {
  it("counts single-letter changes, including swapped neighbours", () => {
    expect(editDistance("documentry", "documentary")).toBe(1);
    expect(editDistance("budegt", "budget")).toBe(1);
    expect(editDistance("cinematograpy", "cinematography")).toBe(1);
    expect(editDistance("call", "documentary")).toBe(3);
  });

  it("corrects misspelt words to ones that exist", () => {
    expect(correctWord("documentry", vocab)).toBe("documentary");
    expect(correctWord("budegt", vocab)).toBe("budget");
    expect(correctWord("natral", vocab)).toBe("natural");
  });

  it("leaves short words, prefixes and unknown words alone", () => {
    expect(correctWord("cal", vocab)).toBe("cal");
    expect(correctWord("docu", vocab)).toBe("docu");
    expect(correctWord("zzzzzzz", vocab)).toBe("zzzzzzz");
  });

  it("corrects a whole query, or says nothing needed it", () => {
    expect(correctQuery("productoin budegt", vocab)).toBe("production budget");
    expect(correctQuery("call sheet", vocab)).toBeNull();
  });

  it("matches every word, short words at the start of a word", () => {
    expect(matchesAll("Call Sheet · Production", ["call", "sh"])).toBe(true);
    expect(matchesAll("Shotlist", ["li"])).toBe(false);
    expect(matchesAll("Shotlist", ["list"])).toBe(true);
  });

  it("completes the last word typed", () => {
    expect(completions("nat", ["Natural light", "Night", "Nature documentary"])).toEqual(["Natural light", "Nature documentary"]);
    expect(completions("natural l", ["Natural light", "Natural colour"])).toEqual(["Natural light"]);
    expect(completions("", ["Natural light"])).toEqual([]);
  });
});
