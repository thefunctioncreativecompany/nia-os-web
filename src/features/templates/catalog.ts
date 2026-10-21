import manifestJson from '@/data/templates.manifest.json';
import schemasJson from '@/data/template-schemas.json';
import type { Manifest, TemplateEntry, TemplateSchema } from './types';

export const manifest = manifestJson as unknown as Manifest;
export const catalog: TemplateEntry[] = manifest.templates;
const schemas = new Map((schemasJson as unknown as { templates: TemplateSchema[] }).templates.map(s => [s.code, s] as const));

export const getTemplate = (code: string) => catalog.find(t => t.code === code) ?? null;
export const getSchema = (code: string) => schemas.get(code) ?? null;
/** Count shown in the search box: "Search {n} templates". */
export const templateCount = () => catalog.length;
export const isOpenable = (t: TemplateEntry) => t.status === 'live' && (t.kind === 'workflow' || schemas.has(t.code));

export type NextTemplate = { code: string; name: string; icon: string; stage: string; ready: boolean };
/**
 * "What's next" in the editor (Ika, 2026-10-21): the templates this one leads to, from its
 * `related` links (the workflow links and shared roles), working ones first. Ones without an
 * editor yet come back with `ready: false` so they can be shown greyed.
 */
export function nextTemplates(code: string): NextTemplate[] {
  const t = getTemplate(code);
  if (!t) return [];
  return t.related
    .map(getTemplate)
    .filter((r): r is TemplateEntry => !!r && r.kind === 'document')
    .map((r) => ({ code: r.code, name: r.name, icon: r.icon, stage: r.stage, ready: isOpenable(r) }))
    .sort((a, b) => Number(b.ready) - Number(a.ready));
}

