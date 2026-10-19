import type { SearchableTemplate, SearchResult, TemplateEntry } from './types';

/**
 * Plain-language template search. Each word is expanded with everyday synonyms,
 * then scored against name > keywords > roles > stage/family > description.
 * Matches start at word boundaries ("line" finds Line Producer, not "guideline").
 * Pure function: swap in or blend with AI matching later without touching the UI.
 */
export const STOPWORDS = new Set(
  "a an the for my our i im i'm we need to of in on at with and or want make making plan planning planned template templates next week some help me do doing new something".split(' '),
);

export const SYNONYMS: Record<string, string[]> = {
  photoshoot: ['shoot', 'editorial', 'photo'], shoot: ['shoot', 'call sheet', 'shot list'], fashion: ['editorial', 'fashion', 'pull', 'stylist', 'wardrobe'],
  lookbook: ['editorial', 'lookbook'], magazine: ['editorial'], campaign: ['campaign', 'editorial', 'brand', 'social'], ad: ['av script', 'commercial'], commercial: ['av script', 'commercial'],
  money: ['budget', 'invoice'], cost: ['budget'], costs: ['budget'], spend: ['budget'], pay: ['invoice'], paid: ['invoice'], bill: ['invoice'],
  crew: ['crew', 'call sheet'], team: ['crew'], schedule: ['call sheet', 'schedule', 'calendar'], permit: ['filming notice'], permits: ['filming notice'], location: ['filming notice', 'location'],
  cast: ['casting'], model: ['casting'], models: ['casting'], actors: ['casting'], talent: ['casting', 'talent'],
  film: ['shot list', 'storyboard', 'script'], movie: ['script', 'storyboard'], video: ['shot list', 'storyboard', 'av script'], music: ['music', 'cue sheet'], song: ['music'],
  tiktok: ['tiktok', 'grwm', 'creator'], reels: ['reels', 'tiktok'], instagram: ['instagram', 'social'], youtube: ['youtube', 'tutorial', 'explainer'], vlog: ['day in my life'],
  makeup: ['makeup', 'grwm'], beauty: ['beauty', 'makeup'], gear: ['equipment', 'camera'], lights: ['lighting'], edit: ['edit', 'contact sheet'], colour: ['color'],
  sound: ['sound', 'audio'], press: ['press'], pr: ['press', 'publicity'], legal: ['legal', 'contract'], wedding: ['event'], unboxing: ['unboxing', 'haul'], brand: ['brand'],
  script: ['script'], story: ['storytime', 'storyboard'], photo: ['photo', 'editorial'], photographer: ['photo', 'editorial'], stylist: ['stylist', 'pull', 'editorial'], styling: ['stylist', 'pull', 'wardrobe'],
};

const STATUS_BOOST: Record<TemplateEntry['status'], number> = { live: 3, designed: 1, gap: 0 };
const words = (s: string) => s.toLowerCase().split(/[^a-z0-9']+/).filter(Boolean);

export function rankTemplates<T extends SearchableTemplate>(query: string, list: T[], familyLabels: Record<string, string> = {}): SearchResult<T>[] {
  const q = query.toLowerCase().replace(/[^a-z0-9\s'-]/g, ' ').split(/\s+/).filter(w => w.length >= 2 && !STOPWORDS.has(w));
  if (!q.length) return [];
  return list
    .map(t => {
      const name = t.name.toLowerCase(), kw = t.keywords.join(' | ').toLowerCase(), roles = t.icps.join(' | ').toLowerCase();
      const nameW = words(t.name), kwW = words(t.keywords.join(' ')), roleW = words(t.icps.join(' '));
      const metaW = words(`${t.stage} ${familyLabels[t.family] ?? ''}`), descW = words(`${t.preview ?? ''} ${t.object}`);
      const hit = (ws: string[], str: string, term: string) => (term.includes(' ') ? str.includes(term) : ws.some(w => w.startsWith(term)));
      const termScore = (term: string) =>
        hit(nameW, name, term) ? 12 : hit(kwW, kw, term) ? 6 : hit(roleW, roles, term) ? 5 : hit(metaW, '', term) ? 3 : term.length > 3 && hit(descW, '', term) ? 2 : 0;
      let score = 0;
      const matched: string[] = [];
      for (const w of q) {
        const base = w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w;
        let best = Math.max(termScore(w), termScore(base));
        for (const s of SYNONYMS[w] ?? SYNONYMS[base] ?? []) best = Math.max(best, termScore(s) * 0.8);
        if (best > 0) { score += best; matched.push(w); }
      }
      if (score > 0) score += STATUS_BOOST[t.status] + (matched.length === q.length ? score * 0.2 : 0);
      return { template: t, score, matched, of: q.length };
    })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score);
}
