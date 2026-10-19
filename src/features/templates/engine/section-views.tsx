'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Section } from '../types';
import type { FieldsValue, SectionValue } from './sections';

// One editor per section type (TEMPLATE_ENGINE.md §4). Step 1: fields, text and letter, from
// the Filming Notice editor in Figma (840:29449): label beside value, and the letter in a grey
// box. When printing, inputs lose their hover and box so only the words show.

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
            const id = `${section.title}-${field}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            return (
              <div key={field} className="flex flex-col gap-0.5 py-0.5 sm:flex-row sm:items-center sm:gap-4">
                <label htmlFor={id} className="w-45 shrink-0 text-sm leading-[1.4] font-bold text-muted-foreground">
                  {field}
                </label>
                <Input
                  id={id}
                  value={fields[field] ?? ''}
                  placeholder="—"
                  onChange={(e) => onChange({ ...fields, [field]: e.target.value }, field)}
                  className="h-auto rounded-md border-transparent px-1.5 py-0.5 text-sm leading-normal font-medium text-foreground shadow-none hover:bg-muted/70 focus-visible:border-transparent md:text-sm placeholder:text-nia-placeholder print:px-0"
                />
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
