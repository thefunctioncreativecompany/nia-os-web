import { describe, expect, it } from 'vitest';
import type { Project } from './projects';
import { crewSize, filledParts, parseMinutes, profileOfProject, readCredits, roleParts, shootDayCount } from './production-profile';

const project = (over: Partial<Project> = {}): Project => ({
  id: 'p1', title: 'Studio lookbook', description: '', coverUrl: null, productionType: 'Lookbook',
  stage: 'Pre-Production', productionDate: '', duration: '', director: '', writers: '', genres: '',
  stars: '', shootStart: null, shootEnd: null, client: '', agency: '', dueDate: null, deliverables: [],
  notes: '', logline: '', usage: '', looks: null, publication: '', crew: [], ownerId: 'u1',
  shareToken: null, updatedByName: '', createdAt: '', updatedAt: '', ...over,
});

describe('Credit roles', () => {
  it('keeps one job whole and splits several', () => {
    expect(roleParts('Hair and make-up')).toEqual(['hair and make-up']);
    expect(roleParts('Director, DOP and editor')).toEqual(['director', 'dop', 'editor']);
  });

  it('maps spellings onto Crew & talent roles and finds who it is for', () => {
    const { crew, client, agency, brand } = readCredits([
      { role: 'Client', name: 'adidas Originals' },
      { role: 'Agency', name: 'Room Studios' },
      { role: 'DOP', name: 'Jason Prins' },
      { role: '1st AC', name: 'Rory Springthorpe' },
      { role: 'Starring', name: 'Amara' },
      { role: 'Director, DOP and editor', name: 'Sam' },
      { role: 'Key grip', name: 'Lebo' },
      { role: 'Thanks to', name: 'Everyone' },
    ]);
    expect(client).toBe('adidas Originals');
    expect(agency).toBe('Room Studios');
    expect(brand).toBeNull();
    expect(crew).toEqual([
      { role: 'Director of Photography', name: 'Jason Prins' },
      { role: 'Camera Assistant', name: 'Rory Springthorpe' },
      { role: 'Talent', name: 'Amara' },
      { role: 'Director', name: 'Sam' },
      { role: 'Director of Photography', name: 'Sam' },
      { role: 'Editor', name: 'Sam' },
      { role: 'Key grip', name: 'Lebo' },
    ]);
  });
});

describe('Project profiles', () => {
  it('reads running times', () => {
    expect(parseMinutes('3 minutes')).toBe(3);
    expect(parseMinutes('90 min')).toBe(90);
    expect(parseMinutes('1h 30')).toBe(90);
    expect(parseMinutes('60s')).toBe(1);
    expect(parseMinutes('about a reel')).toBeNull();
  });

  it('counts shoot days from both ends', () => {
    expect(shootDayCount('2026-11-12', '2026-11-14')).toBe(3);
    expect(shootDayCount('2026-11-12', null)).toBe(1);
    expect(shootDayCount(null, null)).toBeNull();
  });

  it('reads a project into the shared shape', () => {
    const p = profileOfProject(project({
      genres: 'Fashion, Lifestyle',
      shootStart: '2026-11-12',
      shootEnd: '2026-11-13',
      client: 'Maison',
      deliverables: [{ what: 'stills', count: 20, frame: '4x5' }, { what: '15s cutdown', count: 3, frame: '9:16' }],
      crew: [{ role: 'Photographer', name: 'Ika' }, { role: 'Stylist', name: 'Naledi' }, { role: 'Model', name: 'Zola' }, { role: 'Stylist', name: ' ' }],
    }));
    expect(p.genres).toEqual(['Fashion', 'Lifestyle']);
    expect(p.frames).toEqual(['4:5', '9:16']);
    expect(p.year).toBe(2026);
    expect(p.shootDays).toBe(2);
    expect(crewSize(p)).toBe(2);
    expect([...filledParts(p)].sort()).toEqual(['cast', 'client', 'crew', 'deliverables', 'frames', 'genres', 'length', 'type', 'year']);
  });

  it('shows what an empty project is missing', () => {
    expect([...filledParts(profileOfProject(project()))]).toEqual(['type']);
  });
});
