import { describe, expect, it } from 'vitest';
import { classifyRolePart, filledParts, PROFILE_PARTS, roleParts, type ProfilePart } from '@/lib/production-profile';
import { CREW_ROLES } from '@/lib/projects';
import { creatorFilms } from './creators';
import { exploreProfiles, profileFor } from './profiles';

describe('Explore production profiles', () => {
  it('decides every creator credit: a Crew & talent role, who it is for, kept as typed or not crew', () => {
    const unknown = creatorFilms.flatMap((f) => f.credits.flatMap((c) => roleParts(c.role).filter((p) => classifyRolePart(p) === 'unknown').map((p) => `${f.slug}: "${c.role}" (${p})`)));
    expect(unknown).toEqual([]);
  });

  it('gives every Explore item a profile with its type and title', () => {
    const profiles = exploreProfiles();
    expect(profiles.length).toBeGreaterThan(150);
    for (const p of profiles) {
      expect(p.type, p.id).not.toBeNull();
      expect(p.title, p.id).not.toBe('');
      expect(profileFor(p.id)?.id).toBe(p.id);
      for (const c of p.crew) expect(c.name.trim(), `${p.id} ${c.role}`).not.toBe('');
    }
    // Creator films always know their frame, and credit crew or cast unless they credit only who
    // it's for (a label and a brand).
    for (const p of profiles.filter((x) => x.source === 'creator')) {
      expect(p.frames.length, p.id).toBe(1);
      const parts = filledParts(p);
      expect(parts.has('crew') || parts.has('cast') || Boolean(p.client || p.brand || p.agency), p.id).toBe(true);
    }
  });

  it('maps most creator credits onto Crew & talent roles', () => {
    const roles = exploreProfiles().filter((p) => p.source === 'creator').flatMap((p) => p.crew.map((c) => c.role));
    const mapped = roles.filter((r) => (CREW_ROLES as readonly string[]).includes(r)).length;
    // 75% on 2026-10-30; the rest are jobs Crew & talent has no role for (grips, PAs, runners…).
    expect(mapped / roles.length).toBeGreaterThan(0.7);
  });

  it('reports which parts each kind of item has (where Explore is thin)', () => {
    const report: Record<string, Record<string, string>> = {};
    for (const source of ['title', 'film', 'creator'] as const) {
      const ps = exploreProfiles().filter((p) => p.source === source);
      report[source] = Object.fromEntries((Object.keys(PROFILE_PARTS) as ProfilePart[]).map((part) => [part, `${ps.filter((p) => filledParts(p).has(part)).length}/${ps.length}`]));
    }
    console.info('Explore profile coverage', report);
    expect(Object.keys(report)).toHaveLength(3);
  });
});
