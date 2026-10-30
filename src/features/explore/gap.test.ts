import { describe, expect, it } from 'vitest';
import type { Project } from '@/lib/projects';
import { comparablesFor, projectGap } from './gap';

const project = (over: Partial<Project> = {}): Project => ({
  id: 'p1', title: 'Studio lookbook', description: 'A fashion film for a streetwear drop', coverUrl: null,
  productionType: 'Fashion Film', stage: 'Pre-Production', productionDate: '', duration: '', director: '',
  writers: '', genres: 'Fashion', stars: '', shootStart: null, shootEnd: null, client: '', agency: '',
  dueDate: null, deliverables: [], notes: '', logline: '', usage: '', looks: null, publication: '', crew: [],
  ownerId: 'u1', shareToken: null, updatedByName: '', createdAt: '', updatedAt: '', ...over,
});

describe('Projects like this had', () => {
  it('compares a fashion film with finished fashion work that credits a crew', () => {
    const like = comparablesFor(project());
    expect(like.length).toBeGreaterThan(2);
    expect(like.filter((p) => p.source === 'creator').length).toBeGreaterThan(0);
  });

  it('lists what a new project in prep is missing, plan first', () => {
    const p = project();
    const gap = projectGap(p, [], comparablesFor(p));
    const keys = gap.items.map((i) => i.key);
    expect(keys.slice(0, 2)).toEqual(['shoot-dates', 'deliverables']);
    expect(keys).toContain('call-sheets');
    expect(keys).toContain('shotlist');
    const crew = gap.items.find((i) => i.key === 'crew');
    expect(crew?.detail).toMatch(/^Most often credited: /);
    expect(gap.items.find((i) => i.key === 'shotlist')?.action.href).toBe('/templates/D06?project=p1');
  });

  it('wants a call sheet per shoot day and counts the ones made', () => {
    const p = project({ shootStart: '2026-11-14', shootEnd: '2026-11-15' });
    const gap = projectGap(p, [{ templateCode: 'D01' }], []);
    const sheets = gap.items.find((i) => i.key === 'call-sheets')!;
    expect(sheets.status).toBe('1 of 2');
    expect(sheets.done).toBe(false);
    expect(sheets.action.href).toBe('/templates/D01?project=p1&another=1');
    expect(gap.items.find((i) => i.key === 'shoot-dates')?.done).toBe(true);
    // Done items go last.
    expect(gap.items.at(-1)?.done).toBe(true);
  });

  it('asks for frame shapes when a deliverable has none', () => {
    const p = project({ deliverables: [{ what: '60s film', count: 1, frame: '16:9' }, { what: 'cutdown', count: 3, frame: null }] });
    expect(projectGap(p, [], []).items.find((i) => i.key === 'frames')?.status).toBe('1 of 2');
  });

  it('after the shoot, asks only for what is handed over', () => {
    const p = project({ stage: 'Wrapped', deliverables: [{ what: 'film', count: 1, frame: '9:16' }] });
    expect(projectGap(p, [], comparablesFor(p)).items.map((i) => i.key)).toEqual(['invoice']);
  });
});
