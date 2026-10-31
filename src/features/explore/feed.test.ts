import { describe, expect, it } from "vitest";

import { FEED_STORIES, FEED_TOPICS, ageInDays, feedScore, rankFeed, relevance, type FeedStory } from "./feed";

const now = Date.parse("2026-10-31");
const nobody = { types: [] };
const story = (over: Partial<FeedStory>): FeedStory => ({ ...FEED_STORIES[0], ...over });

describe("feed", () => {
  it("every story links out, has a cover, a known topic and no placeholders", () => {
    for (const s of FEED_STORIES) {
      expect(s.source.href).toMatch(/^https:\/\//);
      expect(s.cover).toMatch(/^\/feed\//);
      expect(FEED_TOPICS).toContain(s.topic);
      // Placeholders look like "[What it offers]"; JSON's own brackets are followed by " [ or {.
      expect(JSON.stringify(s)).not.toMatch(/\[[A-Z$]/);
    }
  });

  it("reads a month-only date as the middle of the month", () => {
    expect(Math.round(ageInDays(story({ source: { ...FEED_STORIES[0].source, published: "2026-06" } }), now))).toBe(138);
  });

  it("lifts stories about the kinds of work the reader makes", () => {
    const s = story({ reach: 0.4, types: ["Commercial"] });
    expect(relevance(s, { types: ["Commercial"] })).toBeCloseTo(0.7);
    expect(relevance(s, { types: ["Podcast"] })).toBe(0.4);
  });

  it("puts fresh, relevant news first and the off-topic fund last", () => {
    const ranked = rankFeed(FEED_STORIES, nobody, now).map((s) => s.id);
    expect(ranked[0]).toBe("incentives-2026");
    expect(ranked.at(-1)).toBe("breakthrough-2m");
  });

  it("a creator's projects bring creator-economy news up", () => {
    const creator = { types: ["Social Content"] };
    const s = FEED_STORIES.find((x) => x.id === "compound-creative")!;
    expect(feedScore(s, creator, now)).toBeGreaterThan(feedScore(s, nobody, now));
  });

  it("older news counts less", () => {
    const fresh = story({ source: { ...FEED_STORIES[0].source, published: "2026-10-30" } });
    const old = story({ source: { ...FEED_STORIES[0].source, published: "2025-10-30" } });
    expect(feedScore(fresh, nobody, now)).toBeGreaterThan(feedScore(old, nobody, now));
  });
});
