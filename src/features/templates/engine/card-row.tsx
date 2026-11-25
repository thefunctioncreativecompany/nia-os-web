'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { ScrollRow } from '@/components/nia/scroll-row';
import { CARD_TOOLS, CardButton, DragHandle, MoveButtons, useDragReorder } from '@/components/nia/drag-reorder';
import { POSTER, POSTER_ARROWS, POSTER_CARD, posterSpan } from '@/components/nia/poster-cards';
import type { FieldSpec, TableSection } from '../types';
import { FieldControl } from './field-controls';
import { PictureCell, usePictures } from './pictures';
import { fieldKind, fieldLabel, type FieldValue, type TableRow } from './sections';

// A table as cards in a row that scrolls (Ika, 2026-11-15: "portrait size cards (similar to what's
// on explore), with summary detail of the shot below, editable, and reorderable. Horizontal
// images stay full size with height of portrait image … the general case even for other
// templates that include adding reference like media assets"). Every table with a picture column
// shows this way. Each card: the picture at Explore's poster shape, or a landscape picture whole
// at the same height (its card is wider), then the row's answers to edit in place. Drag a card
// by its handle to move it, or use Move earlier / later. Every row is in it (a document, not a
// browse row); printing lays the cards out in rows; downloads stay a table.


/** "Shot #" → "Shot"; the word for one row ("shot", "look"). */
export const itemName = (section: TableSection) => (section.autonumber ? section.autonumber.replace(/\s*#\s*$/, '').trim() : '') || 'Item';

type Props = {
  section: TableSection;
  rows: TableRow[];
  columns: FieldSpec[];
  base: string;
  currency: string;
  setCell: (rowId: string, label: string, value: FieldValue) => void;
  addRow: () => void;
  removeRow: (rowId: string) => void;
  moveRow: (from: number, to: number) => void;
};

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function CardRow({ section, rows, columns, base, currency, setCell, addRow, removeRow, moveRow }: Props) {
  const pictures = usePictures();
  const editable = !pictures?.readOnly;
  const noun = itemName(section);
  // Each picture's shape once it has loaded (landscape cards widen to show it whole).
  const [shapes, setShapes] = useState<Record<string, number>>({});
  const drag = useDragReorder(moveRow);
  const picture = columns.find((c) => fieldKind(c) === 'image');
  const rest = columns.filter((c) => c !== picture);

  return (
    // The arrows sit at the middle of the pictures (half a poster's height, plus the row's padding).
    <ScrollRow label={section.title} arrowTop={POSTER_ARROWS} className="items-start gap-4 print:flex-wrap print:overflow-visible">
      {rows.map((row, r) => {
        const number = String(r + 1).padStart(2, '0');
        const name = `${noun} ${number}`;
        const id = picture ? (row[fieldLabel(picture)] as string) || '' : '';
        const shape = (id && shapes[id]) || POSTER;
        return (
          <li
            key={row.id}
            aria-label={name}
            style={posterSpan(shape)}
            className={cn(POSTER_CARD, drag.state(r))}
            {...(editable ? drag.target(r) : {})}
          >
            {picture ? (
              <div className="relative w-full" style={{ aspectRatio: shape }}>
                <PictureCell
                  id={`${base}-${r + 1}-${slug(fieldLabel(picture))}`}
                  label={`${name}, ${fieldLabel(picture)}`}
                  value={id}
                  onChange={(next) => setCell(row.id, fieldLabel(picture), next)}
                  onShape={(w, h) => id && setShapes((was) => (was[id] === w / h ? was : { ...was, [id]: w / h }))}
                  fill
                />
              </div>
            ) : null}

            <div className="flex items-center gap-1">
              {editable && <DragHandle name={name} {...drag.handle(r)} />}
              <span className="min-w-0 flex-1 text-small font-bold text-foreground tabular-nums">{name}</span>
              {editable && (
                <span className={CARD_TOOLS}>
                  <MoveButtons name={name} i={r} count={rows.length} onMove={moveRow} />
                  <CardButton label={`Remove ${name}`} onClick={() => removeRow(row.id)}>
                    <X aria-hidden className="size-3.5" />
                  </CardButton>
                </span>
              )}
            </div>

            {rest.map((c) => {
              const label = fieldLabel(c);
              const id = `${base}-${r + 1}-${slug(label)}`;
              const kind = fieldKind(c);
              if (kind === 'check')
                return (
                  <label key={label} htmlFor={id} className="flex items-center gap-2 text-small font-bold text-muted-foreground">
                    <FieldControl id={id} field={c} value={row[label]} onChange={(next) => setCell(row.id, label, next)} compact currency={currency} />
                    {label}
                  </label>
                );
              return (
                <div key={label} className="flex min-w-0 flex-col gap-0.5">
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
      {editable && (
        <li className="flex w-[calc(13rem*0.6)] shrink-0 snap-start print:hidden" style={{ aspectRatio: POSTER * 0.6 }}>
          <button
            type="button"
            onClick={addRow}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-small font-semibold text-muted-foreground outline-none hover:border-foreground/40 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Plus aria-hidden className="size-5" /> Add {noun.toLowerCase()}
          </button>
        </li>
      )}
    </ScrollRow>
  );
}
