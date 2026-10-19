import type { Stage, Suggestion, TemplateEntry, TemplateEvent, UserTemplateProfile } from './types';

/**
 * "Suggested for you": Nia learns from what a person opens and uses, plus the role (ICP)
 * they chose at onboarding.
 *
 * Signals → score (higher is better):
 *  • Role: made for their role +6; related to a role template +3.
 *  • Goes with: a template they used lists this one as related +4×w, or the reverse +2×w.
 *  • Next step: same group, next production stage +1.5×w.
 *  • Familiar: already viewed a lot −1.5×w (make room for new ones).
 *  • Just used (use/complete in the last 3 days): excluded; it's in their projects.
 *  w = event weight (view 1, use 3, complete 5) halved every 14 days, capped at 1.5 per template.
 *  History counts half for templates outside the person's role.
 * Cold start (no role, no history): STARTERS.
 */
export const EVENT_WEIGHT: Record<TemplateEvent['type'], number> = { view: 1, use: 3, complete: 5, search: 0 };
export const HALF_LIFE_DAYS = 14;
export const STARTERS = ['T01', 'D01', 'D06', 'D03', 'D02', 'D15'];
const STAGE_ORDER: Record<Stage, number> = { 'Pre-production': 0, Production: 1, 'Post-production': 2 };
const DAY = 864e5;

export const roleLabel = (r: string) => (/[/(]/.test(r) ? `${r} roles` : r.endsWith('s') ? r : `${r}s`);

export function suggestTemplates(catalog: TemplateEntry[], { role, events }: UserTemplateProfile, limit = 6, now = Date.now()): Suggestion[] {
  const by = new Map(catalog.map(t => [t.code, t] as const));
  const used = new Map<string, number>();
  const recentlyUsed = new Set<string>();
  for (const e of events) {
    if (!by.has(e.code) || e.type === 'search') continue;
    const age = (now - e.at) / DAY;
    const w = (EVENT_WEIGHT[e.type] ?? 1) * Math.pow(0.5, age / HALF_LIFE_DAYS);
    used.set(e.code, (used.get(e.code) ?? 0) + w);
    if (e.type !== 'view' && age < 3) recentlyUsed.add(e.code);
  }
  const usedList = [...used].map(([code, w]) => ({ t: by.get(code)!, w })).sort((a, b) => b.w - a.w);
  const roleCore = new Set(role ? catalog.filter(t => t.icps.includes(role)).map(t => t.code) : []);
  const roleNear = new Set([...roleCore].flatMap(c => by.get(c)?.related ?? []));

  const scored = catalog
    .filter(c => c.status !== 'gap' && !recentlyUsed.has(c.code))
    .map(c => {
      const parts: { s: number; why: string | null }[] = [];
      const fitsRole = !role || roleCore.has(c.code) || roleNear.has(c.code);
      if (role && roleCore.has(c.code)) parts.push({ s: 6, why: `Popular with ${roleLabel(role)}` });
      else if (role && roleNear.has(c.code)) parts.push({ s: 3, why: `Popular with ${roleLabel(role)}` });
      const k = fitsRole ? 1 : 0.5;
      for (const { t: u, w } of usedList) {
        if (u.code === c.code) continue;
        const ww = Math.min(w, 1.5);
        if (u.related.includes(c.code)) parts.push({ s: 4 * ww * k, why: `Goes with ${u.name}` });
        else if (c.related.includes(u.code)) parts.push({ s: 2 * ww * k, why: `Goes with ${u.name}` });
        if (u.group && u.group === c.group && STAGE_ORDER[c.stage] === STAGE_ORDER[u.stage] + 1) parts.push({ s: 1.5 * ww * k, why: `Next after ${u.name}` });
      }
      const seen = used.get(c.code);
      if (seen) parts.push({ s: -1.5 * Math.min(seen, 3), why: null });
      const score = (c.status === 'live' ? 0.5 : 0) + parts.reduce((a, p) => a + p.s, 0);
      const top = parts.filter(p => p.why).sort((a, b) => b.s - a.s)[0];
      return { template: c, score, why: top?.why ?? 'Popular to start' };
    });

  const personal = scored.filter(r => r.score > 0.5).sort((a, b) => b.score - a.score);
  const fill = STARTERS.map(code => scored.find(r => r.template.code === code)).filter((r): r is Suggestion => !!r && !personal.includes(r));
  return [...personal, ...fill].slice(0, limit);
}

/** The 3 related templates for the preview modal, in manifest order. */
export function relatedTemplates(t: TemplateEntry, catalog: TemplateEntry[]): TemplateEntry[] {
  const by = new Map(catalog.map(x => [x.code, x] as const));
  return t.related.map(c => by.get(c)).filter((x): x is TemplateEntry => !!x);
}
