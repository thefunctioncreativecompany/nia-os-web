import manifestJson from '@/data/templates.manifest.json';
import schemasJson from '@/data/template-schemas.json';
import { canEdit } from './engine/sections';
import type { Manifest, TemplateEntry, TemplateSchema } from './types';

export const manifest = manifestJson as unknown as Manifest;
const schemas = new Map((schemasJson as unknown as { templates: TemplateSchema[] }).templates.map(s => [s.code, s] as const));
export const getSchema = (code: string) => schemas.get(code) ?? null;

/** Fully working: live and opens in the editor. */
export const isWorking = (t: TemplateEntry) => t.status === 'live' && canEdit(getSchema(t.schema ?? t.code));
/** Every template in the manifest, for looking up what saved documents were made from. */
export const everyTemplate: TemplateEntry[] = manifest.templates;
/**
 * The templates people see (Ika, 2026-10-28): only the ones that work. The rest stay in the
 * manifest and come back one at a time as each is built (add it to launches.ts when it does).
 */
export const catalog: TemplateEntry[] = everyTemplate.filter(isWorking);

export const getTemplate = (code: string) => catalog.find(t => t.code === code) ?? null;
/** Count shown in the search box: "Search {n} templates". */
export const templateCount = () => catalog.length;

export type NextTemplate = { code: string; name: string; icon: string; stage: string; ready: boolean };
/**
 * "What's next" in the editor (Ika, 2026-10-21): the working templates this one leads to, from
 * its `related` links (the workflow links and shared roles).
 */
export function nextTemplates(code: string): NextTemplate[] {
  const t = getTemplate(code);
  if (!t) return [];
  return t.related
    .map(getTemplate)
    .filter((r): r is TemplateEntry => !!r && r.kind === 'document')
    .map((r) => ({ code: r.code, name: r.name, icon: r.icon, stage: r.stage, ready: true }));
}
