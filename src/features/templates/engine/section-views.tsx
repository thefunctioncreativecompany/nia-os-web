'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Section } from '../types';
import { FieldControl } from './field-controls';
import { BudgetView } from './budget-view';
import { ChecklistView } from './checklist-view';
import { fieldLabel, metricFields, type BudgetValue, type ChecklistValue, type FieldsValue, type SectionValue, type TableRow } from './sections';
import { TableView } from './table-view';

// One editor per section type (TEMPLATE_ENGINE.md §4). Step 1: fields, text and letter, from
// the Filming Notice editor in Figma (840:29449): label beside value (each field's own control,
// field-controls.tsx), and the letter in a grey box, shown with its placeholders filled. When
// printing, inputs lose their hover and box so only the words show.

type Props = { section: Section; value: SectionValue; onChange: (value: SectionValue, key: string) => void; currency?: string };

const box =
  'rounded-xl border-border bg-nia-panel p-6 text-sm leading-normal text-foreground md:text-sm print:border-0 print:bg-transparent print:p-0';

export function SectionView({ section, value, onChange, currency }: Props) {
  switch (section.type) {
    case 'fields': {
      const fields = value as FieldsValue;
      // Cards (Call Sheet Locations, Figma 840:27971): each answer in a small box with its label.
      if (section.layout === 'cards')
        return (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {section.fields.map((field) => {
              const label = fieldLabel(field);
              const id = `${section.title}-${label}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
              return (
                <div key={label} className="flex min-w-0 flex-col gap-1 rounded-xl border border-border p-3 print:break-inside-avoid">
                  <label htmlFor={id} className="px-1.5 text-caption font-bold text-muted-foreground">
                    {label}
                  </label>
                  <FieldControl id={id} field={field} value={fields[label]} onChange={(next) => onChange({ ...fields, [label]: next }, label)} currency={currency} />
                </div>
              );
            })}
          </div>
        );
      return (
        <div className="flex flex-col gap-0.5">
          {section.fields.map((field) => {
            const label = fieldLabel(field);
            const id = `${section.title}-${label}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            return (
              <div key={label} className="flex flex-col gap-0.5 py-0.5 sm:flex-row sm:items-center sm:gap-4">
                <label htmlFor={id} className="w-45 shrink-0 text-sm leading-[1.4] font-bold text-muted-foreground">
                  {label}
                </label>
                <FieldControl id={id} field={field} value={fields[label]} onChange={(next) => onChange({ ...fields, [label]: next }, label)} currency={currency} />
              </div>
            );
          })}
        </div>
      );
    }
    case 'table':
      return <TableView section={section} rows={value as TableRow[]} onChange={(rows, key) => onChange(rows, key)} currency={currency} />;
    case 'checklist':
      return <ChecklistView section={section} value={value as ChecklistValue} onChange={(next, key) => onChange(next, key)} />;
    // Script Breakdown's categories (Figma 840:28209): a written answer per heading, each in a box
    // with a stripe down its side, in sentence case.
    case 'categories': {
      const answers = value as FieldsValue;
      return (
        <div className="flex flex-col gap-2.5">
          {section.items.map((item) => {
            const id = `${section.title}-${item}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            return (
              <div key={item} className="flex flex-col gap-1 rounded-xl border border-l-4 border-border border-l-foreground/70 bg-nia-panel px-4 py-3 print:break-inside-avoid">
                <label htmlFor={id} className="text-caption font-bold text-muted-foreground">
                  {item}
                </label>
                <Textarea
                  id={id}
                  rows={1}
                  value={(answers?.[item] as string) ?? ''}
                  placeholder="—"
                  onChange={(e) => onChange({ ...answers, [item]: e.target.value }, item)}
                  className="min-h-0 resize-none border-0 bg-transparent p-0 text-sm leading-normal shadow-none placeholder:text-nia-placeholder focus-visible:ring-0 md:text-sm field-sizing-content"
                />
              </div>
            );
          })}
        </div>
      );
    }
    // Key metrics: each number in its own card, side by side on wide screens.
    case 'metrics': {
      const answers = value as FieldsValue;
      return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {metricFields(section).map((field) => {
            const label = fieldLabel(field);
            const id = `${section.title}-${label}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            return (
              <div key={label} className="flex min-w-0 flex-col gap-1.5 rounded-xl border border-border p-4 print:break-inside-avoid">
                <label htmlFor={id} className="text-caption font-bold text-muted-foreground">
                  {label}
                </label>
                {/* Big numbers (reach runs to millions), so a wide box in large type, digits only. */}
                <Input
                  id={id}
                  inputMode="numeric"
                  value={(answers?.[label] as string) ?? ''}
                  placeholder="—"
                  onChange={(e) => onChange({ ...answers, [label]: e.target.value.replace(/[^0-9]/g, '') }, label)}
                  className="h-auto border-0 bg-transparent px-0 py-0 text-h3 font-bold shadow-none tabular-nums placeholder:text-nia-placeholder focus-visible:ring-0 md:text-h3"
                />
              </div>
            );
          })}
        </div>
      );
    }
    case 'budget':
      return <BudgetView section={section} value={value as BudgetValue} onChange={(next, key) => onChange(next, key)} currency={currency} />;
    case 'letter':
      return (
        <Textarea
          aria-label={section.title}
          value={value as string}
          onChange={(e) => onChange(e.target.value, 'letter')}
          className={`min-h-80 print:min-h-0 ${box}`}
        />
      );
    case 'text':
      return (
        <Textarea
          aria-label={section.title}
          value={value as string}
          placeholder={section.placeholder}
          onChange={(e) => onChange(e.target.value, 'text')}
          className={`min-h-32 ${box} placeholder:text-nia-placeholder`}
        />
      );
    default:
      return null;
  }
}
