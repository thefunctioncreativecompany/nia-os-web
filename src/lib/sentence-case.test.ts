import { describe, expect, it } from "vitest";

import { sentenceCase } from "@/lib/sentence-case";

describe("sentenceCase", () => {
  it.each([
    ["Pre-Production", "Pre-production"],
    ["In Production", "In production"],
    ["Photo Shoot", "Photo shoot"],
    ["TV Series", "TV series"],
    ["Short Film", "Short film"],
    ["Sci-Fi", "Sci-fi"],
    ["Coming of Age", "Coming of age"],
    ["Camera & Visual", "Camera & visual"],
    ["UGC & Social Content", "UGC & social content"],
    ["Production Management & Operations", "Production management & operations"],
    ["Q&A", "Q&A"],
    ["Development", "Development"],
  ])("%s → %s", (input, output) => expect(sentenceCase(input)).toBe(output));
});
