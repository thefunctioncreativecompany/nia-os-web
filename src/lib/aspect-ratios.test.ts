import { describe, expect, it } from "vitest";

import { recognizeAspect } from "./aspect-ratios";

describe("recognizeAspect", () => {
  it("names standard shapes from a picture's size", () => {
    expect(recognizeAspect(1920, 1080).label).toBe("16:9");
    expect(recognizeAspect(1080, 1920).label).toBe("9:16");
    expect(recognizeAspect(640, 480).label).toBe("4:3");
    expect(recognizeAspect(1080, 1350).label).toBe("4:5");
    expect(recognizeAspect(4096, 1716).label).toBe("2.39:1");
    expect(recognizeAspect(1998, 1080).label).toBe("1.85:1");
  });

  it("allows a thumbnail's rounding", () => {
    expect(recognizeAspect(640, 1138).label).toBe("9:16");
    expect(recognizeAspect(640, 446).label).toBe("1.43:1");
    expect(recognizeAspect(640, 390).label).toBe("1.66:1");
  });

  it("keeps an unusual shape as measured rather than forcing it into a standard one", () => {
    const r = recognizeAspect(1.55);
    expect(r.label).toBe("1.55:1");
    expect(r.standard).toBeNull();
    expect(r.value).toBe(1.55);
  });

  it("snaps a recognised shape to its exact value", () => {
    expect(recognizeAspect(640, 361).value).toBeCloseTo(16 / 9);
  });
});
