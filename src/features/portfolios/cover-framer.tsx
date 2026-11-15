"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { DEFAULT_FRAME, type CoverFrame } from "./types";

// Framing the cover (PORTFOLIOS_BUILD.md P5, "frame the cover"): the cover always fills the screen,
// so the owner picks what stays in view. A phone and a large screen side by side, the same framing
// on both; drag either to move the picture, the slider zooms, Reset puts it back. Saved a moment after
// the last change (one save, not one per arrow press, so an older save can't land last), always with
// the newest framing (kept in a ref: letting go of a drag can come before the last move is drawn).
export function CoverFramer({ url, frame, onChange }: { url: string; frame: CoverFrame; onChange: (frame: CoverFrame) => void }) {
  const [live, setLive] = useState(frame);
  const latest = useRef(frame);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveFn = useRef(onChange);
  useEffect(() => { saveFn.current = onChange; });
  const set = (next: CoverFrame) => {
    latest.current = next;
    setLive(next);
  };
  const commit = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      saveFn.current(latest.current);
    }, 400);
  };
  // Leaving the page (or picking another cover) saves what's waiting.
  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
        saveFn.current(latest.current);
      }
    },
    [],
  );
  const drag = useRef<{ x: number; y: number; start: CoverFrame; w: number; h: number } | null>(null);
  const clamp = (n: number) => Math.min(100, Math.max(0, n));

  const down = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const box = e.currentTarget.getBoundingClientRect();
    drag.current = { x: e.clientX, y: e.clientY, start: latest.current, w: box.width, h: box.height };
  };
  const move = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    // Dragging right shows more of the left of the picture: the focus point moves the other way.
    set({ ...d.start, x: clamp(d.start.x - ((e.clientX - d.x) / d.w) * (100 / d.start.z)), y: clamp(d.start.y - ((e.clientY - d.y) / d.h) * (100 / d.start.z)) });
  };
  const up = () => {
    if (!drag.current) return;
    drag.current = null;
    commit();
  };
  // Arrow keys nudge the framing for people not using a pointer.
  const key = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 2;
    const by = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (!by) return;
    e.preventDefault();
    const now = latest.current;
    set({ ...now, x: clamp(now.x + by[0]), y: clamp(now.y + by[1]) });
    commit();
  };

  const view = (shape: string, label: string, className: string) => (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div
        role="img"
        aria-label={`The cover on ${label}`}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        className="relative w-full cursor-grab touch-none overflow-hidden rounded-xl bg-muted active:cursor-grabbing"
        style={{ aspectRatio: shape }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- a private file's link that lasts an hour */}
        <img
          src={url}
          alt=""
          draggable={false}
          className="pointer-events-none absolute inset-0 size-full object-cover select-none"
          style={{ objectPosition: `${live.x}% ${live.y}%`, transform: `scale(${live.z})`, transformOrigin: `${live.x}% ${live.y}%` }}
        />
      </div>
      <span className="text-caption text-muted-foreground">{label}</span>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div tabIndex={0} onKeyDown={key} aria-label="Cover framing: drag a picture or use the arrow keys" className="flex items-start gap-4 rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        {view("9 / 16", "Phone", "w-28 shrink-0")}
        {view("16 / 9", "Large screen", "min-w-0 flex-1 max-w-md")}
      </div>
      <div className="flex max-w-md items-center gap-3">
        <span className="text-small text-muted-foreground">Zoom</span>
        <Slider thumbLabel="Zoom" min={1} max={3} step={0.05} value={[live.z]} onValueChange={([z]) => set({ ...latest.current, z })} onValueCommit={commit} className="flex-1" />
        <Button
          variant="ghost"
          size="compact"
          onClick={() => {
            set(DEFAULT_FRAME);
            commit();
          }}
        >
          <RotateCcw aria-hidden /> Reset
        </Button>
      </div>
    </div>
  );
}
