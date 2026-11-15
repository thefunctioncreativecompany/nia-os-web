"use client";

import { useRef, useState } from "react";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { DEFAULT_FRAME, type CoverFrame } from "./types";

// Framing the cover (PORTFOLIOS_BUILD.md P5, "frame the cover"): the cover always fills the screen,
// so the owner picks what stays in view. A phone and a large screen side by side, the same framing
// on both; drag either to move the picture, the slider zooms, Reset puts it back. Saved when you let go.
export function CoverFramer({ url, frame, onChange }: { url: string; frame: CoverFrame; onChange: (frame: CoverFrame) => void }) {
  const [live, setLive] = useState(frame);
  const drag = useRef<{ x: number; y: number; start: CoverFrame; w: number; h: number } | null>(null);
  const clamp = (n: number) => Math.min(100, Math.max(0, n));

  const down = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const box = e.currentTarget.getBoundingClientRect();
    drag.current = { x: e.clientX, y: e.clientY, start: live, w: box.width, h: box.height };
  };
  const move = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    // Dragging right shows more of the left of the picture: the focus point moves the other way.
    setLive({ ...d.start, x: clamp(d.start.x - ((e.clientX - d.x) / d.w) * (100 / d.start.z)), y: clamp(d.start.y - ((e.clientY - d.y) / d.h) * (100 / d.start.z)) });
  };
  const up = () => {
    if (!drag.current) return;
    drag.current = null;
    onChange(live);
  };
  // Arrow keys nudge the framing for people not using a pointer.
  const key = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 2;
    const by = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (!by) return;
    e.preventDefault();
    const next = { ...live, x: clamp(live.x + by[0]), y: clamp(live.y + by[1]) };
    setLive(next);
    onChange(next);
  };

  const view = (shape: string, label: string, className: string) => (
    <div className="flex flex-col gap-1.5">
      <div
        role="img"
        aria-label={`The cover on ${label}`}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        className={`relative cursor-grab touch-none overflow-hidden rounded-xl bg-muted active:cursor-grabbing ${className}`}
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
        {view("9 / 16", "Phone", "w-28")}
        {view("16 / 9", "Large screen", "w-full max-w-md")}
      </div>
      <div className="flex max-w-md items-center gap-3">
        <span className="text-small text-muted-foreground">Zoom</span>
        <Slider thumbLabel="Zoom" min={1} max={3} step={0.05} value={[live.z]} onValueChange={([z]) => setLive((f) => ({ ...f, z }))} onValueCommit={([z]) => onChange({ ...live, z })} className="flex-1" />
        <Button
          variant="ghost"
          size="compact"
          onClick={() => {
            setLive(DEFAULT_FRAME);
            onChange(DEFAULT_FRAME);
          }}
        >
          <RotateCcw aria-hidden /> Reset
        </Button>
      </div>
    </div>
  );
}
