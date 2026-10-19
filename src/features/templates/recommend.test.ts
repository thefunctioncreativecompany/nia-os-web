import { describe, expect, it } from 'vitest';
import manifest from '../../data/templates.manifest.json';
import { rankTemplates } from './search';
import { suggestTemplates } from './recommend';
import type { TemplateEntry } from './types';

const catalog = (manifest as unknown as { templates: TemplateEntry[] }).templates;
const names = (xs: { template: TemplateEntry }[]) => xs.map(x => x.template.name);
const now = Date.UTC(2026, 9, 19);

describe('search', () => {
  it('finds templates from everyday words', () => {
    expect(names(rankTemplates('money', catalog))[0]).toBe('Production Budget');
    expect(names(rankTemplates('permit', catalog))[0]).toBe('Filming Notice');
    expect(names(rankTemplates('call sheet', catalog))[0]).toBe('Call Sheet');
  });
  it('matches at word boundaries', () => {
    expect(names(rankTemplates('line producer', catalog))).not.toContain('Content Production Guideline');
  });
  it('returns nothing for nonsense', () => {
    expect(rankTemplates('xyzzy', catalog)).toHaveLength(0);
  });
});

describe('suggestions', () => {
  it('starts from the role when there is no history', () => {
    const s = suggestTemplates(catalog, { role: 'Creative Director', events: [] }, 6, now);
    expect(s[0].template.name).toBe('Editorial Shoot');
    expect(s.every(x => x.template.status !== 'gap')).toBe(true);
  });
  it('learns from use and hides what was just used', () => {
    const s = suggestTemplates(catalog, { role: null, events: [{ code: 'D04', type: 'use', at: now - 3600e3 }] }, 6, now);
    expect(names(s)).not.toContain('Invoice');
    expect(s.some(x => x.why === 'Goes with Invoice')).toBe(true);
  });
  it('adapts to the chosen role', () => {
    const s = suggestTemplates(catalog, { role: 'Content Creator / Influencer', events: [] }, 6, now);
    expect(s.every(x => x.template.group === 'UGC & Social Content')).toBe(true);
  });
  it('falls back to starters on a cold start', () => {
    expect(suggestTemplates(catalog, { role: null, events: [] }, 6, now)).toHaveLength(6);
  });
});
