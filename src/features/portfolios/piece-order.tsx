"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import type { Piece } from "./types";

// A project's work in the order it shows (PORTFOLIOS_BUILD.md P2 "Arrange", cut down): each piece
// moves earlier or later, and the order is saved on the files (`position`), so it's the same in
// every portfolio the project is in.
export function PieceOrder({ pieces, onSaved }: { pieces: Piece[]; onSaved: () => void }) {
  const [order, setOrder] = useState(pieces);
  const move = async (i: number, by: number) => {
    const to = i + by;
    if (to < 0 || to >= order.length) return;
    const before = order;
    const next = [...order];
    [next[i], next[to]] = [next[to], next[i]];
    setOrder(next);
    const db = createClient();
    const results = await Promise.all(next.map((p, position) => db.from("project_files").update({ position }).eq("id", p.id)));
    if (results.some((r) => r.error)) {
      setOrder(before);
      return void toast.error("Couldn't save the order. Try again.");
    }
    onSaved();
  };
  return (
    <ol aria-label="Order of the work" className="grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-2 pt-1">
      {order.map((p, i) => (
        <li key={p.id} className="flex flex-col gap-1">
          <span className="relative block aspect-square overflow-hidden rounded-lg bg-muted">
            {p.kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element -- a private file's link that lasts an hour
              <img src={p.url} alt={p.name} loading="lazy" className="absolute inset-0 size-full object-cover" />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center p-2 text-center text-caption text-muted-foreground">{p.name}</span>
            )}
            <span className="absolute top-1 left-1 rounded-full bg-card/90 px-1.5 text-micro font-semibold tabular-nums text-foreground">{i + 1}</span>
          </span>
          <span className="flex justify-center gap-1">
            <Button variant="ghost" size="icon-sm" aria-label={`Move ${p.name} earlier`} disabled={i === 0} onClick={() => void move(i, -1)}>
              <ArrowLeft />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label={`Move ${p.name} later`} disabled={i === order.length - 1} onClick={() => void move(i, 1)}>
              <ArrowRight />
            </Button>
          </span>
        </li>
      ))}
    </ol>
  );
}
