import { describe, expect, it } from "vitest";

import { loadPress } from "./press-actions";

describe("loadPress", () => {
  it("finds a title's press kit", async () => {
    expect(await loadPress("12-angry-men")).not.toBeNull();
  });
  it("finds nothing for names that aren't titles, including JavaScript's own", async () => {
    for (const bad of ["constructor", "__proto__", "toString", "hasOwnProperty", "no-such-title"]) expect(await loadPress(bad)).toBeNull();
    // Anything a caller could send that isn't a name.
    for (const bad of [undefined, null, 42, {}, ["atlantics"]]) expect(await loadPress(bad as unknown as string)).toBeNull();
  });
});
