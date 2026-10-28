import { describe, expect, it } from 'vitest';
import { catalog } from './catalog';
import { FIRST_RELEASE, LAUNCHES, NEW_FOR_DAYS, isFresh } from './launches';

const at = (day: string) => Date.parse(`${day}T12:00:00Z`);

describe('template launches', () => {
  it('lists every working template, and only those', () => {
    expect(Object.keys(LAUNCHES).sort()).toEqual(catalog.map((t) => t.code).sort());
    for (const launch of Object.values(LAUNCHES)) {
      expect(launch.launched).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(launch.forYou.length).toBeGreaterThan(20);
      expect(launch.forTeam.length).toBeGreaterThan(20);
    }
  });

  it('never marks the first set as new', () => {
    for (const code of Object.keys(LAUNCHES)) expect(isFresh(code, at(FIRST_RELEASE))).toBe(false);
  });

  it(`marks a later template new for ${NEW_FOR_DAYS} days`, () => {
    LAUNCHES.TEST = { launched: '2026-11-03', forYou: 'x', forTeam: 'x' };
    try {
      expect(isFresh('TEST', at('2026-11-02'))).toBe(false);
      expect(isFresh('TEST', at('2026-11-03'))).toBe(true);
      expect(isFresh('TEST', at('2026-12-02'))).toBe(true);
      expect(isFresh('TEST', at('2026-12-03'))).toBe(false);
    } finally {
      delete LAUNCHES.TEST;
    }
  });
});
