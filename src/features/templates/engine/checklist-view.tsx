'use client';

import { Plus, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { ChecklistSection } from '../types';
import type { ChecklistItem, ChecklistValue } from './sections';

// A checklist (Content Production Guideline's Daily Checklist, Figma 932:9008): each group under
// its label, every item a tick box beside its words. Items can be reworded, added and removed,
// since every production's checklist is a little different. Ticked items read as done.

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function ChecklistView({ section, value, onChange }: { section: ChecklistSection; value: ChecklistValue; onChange: (value: ChecklistValue, key: string) => void }) {
  const groups = value?.checklist ?? [];
  const setGroup = (gi: number, items: ChecklistItem[], key: string) => onChange({ checklist: section.groups.map((_, i) => (i === gi ? items : groups[i] ?? [])) }, key);

  return (
    <div className="flex flex-col gap-5">
      {section.groups.map((group, gi) => {
        const items = groups[gi] ?? [];
        const base = `${slug(section.title)}-${slug(group.label)}`;
        return (
          <fieldset key={group.label} className="flex flex-col gap-1.5">
            <legend className="mb-1.5 text-sm leading-[1.4] font-bold text-muted-foreground">{group.label}</legend>
            {items.map((item, i) => (
              <div key={item.id} className="group flex items-center gap-3">
                <Checkbox
                  id={`${base}-${i + 1}`}
                  aria-label={item.text || `Item ${i + 1}`}
                  checked={item.done}
                  onCheckedChange={(on) => setGroup(gi, items.map((x) => (x.id === item.id ? { ...x, done: on === true } : x)), `${item.id}:done`)}
                />
                <input
                  aria-label={`${group.label}, item ${i + 1}`}
                  value={item.text}
                  placeholder="Add a step"
                  onChange={(e) => setGroup(gi, items.map((x) => (x.id === item.id ? { ...x, text: e.target.value } : x)), `${item.id}:text`)}
                  className={cn(
                    'min-w-0 flex-1 rounded-md bg-transparent px-1.5 py-1 text-sm leading-normal outline-none placeholder:text-nia-placeholder hover:bg-muted/70 focus-visible:ring-3 focus-visible:ring-ring/50',
                    item.done ? 'text-foreground' : 'text-foreground/80',
                  )}
                />
                <button
                  type="button"
                  aria-label={`Remove ${item.text || `item ${i + 1}`}`}
                  onClick={() => setGroup(gi, items.filter((x) => x.id !== item.id), `remove-${item.id}`)}
                  className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted/70 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 print:hidden"
                >
                  <X aria-hidden className="size-3.5" />
                </button>
              </div>
            ))}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setGroup(gi, [...items, { id: crypto.randomUUID(), text: '', done: false }], `add-${crypto.randomUUID()}`)}
              className="w-fit text-muted-foreground print:hidden"
            >
              <Plus aria-hidden /> Add to {group.label.toLowerCase()}
            </Button>
          </fieldset>
        );
      })}
    </div>
  );
}
