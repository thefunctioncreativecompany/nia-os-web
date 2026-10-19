import type { FieldKind, FieldSpec, LetterSection, Section, SectionType, TemplateSchema } from '../types';
import { formatDateTimeRange, formatYesNo, type DateTimeRange, type YesNo } from './format';

/*
 * The template engine's data rules (TEMPLATE_ENGINE.md §4): a blank value for each section
 * type, and whether a section counts as filled in. Section types join `ENGINE_TYPES` as their
 * editors are built (step 1: fields, text, letter), and a template opens in the editor only
 * once every one of its sections can be edited.
 *
 * Fields have kinds (T5): text, or a real control with a stored shape (see format.ts).
 */

export type FieldValue = string | DateTimeRange | YesNo;
export type FieldsValue = Record<string, FieldValue>;
export type SectionValue = FieldsValue | string;

export const ENGINE_TYPES: ReadonlySet<SectionType> = new Set(['fields', 'text', 'letter']);

export const canEdit = (schema: TemplateSchema | null): schema is TemplateSchema =>
  !!schema && schema.sections.every((s) => ENGINE_TYPES.has(s.type));

export const fieldLabel = (field: FieldSpec) => (typeof field === 'string' ? field : field.label);
export const fieldKind = (field: FieldSpec): FieldKind => (typeof field === 'string' ? 'text' : field.kind);

export function blankField(field: FieldSpec): FieldValue {
  switch (fieldKind(field)) {
    case 'dateTimeRange':
      return { from: '', to: '', start: '', end: '' };
    case 'yesNo':
      return { answer: '', note: '' };
    default:
      return '';
  }
}

/** A saved answer if it has the field's shape, otherwise a blank one. */
function restoreField(field: FieldSpec, saved: unknown): FieldValue {
  const blank = blankField(field);
  if (typeof blank === 'string') return typeof saved === 'string' ? saved : blank;
  return saved && typeof saved === 'object' ? ({ ...blank, ...saved } as FieldValue) : blank;
}

/** The answer as words: what the downloads print and what fills a letter. */
export function formatField(field: FieldSpec, value: FieldValue | undefined, { datesOnly = false } = {}): string {
  if (value === undefined) return '';
  switch (fieldKind(field)) {
    case 'dateTimeRange':
      return formatDateTimeRange(value as DateTimeRange, { datesOnly });
    case 'yesNo':
      return formatYesNo(value as YesNo);
    default:
      return typeof value === 'string' ? value.trim() : '';
  }
}

export function initSection(section: Section): SectionValue {
  switch (section.type) {
    case 'fields':
      return Object.fromEntries(section.fields.map((f) => [fieldLabel(f), blankField(f)]));
    case 'letter':
      return section.default;
    default:
      return '';
  }
}

const filled = (value: unknown) => String(value ?? '').trim().length > 0;

/** `value` for a letter is the text as shown, with its placeholders filled (see resolveDocument). */
export function hasContent(section: Section, value: SectionValue | undefined): boolean {
  switch (section.type) {
    case 'fields': {
      const fields = (value ?? {}) as FieldsValue;
      return section.fields.some((f) => filled(formatField(f, fields[fieldLabel(f)])));
    }
    case 'text':
      return filled(value);
    // A letter starts with the template's body, so it only counts once it differs from it.
    case 'letter':
      return filled(value) && value !== section.default;
    default:
      return false;
  }
}

export const initDocument = (schema: TemplateSchema) => schema.sections.map(initSection);

/** Every field in the document by label, for letters to fill from. */
function fieldIndex(schema: TemplateSchema, data: SectionValue[]) {
  const index = new Map<string, { field: FieldSpec; value: FieldValue }>();
  schema.sections.forEach((s, i) => {
    if (s.type !== 'fields') return;
    for (const f of s.fields) index.set(fieldLabel(f), { field: f, value: (data[i] as FieldsValue)?.[fieldLabel(f)] });
  });
  return index;
}

/** A letter's [placeholders] filled from the answers above, wherever they are still in the text. */
export function fillLetter(section: LetterSection, text: string, fields: ReturnType<typeof fieldIndex>) {
  let out = text;
  for (const [token, label] of Object.entries(section.fills ?? {})) {
    const entry = fields.get(label);
    const answer = entry ? formatField(entry.field, entry.value, { datesOnly: true }) : '';
    if (answer) out = out.split(token).join(answer);
  }
  return out;
}

/** The document as it reads: letters with their placeholders filled. Stored data is unchanged. */
export function resolveDocument(schema: TemplateSchema, data: SectionValue[]): SectionValue[] {
  const fields = fieldIndex(schema, data);
  return schema.sections.map((s, i) => (s.type === 'letter' && typeof data[i] === 'string' ? fillLetter(s, data[i] as string, fields) : data[i]));
}

export const filledCount = (schema: TemplateSchema, data: SectionValue[]) => {
  const shown = resolveDocument(schema, data);
  return schema.sections.filter((s, i) => hasContent(s, shown[i])).length;
};

/** Saved data with any section or field the template has gained since filled in blank. */
export function restoreDocument(schema: TemplateSchema, saved: unknown): SectionValue[] {
  const list = Array.isArray(saved) ? saved : [];
  return schema.sections.map((s, i) => {
    const value = list[i];
    if (s.type === 'fields') {
      const old = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
      return Object.fromEntries(s.fields.map((f) => [fieldLabel(f), restoreField(f, old[fieldLabel(f)])]));
    }
    return typeof value === 'string' ? value : initSection(s);
  });
}
