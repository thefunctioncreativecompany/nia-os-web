"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  PRESETS,
  centredOn,
  fitView,
  nearestPreset,
  panBy,
  playheadLabel,
  rangeLabel,
  ticksFor,
  zoomAround,
  type View,
} from "@/features/explore/timeline/scale";
import { useTimelineScale } from "@/features/explore/timeline/use-timeline-scale";
import { TimeAxis } from "./time-axis";

// Explore all's Timeline (Ika, 2026-11-02; design-ref EXPLORE_TIMELINE_SPEC.md): every title on
// one line through time that zooms from a century to an hour. Step B: the scale, the axis, the
// level buttons, zooming around the pointer, dragging with momentum, and the playhead. Each
// title is a dot at its release day until the posters arrive (step C).

export type TimelineDot = { id: string; at: number };

export function TimelineView({ dots, bounds, initial, now }: { dots: TimelineDot[]; bounds: View; initial: View; now: number }) {
  const { view, viewRef, zoomAt, panPx, fling, animateTo, stop } = useTimelineScale(initial, bounds);
  const lane = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1200);
  const [cursor, setCursor] = useState<number | null>(null);

  useEffect(() => {
    const el = lane.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const span = view.end - view.start;
  const timeAt = (x: number) => view.start + (x / width) * span;
  const xOf = (t: number) => ((t - view.start) / span) * width;
  const ticks = useMemo(() => ticksFor(view, width), [view, width]);
  const active = nearestPreset(span);
  const playX = cursor ?? width / 2;
  const playT = timeAt(playX);

  // Wheel: ⌘ / Ctrl (and trackpad pinch, which arrives as Ctrl + wheel) zooms around the
  // pointer; otherwise it pans, vertical scrolling too. Listened to directly so the page doesn't
  // scroll or zoom instead.
  useEffect(() => {
    const el = lane.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const scale = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
      const x = e.clientX - el.getBoundingClientRect().left;
      const v = viewRef.current;
      const anchor = v.start + (x / el.clientWidth) * (v.end - v.start);
      if (e.ctrlKey || e.metaKey) zoomAt(anchor, 1.0015 ** (e.deltaY * scale));
      else panPx((Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * scale, el.clientWidth);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [panPx, viewRef, zoomAt]);

  // Drag to pan (with momentum), two fingers to pinch around their midpoint.
  const pointers = useRef(new Map<number, number>());
  const drag = useRef<{ x: number; t: number; v: number; moved: number } | null>(null);
  const pinch = useRef<number | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    stop();
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, e.clientX);
    drag.current = { x: e.clientX, t: e.timeStamp, v: 0, moved: 0 };
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = Math.abs(a - b);
    }
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const left = e.currentTarget.getBoundingClientRect().left;
    setCursor(e.clientX - left);
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, e.clientX);
    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.abs(a - b);
      if (dist > 0) zoomAt(timeAt((a + b) / 2 - left), pinch.current / dist);
      pinch.current = dist;
      return;
    }
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dt = Math.max(1, e.timeStamp - d.t);
    panPx(-dx, width);
    drag.current = { x: e.clientX, t: e.timeStamp, v: 0.8 * (dx / dt) + 0.2 * d.v, moved: d.moved + Math.abs(dx) };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    const d = drag.current;
    drag.current = null;
    if (d && pointers.current.size === 0 && e.timeStamp - d.t < 80) fling(-d.v, width);
    if (e.pointerType !== "mouse") setCursor(null);
  };

  const glideTo = (v: View | null) => v && animateTo(v);
  const allDates = useMemo(() => dots.map((d) => d.at), [dots]);
  const shown = dots.filter((d) => d.at >= view.start - span && d.at <= view.end + span);

  return (
    <div className="flex h-[calc(100svh-5rem)] min-h-140 flex-col gap-4 px-4 pt-4 pb-4 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/explore/all"
          className="rounded-full bg-card/90 px-4 py-2 text-sm leading-[1.4] font-bold text-muted-foreground shadow-card outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          ← Explore all
        </Link>
      </div>

      {/* The readout (§1): what's under the playhead, and the visible range. */}
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-small font-bold text-muted-foreground">All formats</p>
          <h1 className="text-h2 leading-tight font-semibold text-foreground md:text-h1">Your year in frames</h1>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" aria-label="Earlier" onClick={() => glideTo(panBy(view, -span, bounds))}>
            <ChevronLeft aria-hidden />
          </Button>
          <p aria-live="polite" className="min-w-36 text-center text-sm font-semibold text-foreground tabular-nums">
            {rangeLabel(view)}
          </p>
          <Button variant="ghost" size="icon" aria-label="Later" onClick={() => glideTo(panBy(view, span, bounds))}>
            <ChevronRight aria-hidden />
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Zoom level" className="flex flex-wrap gap-1 rounded-full bg-secondary p-1">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={active === p.id}
              onClick={() => animateTo(centredOn(playT, p.span, bounds))}
              className={cn(
                "rounded-full px-3 py-1.5 text-small font-semibold outline-none transition-colors duration-fast focus-visible:ring-3 focus-visible:ring-ring/50",
                active === p.id ? "bg-card text-foreground shadow-card" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <Button variant="outline" size="compact" onClick={() => glideTo(centredOn(now, span, bounds))}>
          Today
        </Button>
        <Button variant="outline" size="compact" onClick={() => glideTo(fitView(allDates, bounds))}>
          Fit
        </Button>
      </div>

      {/* The lane: drag, scroll or pinch. The playhead follows the pointer. */}
      <div
        ref={lane}
        tabIndex={0}
        aria-label={`Timeline, ${rangeLabel(view)}. Scroll or drag to move through time; pinch or ⌘ + scroll to zoom.`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={(e) => e.pointerType === "mouse" && !drag.current && setCursor(null)}
        onDoubleClick={(e) => glideTo(zoomAround(view, timeAt(e.clientX - e.currentTarget.getBoundingClientRect().left), 0.25, bounds))}
        className="relative flex min-h-60 flex-1 cursor-grab touch-none flex-col justify-end overflow-hidden rounded-2xl border border-border bg-card outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 active:cursor-grabbing"
      >
        {/* Titles at their release day (posters in step C). */}
        <div aria-hidden className="relative h-6">
          {shown.map((d) => (
            <span key={d.id} className="absolute top-2 size-2 -translate-x-1/2 rounded-full bg-foreground/40" style={{ left: xOf(d.at) }} />
          ))}
        </div>
        <TimeAxis ticks={ticks} width={width} />

        {/* The playhead: a line, a dot on the axis and the date. */}
        <div aria-hidden className="pointer-events-none absolute inset-y-0" style={{ left: playX }}>
          <span className="absolute inset-y-0 w-px bg-foreground" />
          <span className="absolute bottom-14 size-2 -translate-x-[3.5px] translate-y-1 rounded-full bg-foreground" />
          <span className="absolute top-3 -translate-x-1/2 rounded-full bg-foreground px-2.5 py-1 text-caption font-semibold whitespace-nowrap text-background tabular-nums">
            {playheadLabel(playT, span)}
          </span>
        </div>
      </div>
    </div>
  );
}
