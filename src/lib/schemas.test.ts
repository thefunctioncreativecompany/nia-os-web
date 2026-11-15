import { describe, expect, it } from "vitest";

import { emailAddress, exploreSlug, rowId, templateCode } from "./schemas";

describe("server action inputs", () => {
  it("accepts what Nia's pages send", () => {
    expect(exploreSlug.safeParse("atlantics").success).toBe(true);
    expect(exploreSlug.safeParse("creator-DDzBw_xKbKm").success).toBe(true);
    expect(templateCode.safeParse("D07").success).toBe(true);
    expect(rowId.safeParse("7a1d6c1e-3b2f-4c8e-9d0a-1b2c3d4e5f60").success).toBe(true);
    expect(emailAddress.safeParse("  Someone@Example.com ").data).toBe("Someone@Example.com");
  });
  it("turns away anything else", () => {
    for (const bad of [undefined, null, 42, {}, [], "", "../etc", "a b", "x".repeat(121)]) expect(exploreSlug.safeParse(bad).success).toBe(false);
    for (const bad of ["d07", "D7", "D007", { code: "D07" }]) expect(templateCode.safeParse(bad).success).toBe(false);
    for (const bad of ["1", "not-a-uuid", 7]) expect(rowId.safeParse(bad).success).toBe(false);
    for (const bad of ["no-at-sign", "a@", `${"x".repeat(320)}@example.com`]) expect(emailAddress.safeParse(bad).success).toBe(false);
  });
});
