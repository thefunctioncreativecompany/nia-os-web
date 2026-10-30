import type { BudgetSection, CategoriesSection, ChecklistSection, FieldKind, MetricsSection, FieldSpec, LetterSection, Section, SectionType, TableSection, TemplateSchema } from '../types';
import type { PersonRef } from '@/components/nia/assignees';
import {
  formatClock,
  formatDateTimeRange,
  formatDays,
  formatDuration,
  formatMoney,
  formatPages,
  formatTimeRange,
  formatWeather,
  formatYesNo,
  toAmount,
  type DateTimeRange,
  type Duration,
  type TimeRange,
  type Weather,
  type YesNo,
} from './format';

/*
 * The template engine's data rules (TEMPLATE_ENGINE.md §4): a blank value for each section
 * type, and whether a section counts as filled in.
 *
 * Fields and table columns have kinds (T5): text, or a real control with a stored shape (see
 * format.ts), so answers can be picked rather than typed and later filled from voice memos.
 */

/** refs are row ids in another table (string[]); people are PersonRef[]. */
export type FieldValue = string | boolean | DateTimeRange | Duration | YesNo | TimeRange | Weather | PersonRef[] | string[];
export type FieldsValue = Record<string, FieldValue>;
export type TableRow = { id: string } & Record<string, FieldValue>;
/** A budget (Production Budget): each group's lines, and the contingency as a percentage. */
export type BudgetValue = { groups: TableRow[][]; contingency: string };
/** A checklist: each group's items, as written (people can edit, add and remove them) and ticked. */
export type ChecklistItem = { id: string; text: string; done: boolean };
export type ChecklistValue = { checklist: ChecklistItem[][] };
export type SectionValue = FieldsValue | TableRow[] | string | BudgetValue | ChecklistValue;

export const ENGINE_TYPES: ReadonlySet<SectionType> = new Set(['fields', 'text', 'letter', 'table', 'budget', 'checklist', 'categories', 'metrics']);

/** Templates whose controls have been reviewed with Ika join here (build step 7 and T5). */
const READY = new Set([
  'D07', 'D03', 'D06', 'D08', 'D13', 'D14', 'D10', 'D04', 'D01', 'D02',
  // The creator templates (Ika, 2026-10-30).
  'D15', 'D16', 'D17', 'D18', 'D19', 'D20', 'D21', 'D26', 'D27', 'D28', 'D29', 'D30', 'D31',
  // Checklists and breakdown categories (Ika, 2026-10-30).
  'D05', 'D22', 'D23',
  'D11', 'D24', 'D25',
]);

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
    case 'refs':
      return [];
    case 'timeRange':
      return { start: '', end: '' };
    case 'weather':
      return { condition: '', high: '', unit: 'F' };
    default:
      return '';
  }
}

/** A saved answer if it has the field's shape, otherwise a blank one. */
function restoreField(field: FieldSpec, saved: unknown): FieldValue {
  const blank = blankField(field);
  if (Array.isArray(blank)) {
    if (!Array.isArray(saved)) return blank;
    return fieldKind(field) === 'refs' ? saved.filter((id) => typeof id === 'string') : saved.filter((p) => typeof p?.name === 'string' && p.name.trim());
  }
  if (typeof blank === 'string') return typeof saved === 'string' ? saved : blank;
  if (typeof blank === 'boolean') return typeof saved === 'boolean' ? saved : blank;
  return saved && typeof saved === 'object' ? ({ ...blank, ...saved } as FieldValue) : blank;
}

/** The answer as words: what the downloads print and what fills a letter. */
type FormatOptions = {
  datesOnly?: boolean;
  currency?: string;
  /** For refs: a row id → its number in the source table ("01"), or null if the row is gone. */
  ref?: (id: string) => string | null;
};

