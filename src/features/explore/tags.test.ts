import { describe, expect, it } from 'vitest';
import { creatorFilms } from './creators';
import { allEntries } from './made-in-africa';
import { HAND_TAGS } from './tag-data';
import { isTag, tagsFor } from './tags';
import { MAPPED_TAGS, SUGGESTION_POOL, aType, frameTag, rankForProject, similarItems, tasteFrom, tasteScore } from './match';

const slugs = [...creatorFilms.map((f) => f.slug), ...allEntries.map((e) => e.title.slug)];

describe('Explore tags', () => {
  it('gives every title and film 15 to 20 tags from the list', () => {
    for (const slug of slugs) {
      expect(HAND_TAGS[slug], slug).toBeDefined();
      const n = tagsFor(slug).length;
      expect(n >= 15 && n <= 20, `${slug} has ${n}`).toBe(true);
    }
    expect(Object.values(HAND_TAGS).flat().filter((t) => !isTag(t))).toEqual([]);
    expect(Object.keys(HAND_TAGS).filter((s) => !slugs.includes(s))).toEqual([]);
  });

  it('only refers to tags that exist', () => {
    expect(MAPPED_TAGS.filter((t) => !isTag(t))).toEqual([]);
  });
});

describe('matching', () => {
  const blank = { genres: '', productionType: null };

  it('names a type in a sentence', () => {
    expect(aType('TV Series')).toBe('a TV series');
    expect(aType('Editorial')).toBe('an editorial');
    expect(aType('Fashion Film')).toBe('a fashion film');
  });

  it('reads deliverable frames', () => {
    expect(frameTag('9:16')).toBe('vertical');
    expect(frameTag('16:9')).toBe('widescreen');
    expect(frameTag('4:5')).toBe('near-square');
    expect(frameTag('4 x 3')).toBe('four-three');
    expect(frameTag('square')).toBeNull();
  });

  it('puts the project type, its frame and its words first, with reasons', () => {
    const [top] = rankForProject({ ...blank, productionType: 'Fashion Film', frames: ['9:16'], description: 'A slow motion sneaker film' }, new Set());
    const film = creatorFilms.find((f) => f.slug === top.slug)!;
    expect(film.aspect).toBeLessThan(0.7);
    expect(tagsFor(top.slug)).toEqual(expect.arrayContaining(['footwear']));
    expect(top.reasons.length).toBeGreaterThan(0);
  });

  it('matches a series to titles with its genres', () => {
    const top = rankForProject({ genres: 'Crime, Thriller', productionType: 'TV Series' }, new Set(), [], undefined, 5);
    for (const m of top) expect(tagsFor(m.slug)).toEqual(expect.arrayContaining(['crime']));
  });

  it('leaves out what the project already has', () => {
    const leaveOut = new Set(SUGGESTION_POOL.slice(0, 10));
    expect(rankForProject(blank, leaveOut).some((m) => leaveOut.has(m.slug))).toBe(false);
  });

  it('learns taste from what someone adds and saves', () => {
    const taste = tasteFrom({ referenced: ['creator-DdHfUYnvTdx'], saved: ['creator-DbLNcPYqEVf'] });
    expect(taste.get('footwear')).toBe(1);
    expect(tasteScore('creator-DTLcXB3ktOq', taste)).toBeGreaterThan(tasteScore('shadow', taste));
    expect(tasteFrom({}).size).toBe(0);
  });

  it('finds similar films by shared tags', () => {
    const like = similarItems('creator-DdaorbETPLN', SUGGESTION_POOL, 1);
    expect(like).toEqual(['creator-Ddab8atTDEs']);
  });
});

describe('recently added', () => {
  const at = (day: string) => Date.parse(`${day}T12:00:00Z`);
  it('keeps a title in the row for 7 days', async () => {
    const { recentlyAdded } = await import('./recent');
    expect(recentlyAdded(at('2026-10-28')).map((x) => x.slug)).toContain('nickel-boys');
    expect(recentlyAdded(at('2026-11-03')).map((x) => x.slug)).toContain('nickel-boys');
    expect(recentlyAdded(at('2026-11-04')).map((x) => x.slug)).not.toContain('nickel-boys');
    expect(recentlyAdded(at('2026-10-27'))).toEqual([]);
  });
});
