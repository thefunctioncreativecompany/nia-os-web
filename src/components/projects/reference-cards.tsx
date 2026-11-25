"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { ScrollRow } from "@/components/nia/scroll-row";
import { CARD_TOOLS, DragHandle, MoveButtons, useDragReorder } from "@/components/nia/drag-reorder";
import { POSTER, POSTER_ARROWS, POSTER_CARD, posterSpan } from "@/components/nia/poster-cards";
import type { LinkedPicture } from "@/components/projects/use-linked-references";

// The project Overview's references (Ika, 2026-11-15: "same with references section on overview",
// as a template's reference cards): the reference pictures as cards in a row that scrolls, portrait
// at Explore's poster shape, a landscape picture whole at the same height. Under each, its name and
// a note to write in; drag a card or use Move earlier / later. The order and notes are saved on the
// files (`project_files.position`, `note`; 20261118000000_project_references_arrange.sql: until
// it's run, notes don't save). Opening a picture goes to the References tab. The references the
// project links to (Explore titles, Instagram posts; Ika, 2026-11-19) come first, arranged and
// noted on the References tab.

/** `notes`: whether notes can be kept yet (their migration has run). */
export type ReferencePicture = { id: string; name: string; url: string; note: string | null; notes?: boolean };

export function ReferenceCards({ pictures, linked = [], canEdit, onOpen }: { pictures: ReferencePicture[]; linked?: LinkedPicture[]; canEdit: boolean; /** Opens an uploaded picture in References' viewer. */ onOpen: (id: string) => void }) {
  const [order, setOrder] = useState(pictures);
  const [shapes, setShapes] = useState<Record<string, number>>({});
  // A new list from the server (an upload, a refresh) replaces the local one.
  const [from, setFrom] = useState(pictures);
  if (from !== pictures) {
    setFrom(pictures);
    setOrder(pictures);
  }

  const move = async (a: number, b: number) => {
    if (b < 0 || b >= order.length || a === b) return;
    const before = order;
    const next = [...order];
    const [moved] = next.splice(a, 1);
    next.splice(b, 0, moved);
    setOrder(next);
    const db = createClient();
    const results = await Promise.all(next.map((p, position) => db.from("project_files").update({ position }).eq("id", p.id)));
    if (results.some((r) => r.error)) {
      setOrder(before);
      toast.error("Couldn't save the order. Try again.");
    }
  };
  const drag = useDragReorder((a, b) => void move(a, b));

  const saveNote = async (picture: ReferencePicture, text: string) => {
    const note = text.trim().slice(0, 1000) || null;
    if ((picture.note ?? null) === note) return;
    const { error } = await createClient().from("project_files").update({ note }).eq("id", picture.id);
    if (error) return void toast.error("Couldn't save the note. Try again.");
    setOrder((was) => was.map((p) => (p.id === picture.id ? { ...p, note } : p)));
  };

  return (
    <ScrollRow label="References" arrowTop={POSTER_ARROWS} className="items-start gap-4">
      {linked.map((l) => (
        <li key={l.id} style={posterSpan(shapes[l.id])} className={POSTER_CARD}>
          <Link
            href={l.href}
            aria-label={`Open ${l.name}`}
            className="relative block w-full overflow-hidden rounded-lg bg-muted outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            style={{ aspectRatio: shapes[l.id] || POSTER }}
          >
            {l.url && (
              // eslint-disable-next-line @next/next/no-img-element -- posters from Explore and covers on private links
              <img
                src={l.url}
                alt=""
                loading="lazy"
                onLoad={(e) => {
                  const shape = e.currentTarget.naturalWidth / e.currentTarget.naturalHeight;
                  setShapes((was) => (was[l.id] === shape ? was : { ...was, [l.id]: shape }));
                }}
                className="absolute inset-0 size-full object-cover transition-transform duration-base ease-out hover:scale-[1.02] motion-reduce:transition-none"
              />
            )}
          </Link>
          {l.note && <p className="px-1 text-small text-muted-foreground">{l.note}</p>}
        </li>
      ))}
      {order.map((p, i) => (
        <li key={p.id} style={posterSpan(shapes[p.id])} className={cn(POSTER_CARD, drag.state(i))} {...(canEdit ? drag.target(i) : {})}>
          <button
            type="button"
            aria-label={`Open ${p.name}`}
            onClick={() => onOpen(p.id)}
            className="relative block w-full overflow-hidden rounded-lg bg-muted outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            style={{ aspectRatio: shapes[p.id] || POSTER }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- private files use links that last a while, which the image optimiser would cache */}
            <img
              src={p.url}
              alt=""
              loading="lazy"
              onLoad={(e) => {
                const shape = e.currentTarget.naturalWidth / e.currentTarget.naturalHeight;
                setShapes((was) => (was[p.id] === shape ? was : { ...was, [p.id]: shape }));
              }}
              className="absolute inset-0 size-full object-cover transition-transform duration-base ease-out hover:scale-[1.02] motion-reduce:transition-none"
            />
          </button>
          <div className="flex items-center gap-1">
            {canEdit && <DragHandle name={p.name} {...drag.handle(i)} />}
            {/* No name under the picture: it shows when the picture is opened (Ika, 2026-11-25). */}
            <span className="min-w-0 flex-1" />
            {canEdit && (
              <span className={CARD_TOOLS}>
                <MoveButtons name={p.name} i={i} count={order.length} onMove={(a, b) => void move(a, b)} />
              </span>
            )}
          </div>
          {p.notes === false ? null : canEdit ? (
            <Textarea
              key={`${p.id}-${p.note ?? ""}`}
              aria-label={`Note on ${p.name}`}
              defaultValue={p.note ?? ""}
              placeholder="Add a note"
              rows={2}
              maxLength={1000}
              onBlur={(e) => void saveNote(p, e.target.value)}
              className="-mt-1 min-h-14 resize-none border-transparent bg-transparent px-1 text-small shadow-none hover:bg-muted/50 focus-visible:bg-background"
            />
          ) : p.note ? (
            <p className="text-small text-muted-foreground">{p.note}</p>
          ) : null}
        </li>
      ))}
    </ScrollRow>
  );
}
