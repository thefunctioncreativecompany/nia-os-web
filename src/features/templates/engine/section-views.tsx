'use client';

import { Textarea } from '@/components/ui/textarea';
import type { Section } from '../types';
import { FieldControl } from './field-controls';
import { fieldLabel, type FieldsValue, type SectionValue } from './sections';

// One editor per section type (TEMPLATE_ENGINE.md §4). Step 1: fields, text and letter, from
// the Filming Notice editor in Figma (840:29449): label beside value (each field's own control,
// field-controls.tsx), and the letter in a grey box, shown with its placeholders filled. When
// printing, inputs lose their hover and box so only the words show.

type Props = { section: Section; value: SectionValue; onChange: (value: SectionValue, key: string) => void };

const box =
  'rounded-xl border-border bg-nia-panel p-6 text-sm leading-normal text-foreground md:text-sm print:border-0 print:bg-transparent print:p-0';

export function SectionView({ section, value, onChange }: Props) {
  switch (section.type) {
    case 'fields': {
      const fields = value as FieldsValue;
      return (
        <div className="flex flex-col gap-0.5">
          {section.fields.map((field) => {
            const label = fieldLabel(field);
            const id = `${section.title}-${label}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            return (
              <div key={label} className="flex flex-col gap-0.5 py-0.5 sm:flex-row sm:items-center sm:gap-4">
                <label htmlFor={id} className="w-45 shrink-0 text-sm leading-[1.4] font-bold text-muted-foreground">
                  {label}
                </label>
                <FieldControl id={id} field={field} value={fields[label]} onChange={(next) => onChange({ ...fields, [label]: next }, label)} />
              </div>
            );
          })}
        </div>
      );
    }
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
