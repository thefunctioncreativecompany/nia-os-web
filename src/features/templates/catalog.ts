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
