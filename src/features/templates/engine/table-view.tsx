'use client';

import type { CSSProperties } from 'react';
import { Plus, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { FieldSpec, TableSection } from '../types';
import { FieldControl } from './field-controls';
import { blankRow, editableColumns, fieldKind, fieldLabel, type FieldValue, type TableRow } from './sections';

// A table section (TEMPLATE_ENGINE.md §4, build step 7 part 2): a typed control in every cell
// (T5), an automatic number column where the template has one, add and remove rows. Wide
// screens get a table; phones get one card per row with the column names beside the answers.

// How much room each kind of column needs, so pickers never squash.
function width(field: FieldSpec, tall: boolean) {
  switch (fieldKind(field)) {
    case 'check':
      return '3.5rem';
    case 'number':
      return '6rem';
    case 'date':
      return '8.25rem';
    case 'duration':
      return '9.5rem';
    case 'choice':
      return 'minmax(6.5rem, 0.8fr)';
    case 'role':
      return 'minmax(9rem, 1fr)';
    case 'email':
      return 'minmax(10rem, 1.2fr)';
    default:
      return tall ? 'minmax(12rem, 2fr)' : 'minmax(6rem, 1fr)';
  }
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');

export function TableView({ section, rows, onChange }: { section: TableSection; rows: TableRow[]; onChange: (rows: TableRow[], key: string) => void }) {
  const columns = editableColumns(section);
  const numbered = !!section.autonumber;
  const tall = !!section.tall;
  const template = [numbered ? '4rem' : null, ...columns.map((c) => width(c, tall)), '2.25rem'].filter(Boolean).join(' ');
  const base = slug(section.title);

  const setCell = (rowId: string, label: string, value: FieldValue) =>
    onChange(rows.map((r) => (r.id === rowId ? { ...r, [label]: value } : r)), `${rowId}:${label}`);
  // Structural changes are always their own Undo step.
  const addRow = () => onChange([...rows, blankRow(section)], `add-${crypto.randomUUID()}`);
  const removeRow = (rowId: string) => onChange(rows.filter((r) => r.id !== rowId), `remove-${rowId}`);

  // A date column with `after` can't be earlier than that column's date in the same row.
  const minDayFor = (field: FieldSpec, row: TableRow) => {
    const after = typeof field === 'string' ? undefined : field.after;
    const day = after ? row[after] : undefined;
    return typeof day === 'string' && day ? day : undefined;
  };

  return (
    <div className="flex flex-col gap-3">
      <div role="table" aria-label={section.title} className="flex flex-col gap-3 md:gap-0 md:overflow-x-auto md:rounded-xl md:border md:border-border print:overflow-visible">
        <div role="rowgroup" className="hidden md:block">
          <div role="row" className="grid min-w-fit border-b border-border bg-nia-panel" style={{ gridTemplateColumns: template } as CSSProperties}>
            {numbered && (
              <span role="columnheader" className="px-3 py-2 text-small font-bold whitespace-nowrap text-muted-foreground">
                {section.autonumber}
              </span>
            )}
            {columns.map((c) => (
              <span key={fieldLabel(c)} role="columnheader" className="truncate px-2 py-2 text-small font-bold text-muted-foreground">
                {fieldLabel(c)}
              </span>
            ))}
            <span role="columnheader" className="sr-only">
              Remove
            </span>
          </div>
        </div>
        <div role="rowgroup" className="flex flex-col gap-3 md:gap-0">
          {rows.map((row, r) => {
            const number = String(r + 1).padStart(2, '0');
            return (
              <div
                key={row.id}
                role="row"
                className="relative flex flex-col gap-1 rounded-xl border border-border p-3 md:grid md:min-w-fit md:gap-0 md:rounded-none md:border-0 md:border-b md:p-0 md:last:border-b-0 print:break-inside-avoid"
                style={{ gridTemplateColumns: template } as CSSProperties}
              >
                {numbered && (
                  <span role="cell" className="text-small font-bold text-muted-foreground tabular-nums md:px-3 md:py-2.5">
                    <span className="md:hidden">{section.autonumber} </span>
                    {number}
                  </span>
                )}
                {columns.map((c) => {
                  const label = fieldLabel(c);
                  const id = `${base}-${r + 1}-${slug(label)}`;
                  return (
                    <div key={label} role="cell" className="flex min-w-0 items-center gap-2 md:px-1 md:py-1">
                      <label htmlFor={id} className="w-28 shrink-0 text-small font-bold text-muted-foreground md:sr-only">
                        {label}
                      </label>
                      <div className="min-w-0 flex-1">
                        <FieldControl
                          id={id}
                          field={c}
                          value={row[label]}
                          onChange={(next) => setCell(row.id, label, next)}
                          compact
                          tall={tall}
                          minDay={fieldKind(c) === 'date' ? minDayFor(c, row) : undefined}
                        />
                      </div>
                    </div>
                  );
                })}
                <div role="cell" className="absolute top-2 right-2 md:static md:flex md:items-center md:justify-center print:hidden">
                  <button
                    type="button"
                    aria-label={`Remove row ${number}`}
                    onClick={() => removeRow(row.id)}
                    className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted/70 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <X aria-hidden className="size-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {rows.length === 0 && section.empty && <p className="text-small text-muted-foreground">{section.empty}</p>}
      <Button type="button" variant="outline" size="sm" onClick={addRow} className="w-fit print:hidden">
        <Plus aria-hidden /> Add row
      </Button>
    </div>
  );
}
