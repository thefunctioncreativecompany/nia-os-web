"use client";

import { useEffect, useRef, useState } from "react";

import type { View } from "@/features/explore/timeline/scale";

// The Timeline's overview (EXPLORE_TIMELINE_SPEC.md §1, §3): the whole library as titles per
// year, drawn on a canvas, with a window showing what the lane shows. Drag the window to move,
// drag its edges to zoom, or click anywhere else on the strip to go there.

type Grab = { mode: "move" | "start" | "end"; x: number; view: View };

export function OverviewBrush({
  dates,
  bounds,
  view,
  now,
  onDrag,
  onJump,
}: {
  dates: number[];
  bounds: View;
  view: View;
  now: number;
  /** While dragging: go straight to this view. */
  onDrag: (v: View) => void;
  /** A click on the strip: glide to centre on this time. */
  onJump: (t: number) => void;
}) {
  const strip = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [width, setWidth] = useState(0);
  const grab = useRef<Grab | null>(null);
  const total = bounds.end - bounds.start;
  const x = (t: number) => ((t - bounds.start) / total) * width;

  useEffect(() => {
    const el = strip.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Titles per year as bars, in the theme's text colour (read from the page, so dark mode works).
  useEffect(() => {
    const c = canvas.current;
    if (!c || !width) return;
    const dpr = window.devicePixelRatio || 1;
    const h = 32;
    c.width = width * dpr;
    c.height = h * dpr;
    const ctx = c.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, h);
    const counts = new Map<number, number>();
    for (const t of dates) {
      const y = new Date(t).getUTCFullYear();
      counts.set(y, (counts.get(y) ?? 0) + 1);
    }
    const max = Math.max(1, ...counts.values());
    const yearPx = (365.2425 * 86_400_000 * width) / total;
    const px = (t: number) => ((t - bounds.start) / total) * width;
    ctx.fillStyle = getComputedStyle(c).color;
    ctx.globalAlpha = 0.35;
    for (const [year, n] of counts) {
      const bh = 2 + ((h - 2) * Math.sqrt(n)) / Math.sqrt(max);
      ctx.fillRect(px(Date.UTC(year, 0, 1)), h - bh, Math.max(1, yearPx - 0.5), bh);
    }
  }, [dates, width, total, bounds.start]);

  const timeAt = (clientX: number) => bounds.start + ((clientX - strip.current!.getBoundingClientRect().left) / width) * total;
  const left = Math.max(0, x(view.start));
  const right = Math.min(width, x(view.end));
  const onPointerDown = (e: React.PointerEvent) => {
    const mode = (e.target as HTMLElement).dataset.grab as Grab["mode"] | undefined;
    if (!mode) return onJump(timeAt(e.clientX));
    e.currentTarget.setPointerCapture(e.pointerId);
    grab.current = { mode, x: e.clientX, view };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const g = grab.current;
    if (!g) return;
    const dt = ((e.clientX - g.x) / width) * total;
    if (g.mode === "move") onDrag({ start: g.view.start + dt, end: g.view.end + dt });
    else if (g.mode === "start") onDrag({ start: Math.min(g.view.start + dt, g.view.end - 1), end: g.view.end });
    else onDrag({ start: g.view.start, end: Math.max(g.view.end + dt, g.view.start + 1) });
  };
  const year = (t: number) => new Date(t).getUTCFullYear();

  return (
    <div className="flex flex-col gap-1">
      <div
        ref={strip}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => (grab.current = null)}
        onPointerCancel={() => (grab.current = null)}
        className="relative h-8 cursor-pointer touch-none rounded-md bg-secondary/60 select-none"
        aria-hidden
      >
        <canvas ref={canvas} className="absolute inset-0 h-8 w-full text-foreground" />
        {width > 0 && (
          // At least 12px wide to grab; edges to drag only when there's room for them.
          <div
            data-grab="move"
            className="absolute inset-y-0 cursor-grab rounded-md border-2 border-foreground/70 bg-foreground/5 active:cursor-grabbing"
            style={{ left: Math.min(left, width - 12), width: Math.max(12, right - left) }}
          >
            {right - left > 32 && (
              <>
                <span data-grab="start" className="absolute inset-y-0 -left-1.5 w-3 cursor-ew-resize" />
                <span data-grab="end" className="absolute inset-y-0 -right-1.5 w-3 cursor-ew-resize" />
              </>
            )}
          </div>
        )}
      </div>
      <div className="flex justify-between text-micro text-muted-foreground tabular-nums">
        <span>{year(bounds.start)}</span>
        <span>{year(Math.min(bounds.end, now))}</span>
      </div>
    </div>
  );
}
