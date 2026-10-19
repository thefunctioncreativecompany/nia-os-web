import type { Section, SectionType, TemplateSchema } from '../types';

/*
 * The template engine's data rules (TEMPLATE_ENGINE.md §4): a blank value for each section
 * type, and whether a section counts as filled in. Section types join `ENGINE_TYPES` as their
 * editors are built (step 1: fields, text, letter), and a template opens in the editor only
 * once every one of its sections can be edited.
 */

export type FieldsValue = Record<string, string>;
export type SectionValue = FieldsValue | string;

export const ENGINE_TYPES: ReadonlySet<SectionType> = new Set(['fields', 'text', 'letter']);

export const canEdit = (schema: TemplateSchema | null): schema is TemplateSchema =>
  !!schema && schema.sections.every((s) => ENGINE_TYPES.has(s.type));

export function initSection(section: Section): SectionValue {
  switch (section.type) {
    case 'fields':
      return Object.fromEntries(section.fields.map((f) => [f, '']));
    case 'letter':
      return section.default;
    default:
      return '';
  }
}

const filled = (value: unknown) => String(value ?? '').trim().length > 0;

export function hasContent(section: Section, value: SectionValue | undefined): boolean {
  switch (section.type) {
    case 'fields':
      return typeof value === 'object' && Object.values(value).some(filled);
    case 'text':
      return filled(value);
    // A letter starts with the template's body, so it only counts once it has been edited.
    case 'letter':
      return filled(value) && value !== section.default;
    default:
      return false;
  }
}

export const initDocument = (schema: TemplateSchema) => schema.sections.map(initSection);

export const filledCount = (schema: TemplateSchema, data: SectionValue[]) =>
  schema.sections.filter((s, i) => hasContent(s, data[i])).length;

/** Saved data with any section the template has gained since filled in blank. */
export function restoreDocument(schema: TemplateSchema, saved: unknown): SectionValue[] {
  const list = Array.isArray(saved) ? saved : [];
  return schema.sections.map((s, i) => {
    const value = list[i];
    if (s.type === 'fields') {
      const blank = initSection(s) as FieldsValue;
      return value && typeof value === 'object' ? { ...blank, ...(value as FieldsValue) } : blank;
    }
    return typeof value === 'string' ? value : initSection(s);
  });
}