export function formatField(field: FieldSpec, value: FieldValue | undefined, { datesOnly = false, currency = 'USD', ref }: FormatOptions = {}): string {
  if (value === undefined) return '';
  switch (fieldKind(field)) {
    case 'time':
      return typeof value === 'string' ? formatClock(value) : '';
    case 'timeRange':
      return formatTimeRange(value as TimeRange);
    case 'weather':
      return formatWeather(value as Weather);
    case 'pages':
      return formatPages(toAmount(value));
    case 'refs':
      return Array.isArray(value) ? (value as string[]).map((id) => ref?.(id) ?? null).filter(Boolean).join(', ') : '';
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
      return Array.isArray(value) ? (value as PersonRef[]).map((p) => p.name).join(', ') : '';
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

/** Rows of another table to tick (refs), labelled by their number and first answer: "01 Elena Vasquez". */
export function refRows(schema: TemplateSchema, data: SectionValue[], source: string) {
  const i = schema.sections.findIndex((s) => s.title === source);
  const section = schema.sections[i];
  if (section?.type !== 'table') return [];
  const rows = (Array.isArray(data[i]) ? data[i] : []) as TableRow[];
  const first = editableColumns(section)[0];
  return rows.map((row, r) => ({
    id: row.id,
    number: String(r + 1).padStart(2, '0'),
    label: first ? formatField(first, row[fieldLabel(first)]) : '',
  }));
}

/** A ref resolver for a table's refs columns, for display and downloads. */
export function refResolver(schema: TemplateSchema, data: SectionValue[], source?: string) {
  const numbers = new Map(source ? refRows(schema, data, source).map((r) => [r.id, r.number] as const) : []);
  return (id: string) => numbers.get(id) ?? null;
}

/** Choice options taken from another section's answers (Location ← Locations). */
export function optionsFromSection(schema: TemplateSchema, data: SectionValue[], title: string): string[] {
  const i = schema.sections.findIndex((s) => s.title === title);
  const section = schema.sections[i];
  if (section?.type !== 'fields') return [];
  const fields = (data[i] ?? {}) as FieldsValue;
  return [...new Set(section.fields.map((f) => formatField(f, fields[fieldLabel(f)])).filter(Boolean))];
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

// ── Budgets (Production Budget, Figma 796:9836) ──────────────────────────────────────────────
// Each group (Above the Line, Below the Line, Additional) is a table of Category, Description,
// Rate and Units with a worked-out Subtotal; the summary adds the groups, the contingency and the
// grand total. The groups reuse the table editor and downloads.

/** "Above the Line (ATL)" → "ATL"; a label without a short form stays as it is. */
export const groupShort = (label: string) => /\(([^)]+)\)/.exec(label)?.[1] ?? label;

/** A budget group as a table, so it edits, totals and downloads like any other table. */
export function budgetTable(section: BudgetSection, group: number): TableSection {
  const label = section.groups[group]?.label ?? '';
  return {
    type: 'table',
    title: label,
    columns: ['Category', 'Description', { label: 'Rate', kind: 'money' }, { label: 'Units', kind: 'number' }, 'Subtotal'],
    rows: 0,
    computed: { Subtotal: ['Rate', 'Units'] },
    money: ['Subtotal'],
    total: { column: 'Subtotal', label: `${groupShort(label)} subtotal` },
  };
}

export function blankBudget(section: BudgetSection): BudgetValue {
  return {
    groups: section.groups.map((g, gi) =>
      g.rows.map(([category, description], r) => ({ ...blankRow(budgetTable(section, gi), `g${gi + 1}-row-${r + 1}`), Category: category, Description: description })),
    ),
    contingency: String(Math.round(section.contingency * 100)),
  };
}

const asBudget = (section: BudgetSection, value: SectionValue | undefined): BudgetValue =>
  value && typeof value === 'object' && !Array.isArray(value) && Array.isArray((value as BudgetValue).groups) ? (value as BudgetValue) : blankBudget(section);

/** Each group's subtotal, their sum, the contingency on top and the grand total. */
export function budgetTotals(section: BudgetSection, value: SectionValue | undefined) {
  const budget = asBudget(section, value);
  const groups = section.groups.map((_, gi) => tableTotal(budgetTable(section, gi), budget.groups[gi] ?? []) ?? 0);
  const subtotal = groups.reduce((a, b) => a + b, 0);
  const percent = Math.max(0, toAmount(budget.contingency));
  const contingency = (subtotal * percent) / 100;
  return { groups, subtotal, percent, contingency, total: subtotal + contingency };
}

// ── Checklists (Content Production Guideline, Press Junket Brief) and categories (Script
// Breakdown): Figma 932:9008 and 840:28209. A category is a written answer per heading, stored like
// fields; a checklist keeps each group's items with whether they're done.

export const blankChecklist = (section: ChecklistSection): ChecklistValue => ({
  checklist: section.groups.map((g, gi) => g.items.map((text, i) => ({ id: `c${gi + 1}-${i + 1}`, text, done: false }))),
});

/** Key metrics (Talent Roster Report, Figma 932:11066): each one a number, stored like a field. */
export const metricFields = (section: MetricsSection): FieldSpec[] => section.items.map((label) => ({ label, kind: 'number' }));

const blankCategories = (section: CategoriesSection): FieldsValue => Object.fromEntries(section.items.map((item) => [item, '']));

export function initSection(section: Section): SectionValue {
  switch (section.type) {
    case 'budget':
      return blankBudget(section);
    case 'checklist':
      return blankChecklist(section);
    case 'categories':
      return blankCategories(section);
    case 'metrics':
      return Object.fromEntries(section.items.map((item) => [item, '']));
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
    // A checklist starts with its usual items, so it counts once one is ticked.
    case 'checklist':
      return ((value as ChecklistValue)?.checklist ?? []).some((items) => items.some((i) => i.done));
    case 'categories':
    case 'metrics':
      return section.items.some((item) => filled((value as FieldsValue)?.[item]));
    // A budget starts with its usual categories, so it counts once any line has a rate or units.
    case 'budget':
      return asBudget(section, value).groups.some((rows) => rows.some((row) => filled(row.Rate) || filled(row.Units)));
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
    if (s.type === 'checklist') {
      if (!value || typeof value !== 'object' || !Array.isArray(value.checklist)) return initSection(s);
      return {
        checklist: s.groups.map((_, gi) =>
          (Array.isArray(value.checklist[gi]) ? value.checklist[gi] : [])
            .filter((i: unknown): i is ChecklistItem => !!i && typeof (i as ChecklistItem).text === 'string')
            .map((i: ChecklistItem, n: number) => ({ id: typeof i.id === 'string' ? i.id : `c${gi + 1}-${n + 1}`, text: i.text, done: i.done === true })),
        ),
      };
    }
    if (s.type === 'categories' || s.type === 'metrics') {
      const old = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
      return Object.fromEntries(s.items.map((item) => [item, typeof old[item] === 'string' ? old[item] : '']));
    }
    if (s.type === 'budget') {
      if (!value || typeof value !== 'object' || !Array.isArray(value.groups)) return initSection(s);
      return {
        groups: s.groups.map((_, gi) => {
          const rows = Array.isArray(value.groups[gi]) ? value.groups[gi] : [];
          const table = budgetTable(s, gi);
          return rows.map((row: Record<string, unknown>, r: number) => ({
            id: typeof row?.id === 'string' ? row.id : `g${gi + 1}-row-${r + 1}`,
            ...Object.fromEntries(editableColumns(table).map((c) => [fieldLabel(c), restoreField(c, row?.[fieldLabel(c)])])),
          }));
        }),
        contingency: typeof value.contingency === 'string' ? value.contingency : String(Math.round(s.contingency * 100)),
      };
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
