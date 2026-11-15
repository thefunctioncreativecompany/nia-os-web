'use client';

import type { CSSProperties } from 'react';
import { Plus, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollRow } from '@/components/nia/scroll-row';
import type { FieldSpec, TableSection } from '../types';
import type { PersonRef } from '@/components/nia/assignees';
import { FieldControl } from './field-controls';
import { formatMoney } from './format';
import { AddFromPictures, DropHint, PictureCell, usePictureDrop } from './pictures';
import { blankRow, computeCell, editableColumns, fieldKind, fieldLabel, formatField, pictureColumn, shownColumns, tableTotal, type FieldValue, type TableRow } from './sections';

// A table section (TEMPLATE_ENGINE.md §4, build step 7 part 2): a typed control in every cell
// (T5), an automatic number column where the template has one, add and remove rows. Wide
// screens get a table; phones get one card per row with the column names beside the answers.
// Detail columns show only with More detail on (their answers are kept). A table with a picture
// column (a shot list's Reference) takes pictures: Add from pictures, or drop them on it, and
// each becomes a shot. A `carousel` table (shot lists, Ika 2026-11-15) shows each row as a card
// in a row that scrolls: the picture large, then the answers; every shot is in it (a document,
// not a browse row), and printing lays the cards out in rows.

// How much room each kind of column needs, so pickers never squash.
function width(field: FieldSpec, tall: boolean) {
  switch (fieldKind(field)) {
    case 'check':
      return '3.5rem';
    case 'image':
      return '7rem';
    case 'number':
      return '6rem';
    case 'money':
      return '8.5rem';
    case 'time':
      return '5.5rem';
    case 'pages':
      return '9rem';
    case 'refs':
      return '6.5rem';
    case 'date':
      return '8.25rem';
    case 'duration':
      return '9.5rem';
    case 'choice':
      return 'minmax(6.5rem, 0.8fr)';
    case 'role':
      return 'minmax(9rem, 1fr)';
    case 'people':
      return 'minmax(8.5rem, 1.2fr)';
    case 'email':
      return 'minmax(10rem, 1.2fr)';
    default:
      return tall ? 'minmax(12rem, 2fr)' : 'minmax(6rem, 1fr)';
  }
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function TableView({ section, rows, onChange, currency = 'USD', detail = true }: { section: TableSection; rows: TableRow[]; onChange: (rows: TableRow[], key: string) => void; currency?: string; detail?: boolean }) {
  const columns = shownColumns(section, detail);
  // Pictures fill the empty rows first (a new shot list starts with some), then add rows.
  const picture = pictureColumn(section);
  const addPictures = (ids: string[]) => {
    if (!picture) return;
    const at = fieldLabel(picture);
    const empty = (r: TableRow) => editableColumns(section).every((c) => !formatField(c, r[fieldLabel(c)]).trim());
    const queue = [...ids];
    const next = rows.map((r) => (queue.length && empty(r) ? { ...r, [at]: queue.shift()! } : r));
    onChange([...next, ...queue.map((id) => ({ ...blankRow(section), [at]: id }))], `pictures-${crypto.randomUUID()}`);
  };
  const drop = usePictureDrop(addPictures);
  // Worked-out columns (Extended = Rate × QTY) show their sum and can't be typed over.
  const computed = Object.keys(section.computed ?? {});
  const money = (column: string) => section.money?.includes(column);
  const numbered = !!section.autonumber;
  const tall = !!section.tall;
  const template = [numbered ? '3.5rem' : null, ...columns.map((c) => width(c, tall)), ...computed.map(() => '8.5rem'), '2.25rem'].filter(Boolean).join(' ');
  const total = tableTotal(section, rows);
  const show = (column: string, amount: number) => {
    if (money(column)) return formatMoney(amount, currency);
    const spec = section.columns.find((c) => fieldLabel(c) === column);
    return spec ? formatField(spec, String(amount)) || '0' : String(amount);
  };
  const base = slug(section.title);

  // Picking a Nia user in a people column fills the columns it names when they're still blank
  // (Crew Contact List: Position ← their role).
  const setCell = (rowId: string, label: string, value: FieldValue) => {
    const spec = columns.find((c) => fieldLabel(c) === label);
    const fills = typeof spec === 'object' ? spec.fills : undefined;
    const person = Array.isArray(value) && typeof value[0] === 'object' ? (value[0] as PersonRef) : undefined;
    onChange(
      rows.map((r) => {
        if (r.id !== rowId) return r;
        const next: TableRow = { ...r, [label]: value };
        for (const [column, from] of Object.entries(fills ?? {})) if (person?.[from] && !r[column]) next[column] = person[from]!;
        return next;
      }),
      `${rowId}:${label}`,
    );
  };
  // Structural changes are always their own Undo step.
  const addRow = () => onChange([...rows, blankRow(section)], `add-${crypto.randomUUID()}`);
  const removeRow = (rowId: string) => onChange(rows.filter((r) => r.id !== rowId), `remove-${rowId}`);

  // A date column with `after` can't be earlier than that column's date in the same row.
  const minDayFor = (field: FieldSpec, row: TableRow) => {
    const after = typeof field === 'string' ? undefined : field.after;
    const day = after ? row[after] : undefined;
    return typeof day === 'string' && day ? day : undefined;
  };

  if (section.layout === 'carousel') {
    return (
      <div className="relative flex flex-col gap-3" {...(picture ? drop.handlers : {})}>
        {picture && <DropHint over={drop.over} />}
        <ScrollRow label={section.title} className="items-stretch print:flex-wrap print:overflow-visible">
          {rows.map((row, r) => {
            const number = String(r + 1).padStart(2, '0');
            const name = section.autonumber ? `${section.autonumber.replace(/\s*#$/, '')} ${number}` : number;
            return (
              <li key={row.id} aria-label={name} className="flex w-72 shrink-0 snap-start flex-col gap-3 rounded-xl border border-border bg-card p-3 print:break-inside-avoid">
                <div className="flex items-center justify-between">
                  <span className="text-small font-bold text-muted-foreground tabular-nums">{name}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${name}`}
                    onClick={() => removeRow(row.id)}
                    className="inline-flex size-7 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted/70 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 print:hidden"
                  >
                    <X aria-hidden className="size-3.5" />
                  </button>
                </div>
                {columns.map((c) => {
                  const label = fieldLabel(c);
                  const id = `${base}-${r + 1}-${slug(label)}`;
                  const kind = fieldKind(c);
                  if (kind === 'image') return <PictureCell key={label} id={id} label={`${name}, ${label}`} value={(row[label] as string) ?? ''} onChange={(next) => setCell(row.id, label, next)} large />;
                  if (kind === 'check')
                    return (
                      <label key={label} htmlFor={id} className="mt-auto flex items-center gap-2 text-small font-bold text-muted-foreground">
                        <FieldControl id={id} field={c} value={row[label]} onChange={(next) => setCell(row.id, label, next)} compact currency={currency} />
                        {label}
                      </label>
                    );
                  return (
                    <div key={label} className="flex min-w-0 flex-col gap-1">
                      <label htmlFor={id} className="text-caption font-bold text-muted-foreground">
                        {label}
                      </label>
                      <FieldControl id={id} field={c} value={row[label]} onChange={(next) => setCell(row.id, label, next)} compact tall={kind === 'text'} currency={currency} />
                    </div>
                  );
                })}
              </li>
            );
          })}
          <li className="flex w-40 shrink-0 snap-start print:hidden">
            <button
              type="button"
              onClick={addRow}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-small font-semibold text-muted-foreground outline-none hover:border-foreground/40 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <Plus aria-hidden className="size-5" /> Add shot
            </button>
          </li>
        </ScrollRow>
        {picture && <AddFromPictures onAdd={addPictures} />}
      </div>
    );
  }

  return (
    <div className="relative flex flex-col gap-3" {...(picture ? drop.handlers : {})}>
      {picture && <DropHint over={drop.over} />}
      <div role="table" aria-label={section.title} className="flex flex-col gap-3 md:gap-0 md:overflow-x-auto md:rounded-xl md:border md:border-border print:overflow-visible">
        <div role="rowgroup" className="hidden md:block">
          <div role="row" className="grid min-w-fit border-b border-border bg-nia-panel" style={{ gridTemplateColumns: template } as CSSProperties}>
            {numbered && (
              <span role="columnheader" className="px-2 py-2 text-small font-bold whitespace-nowrap text-muted-foreground">
                {section.autonumber}
              </span>
            )}
            {columns.map((c) => (
              <span key={fieldLabel(c)} role="columnheader" className={cn("truncate px-2 py-2 text-small font-bold text-muted-foreground", ['money', 'number'].includes(fieldKind(c)) && 'text-right')}>
                {fieldLabel(c)}
              </span>
            ))}
            {computed.map((column) => (
              <span key={column} role="columnheader" className="truncate px-3 py-2 text-right text-small font-bold text-muted-foreground">
                {column}
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
                          currency={currency}
                        />
                      </div>
                    </div>
                  );
                })}
                {computed.map((column) => {
                  const amount = computeCell(section, row, column);
                  return (
                    <div key={column} role="cell" className="flex items-center gap-2 md:justify-end md:px-3 md:py-1">
                      <span className="w-28 shrink-0 text-small font-bold text-muted-foreground md:hidden">{column}</span>
                      <output aria-label={`${column}, row ${number}`} className={cn('text-sm font-medium tabular-nums', amount === null ? 'text-nia-placeholder' : 'text-foreground')}>
                        {amount === null ? '—' : show(column, amount)}
                      </output>
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
        {section.total && total !== null && (
          <div role="rowgroup" className="flex items-center justify-end gap-6 rounded-xl border border-border px-3 py-3 md:rounded-none md:border-0 md:border-t md:bg-nia-panel">
            <span className="text-small font-bold text-muted-foreground">{section.total.label}</span>
            <output aria-label={section.total.label} className="text-lead font-bold text-foreground tabular-nums">
              {show(section.total.column, total)}
            </output>
          </div>
        )}
      </div>
      {rows.length === 0 && section.empty && <p className="text-small text-muted-foreground">{section.empty}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={addRow} className="w-fit print:hidden">
          <Plus aria-hidden /> Add row
        </Button>
        {picture && <AddFromPictures onAdd={addPictures} />}
      </div>
    </div>
  );
}
