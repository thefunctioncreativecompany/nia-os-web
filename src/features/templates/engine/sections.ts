import type { FieldKind, FieldSpec, LetterSection, Section, SectionType, TableSection, TemplateSchema } from '../types';
import type { PersonRef } from '@/components/nia/assignees';
import { formatDateTimeRange, formatDays, formatDuration, formatMoney, formatYesNo, toAmount, type DateTimeRange, type Duration, type YesNo } from './format';

/*
 * The template engine's data rules (TEMPLATE_ENGINE.md §4): a blank value for each section
 * type, and whether a section counts as filled in.
 *
 * Fields and table columns have kinds (T5): text, or a real control with a stored shape (see
 * format.ts), so answers can be picked rather than typed and later filled from voice memos.
 */

export type FieldValue = string | boolean | DateTimeRange | Duration | YesNo | PersonRef[];
export type FieldsValue = Record<string, FieldValue>;
export type TableRow = { id: string } & Record<string, FieldValue>;
export type SectionValue = FieldsValue | TableRow[] | string;

export const ENGINE_TYPES: ReadonlySet<SectionType> = new Set(['fields', 'text', 'letter', 'table']);

/** Templates whose controls have been reviewed with Ika join here (build step 7 and T5). */
const READY = new Set(['D07', 'D03', 'D06', 'D08', 'D13', 'D14', 'D10', 'D04']);

export const canEdit = (schema: TemplateSchema | null): schema is TemplateSchema =>
  !!schema && READY.has(schema.code) && schema.sections.every((s) => ENGINE_TYPES.has(s.type));

export const fieldLabel = (field: FieldSpec) => (typeof field === 'string' ? field : field.label);
export const fieldKind = (field: FieldSpec): FieldKind => (typeof field === 'string' ? 'text' : field.kind);
const unitsOf = (field: FieldSpec) => (typeof field === 'string' ? undefined : field.units) ?? ['minutes', 'hours', 'days'];

export function blankField(field: FieldSpec): FieldValue {
  switch (fieldKind(field)) {
    case 'dateTimeRange':
      return { from: '', to: '', start: '', end: '' };
    case 'yesNo':
      return { answer: '', note: '' };
    case 'duration':
      return { amount: '', unit: unitsOf(field)[0] };
    case 'check':
      return false;
    case 'people':
      return [];
    default:
      return '';
  }
}

/** A saved answer if it has the field's shape, otherwise a blank one. */
function restoreField(field: FieldSpec, saved: unknown): FieldValue {
  const blank = blankField(field);
  if (Array.isArray(blank)) return Array.isArray(saved) ? saved.filter((p) => typeof p?.name === 'string' && p.name.trim()) : blank;
  if (typeof blank === 'string') return typeof saved === 'string' ? saved : blank;
  if (typeof blank === 'boolean') return typeof saved === 'boolean' ? saved : blank;
  return saved && typeof saved === 'object' ? ({ ...blank, ...saved } as FieldValue) : blank;
}

/** The answer as words: what the downloads print and what fills a letter. */
export function formatField(field: FieldSpec, value: FieldValue | undefined, { datesOnly = false, currency = 'USD' } = {}): string {
  if (value === undefined) return '';
  switch (fieldKind(field)) {
    case 'money':
      return typeof value === 'string' && value.trim() ? formatMoney(toAmount(value), currency) : '';
    case 'dateTimeRange':
      return formatDateTimeRange(value as DateTimeRange, { datesOnly });
    case 'yesNo':
      return formatYesNo(value as YesNo);
    case 'duration':
      return formatDuration(value as Duration);
    case 'date':
      return formatDays(value as string, value as string);
    case 'check':
      return value === true ? 'Yes' : '';
    case 'people':
      return Array.isArray(value) ? value.map((p) => p.name).join(', ') : '';
    default:
      return typeof value === 'string' ? value.trim() : '';
  }
}

// Rows added while editing get a random id. A template's starting rows are numbered instead:
// the blank document is prepared ahead of time, where random values aren't allowed.
const uid = () => crypto.randomUUID();

/** Columns people fill in: everything but the automatic number and worked-out columns. */
export const editableColumns = (section: TableSection) =>
  section.columns.filter((c) => fieldLabel(c) !== section.autonumber && !section.computed?.[fieldLabel(c)]);

/** A worked-out cell, e.g. Extended = Rate × QTY; null when neither side has a number yet. */
export function computeCell(section: TableSection, row: TableRow, column: string): number | null {
  const parts = section.computed?.[column];
  if (!parts) return null;
  const [a, b] = parts;
  if (!String(row[a] ?? '').trim() && !String(row[b] ?? '').trim()) return null;
  return toAmount(row[a]) * toAmount(row[b]);
}

/** The table's total (e.g. Total Due), or null if it has none. */
export function tableTotal(section: TableSection, rows: TableRow[]): number | null {
  if (!section.total) return null;
  const column = section.total.column;
  return rows.reduce((sum, row) => sum + (section.computed?.[column] ? computeCell(section, row, column) ?? 0 : toAmount(row[column])), 0);
}

/** The document's currency: a field called "Currency" if it has one, otherwise US dollars. */
export function documentCurrency(schema: TemplateSchema, data: SectionValue[]) {
  for (const [i, s] of schema.sections.entries()) {
    if (s.type !== 'fields') continue;
    const value = (data[i] as FieldsValue)?.Currency;
    if (typeof value === 'string' && /^[A-Z]{3}$/.test(value)) return value;
  }
  return 'USD';
}

export function blankRow(section: TableSection, id: string = uid()): TableRow {
  return { id, ...Object.fromEntries(editableColumns(section).map((c) => [fieldLabel(c), blankField(c)])) };
}

export function initSection(section: Section): SectionValue {
  switch (section.type) {
    case 'fields':
      return Object.fromEntries(section.fields.map((f) => [fieldLabel(f), blankField(f)]));
    case 'table':
      return Array.from({ length: section.rows || 3 }, (_, i) => blankRow(section, `row-${i + 1}`));
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
    case 'table': {
      const rows = Array.isArray(value) ? value : [];
      return rows.some((row) => editableColumns(section).some((c) => filled(formatField(c, row[fieldLabel(c)]))));
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

/** Saved data with any section, field or column the template has gained since filled in blank. */
export function restoreDocument(schema: TemplateSchema, saved: unknown): SectionValue[] {
  const list = Array.isArray(saved) ? saved : [];
  return schema.sections.map((s, i) => {
    const value = list[i];
    if (s.type === 'fields') {
      const old = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
      return Object.fromEntries(s.fields.map((f) => [fieldLabel(f), restoreField(f, old[fieldLabel(f)])]));
    }
    if (s.type === 'table') {
      if (!Array.isArray(value)) return initSection(s);
      return value.map((row: Record<string, unknown>, r) => ({
        id: typeof row?.id === 'string' ? row.id : `row-${r + 1}`,
        ...Object.fromEntries(editableColumns(s).map((c) => [fieldLabel(c), restoreField(c, row?.[fieldLabel(c)])])),
      }));
    }
    return typeof value === 'string' ? value : initSection(s);
  });
}
