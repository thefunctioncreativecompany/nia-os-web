/**
 * Types for the Templates feature. Shapes match src/data/templates.manifest.json
 * and src/data/template-schemas.json.
 */
export type TemplateStatus = 'live' | 'designed' | 'gap';
export type TemplateKind = 'workflow' | 'document';
export type Stage = 'Pre-production' | 'Production' | 'Post-production';

export interface TemplateDetails {
  about: string[];
  howTo: string[];
  faq: { q: string; a: string }[];
}

export interface TemplateEntry {
  code: string;            // 'T01', 'D01', 'G01'…
  sku: string;             // product code shown in the Index view, e.g. 'CS-01'
  slug: string;
  name: string;
  kind: TemplateKind;
  family: string;          // palette family (colour is on hold; kept for later)
  variant: 'a' | 'b' | 'c';
  stage: Stage;
  label: string;           // 'New template' | 'Updated template' | 'In design'
  status: TemplateStatus;
  icps: string[];          // roles the template is made for
  object: string;
  alt: string | null;
  preview: string | null;  // one-line description
  keywords: string[];
  icon: string;            // GLYPHS key
  group: string | null;    // Figma group, e.g. 'Production Management & Operations'
  tags: string[];          // 'Administrative' | 'Camera & Visual'
  related: string[];       // 3 template codes for the preview modal
  details: TemplateDetails;
  schema?: string;         // matches a template-schemas.json code (documents)
  figma?: Record<string, string>;
}

export interface Manifest {
  version: number;
  templates: TemplateEntry[];
  families: Record<string, { name: string; light: string; core: string; deep: string }>;
  familyLabels: Record<string, string>;
  groups: string[];
  tags: string[];
}

/* ── Document templates (engine) ── */
export type SectionType = 'fields' | 'table' | 'text' | 'letter' | 'categories' | 'frames' | 'checklist' | 'cards' | 'budget' | 'metrics';

interface SectionBase { type: SectionType; title: string; optional?: boolean; hint?: string }
/** A field's or column's control (T5): plain text unless the answer has a shape, so it can be
 *  picked rather than typed. `units` for durations; `after` names a date it can't be before. */
export type FieldKind = 'text' | 'choice' | 'role' | 'people' | 'number' | 'money' | 'date' | 'dateTimeRange' | 'duration' | 'yesNo' | 'check' | 'phone' | 'email';
export type DurationUnit = 'seconds' | 'minutes' | 'hours' | 'days';
/** People fields: `single` holds one person; `fills` names columns a picked Nia user fills when blank (e.g. Position ← their role). */
export type FieldSpec =
  | string
  | { label: string; kind: FieldKind; options?: string[]; placeholder?: string; units?: DurationUnit[]; after?: string; single?: boolean; fills?: Record<string, 'role'> };
export interface FieldsSection extends SectionBase { type: 'fields'; fields: FieldSpec[] }
export interface TableSection extends SectionBase {
  type: 'table'; columns: FieldSpec[]; rows: number; empty?: string; autonumber?: string; tall?: boolean;
  computed?: Record<string, [string, string]>; money?: string[]; checkbox?: string[]; total?: { column: string; label: string };
}
export interface TextSection extends SectionBase { type: 'text'; placeholder: string }
/** `fills`: [placeholder] → the field label whose answer replaces it. */
export interface LetterSection extends SectionBase { type: 'letter'; default: string; fills?: Record<string, string> }
export interface CategoriesSection extends SectionBase { type: 'categories'; items: string[] }
export interface FramesSection extends SectionBase { type: 'frames'; count: number; aspect: string; placeholder: string }
export interface ChecklistSection extends SectionBase { type: 'checklist'; groups: { label: string; items: string[] }[] }
export interface CardsSection extends SectionBase { type: 'cards'; count: number; nameLabel: string; statuses: string[]; descPlaceholder: string; fields: string[] }
export interface BudgetSection extends SectionBase { type: 'budget'; contingency: number; groups: { label: string; rows: [string, string][] }[] }
export interface MetricsSection extends SectionBase { type: 'metrics'; items: string[] }
export type Section = FieldsSection | TableSection | TextSection | LetterSection | CategoriesSection | FramesSection | ChecklistSection | CardsSection | BudgetSection | MetricsSection;

export interface TemplateSchema {
  code: string; name: string; group: string; description: string; contents: string[];
  builder: boolean; actions: string[]; version: string; sections: Section[];
  figma: Record<string, string>;
}

/* ── Personalisation ── */
export type TemplateEventType = 'view' | 'use' | 'complete' | 'search';
export interface TemplateEvent { code: string; type: TemplateEventType; at: number }   // at = epoch ms
export interface UserTemplateProfile { role: string | null; events: TemplateEvent[] }
/** The fields suggestions read, so the gallery can rank a slimmed-down list. */
export type SuggestableTemplate = Pick<TemplateEntry, 'code' | 'name' | 'related' | 'icps' | 'group' | 'stage' | 'status'>;
export interface Suggestion<T extends SuggestableTemplate = TemplateEntry> { template: T; score: number; why: string }
/** The fields search reads, so the gallery can search a slimmed-down list. */
export type SearchableTemplate = Pick<TemplateEntry, 'name' | 'keywords' | 'icps' | 'stage' | 'family' | 'preview' | 'object' | 'status'>;
export interface SearchResult<T extends SearchableTemplate = TemplateEntry> { template: T; score: number; matched: string[]; of: number }
