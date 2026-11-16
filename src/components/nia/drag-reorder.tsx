"use client";

import { useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, GripVertical } from "lucide-react";

import { cn } from "@/lib/utils";

// Moving cards in a row (Ika, 2026-11-15: reference cards "reorderable"): drag a card by its handle
// onto another, or use Move earlier / later (keyboards, and phones, where dragging isn't offered).
// The browser's own drag and drop, so no extra library loads. Used by a template's reference cards
// (card-row.tsx) and a project's References.

const TYPE = "application/x-nia-card";
const carries = (e: React.DragEvent) => [...e.dataTransfer.types].includes(TYPE);

export function useDragReorder(onMove: (from: number, to: number) => void) {
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const end = () => {
    setDragging(null);
    setOver(null);
  };
  return {
    /** Props for the handle of card `i`. */
    handle: (i: number) => ({
      draggable: true,
      onDragStart: (e: React.DragEvent) => {
        e.dataTransfer.setData(TYPE, String(i));
        e.dataTransfer.effectAllowed = "move";
        setDragging(i);
      },
      onDragEnd: end,
    }),
    /** Props for card `i`, where another can be dropped. */
    target: (i: number) => ({
      onDragOver: (e: React.DragEvent) => {
        if (dragging === null || !carries(e)) return;
        e.preventDefault();
        setOver(i);
      },
      onDragLeave: () => setOver((o) => (o === i ? null : o)),
      onDrop: (e: React.DragEvent) => {
        if (dragging === null || !carries(e)) return;
        e.preventDefault();
        e.stopPropagation();
        if (dragging !== i) onMove(dragging, i);
        end();
      },
    }),
    /** Classes for card `i`: faded while dragged, outlined while another hovers over it. */
    state: (i: number) => cn(dragging === i && "opacity-40", over === i && dragging !== null && dragging !== i && "ring-3 ring-nia-blue/60 ring-offset-4 ring-offset-background"),
  };
}

/** The grip a card is dragged by (pointer only; the Move buttons do the same by keyboard). */
export function DragHandle({ name, ...props }: { name: string } & ReturnType<ReturnType<typeof useDragReorder>["handle"]>) {
  return (
    <span
      aria-hidden
      title={`Drag to move ${name}`}
      {...props}
      className="-ml-1 inline-flex size-7 shrink-0 cursor-grab items-center justify-center rounded-full text-muted-foreground hover:bg-muted/70 hover:text-foreground active:cursor-grabbing print:hidden"
    >
      <GripVertical className="size-3.5" />
    </span>
  );
}

export function CardButton({ label, disabled, onClick, children }: { label: string; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex size-7 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted/70 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-30"
    >
      {children}
    </button>
  );
}

/** Move earlier / later for card `i` of `count`. */
export function MoveButtons({ name, i, count, onMove }: { name: string; i: number; count: number; onMove: (from: number, to: number) => void }) {
  return (
    <>
      <CardButton label={`Move ${name} earlier`} disabled={i === 0} onClick={() => onMove(i, i - 1)}>
        <ArrowLeft aria-hidden className="size-3.5" />
      </CardButton>
      <CardButton label={`Move ${name} later`} disabled={i === count - 1} onClick={() => onMove(i, i + 1)}>
        <ArrowRight aria-hidden className="size-3.5" />
      </CardButton>
    </>
  );
}

/** Shown on hover and focus with a mouse, always on touch screens. */
export const CARD_TOOLS = "flex items-center opacity-0 transition-opacity duration-fast group-focus-within/card:opacity-100 group-hover/card:opacity-100 pointer-coarse:opacity-100 print:hidden";
