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
import { FRAME_HEIGHT, layoutLane, nearestSlot } from "@/features/explore/timeline/layout";
import { useTimelineScale } from "@/features/explore/timeline/use-timeline-scale";
import type { TimelineItem } from "@/features/explore/timeline/data";
import { TimeAxis } from "./time-axis";
import { FramesLane, CenturyChart } from "./frames-lane";
import { ExploreAllViews } from "../explore-all-views";

// Explore all's Timeline (Ika, 2026-11-02; design-ref EXPLORE_TIMELINE_SPEC.md): every title on
// one line through time that zooms from a century to an hour. The playhead follows the pointer;
// the title nearest it lifts and shows above the lane (its format, then its name). Posters stack
// in up to three rows and gather into clusters when there's no room; at Century the lane is a
// chart of titles per year with each decade's leading title above it.

export type TimelineFrame = Omit<TimelineItem, "precision">;

const DEFAULT_TITLE = "Your year in frames";

export function TimelineView({ items, bounds, initial, now }: { items: TimelineFrame[]; bounds: View; initial: View; now: number }) {
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
  const ticks = useMemo(() => ticksFor(view, width), [view, width]);
  const level = nearestPreset(span);
  const century = level === "century";
  const height = FRAME_HEIGHT[level];
  const playX = cursor ?? width / 2;
  const playT = timeAt(playX);

  // At Century, each decade's leading title stands above the chart.
  const laneItems = useMemo(() => {
    if (!century) return items;
    const best = new Map<number, TimelineFrame>();
    for (const it of items) {
      const decade = Math.floor(new Date(it.at).getUTCFullYear() / 10);
      const b = best.get(decade);
      if (!b || it.weight > b.weight) best.set(decade, it);
    }
    return [...best.values()].toSorted((a, b) => a.at - b.at);
  }, [century, items]);
  const slots = useMemo(() => layoutLane(laneItems, view, width, height), [laneItems, view, width, height]);
  const focus = nearestSlot(slots, playX, Math.max(48, height * 0.8));
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const focused = focus ? byId.get(focus.id) : undefined;

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

  // Drag to pan (with momentum), two fingers to pinch around their midpoint. The pointer is
  // captured only once it has moved, so a plain click still opens the title under it; a click
  // at the end of a drag is swallowed.
  const pointers = useRef(new Map<number, number>());
  const drag = useRef<{ x: number; t: number; v: number; moved: number } | null>(null);
  const pinch = useRef<number | null>(null);
  const dragged = useRef(false);
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    stop();
    dragged.current = false;
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
      dragged.current = true;
      return;
    }
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const moved = d.moved + Math.abs(dx);
    if (moved > 4 && !dragged.current) {
      dragged.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    if (!dragged.current) return;
    const dt = Math.max(1, e.timeStamp - d.t);
    panPx(-dx, width);
    drag.current = { x: e.clientX, t: e.timeStamp, v: 0.8 * (dx / dt) + 0.2 * d.v, moved };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    const d = drag.current;
    drag.current = null;
    if (d && dragged.current && pointers.current.size === 0 && e.timeStamp - d.t < 80) fling(-d.v, width);
    if (e.pointerType !== "mouse") setCursor(null);
  };

  const glideTo = (v: View | null) => v && animateTo(v);
  const allDates = useMemo(() => items.map((d) => d.at), [items]);

  return (
    <div className="flex h-[calc(100svh-5rem)] min-h-140 flex-col gap-4 px-4 pt-4 pb-4 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/explore"
          className="rounded-full bg-card/90 px-4 py-2 text-sm leading-[1.4] font-bold text-muted-foreground shadow-card outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          ← Explore
        </Link>
        <ExploreAllViews current="timeline" />
      </div>

      {/* The readout (§1): the title under the playhead (click to open it), and the visible range. */}
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div key={focused?.id ?? "none"} className="flex min-w-0 animate-in flex-col gap-1 duration-200 fade-in slide-in-from-bottom-1.5 motion-reduce:animate-none">
          <p className="text-small font-bold text-muted-foreground">{focused?.format ?? "All formats"}</p>
          {focused ? (
            <Link
              href={focused.href}
              title="Shows the title under the playhead. Click to open it."
              className="truncate rounded-sm text-h2 leading-tight font-semibold text-foreground outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 md:text-h1"
            >
              {focused.title}
            </Link>
          ) : (
            <h1 className="text-h2 leading-tight font-semibold text-foreground md:text-h1">{DEFAULT_TITLE}</h1>
          )}
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
      {focused && <h1 className="sr-only">Explore all, timeline</h1>}

      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Zoom level" className="flex flex-wrap gap-1 rounded-full bg-secondary p-1">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={level === p.id}
              onClick={() => animateTo(centredOn(playT, p.span, bounds))}
              className={cn(
                "rounded-full px-3 py-1.5 text-small font-semibold outline-none transition-colors duration-fast focus-visible:ring-3 focus-visible:ring-ring/50",
                level === p.id ? "bg-card text-foreground shadow-card" : "text-muted-foreground hover:text-foreground",
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
        onClickCapture={(e) => {
          if (dragged.current) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        onDoubleClick={(e) => {
          if ((e.target as HTMLElement).closest("[data-frame]")) return;
          glideTo(zoomAround(view, timeAt(e.clientX - e.currentTarget.getBoundingClientRect().left), 0.25, bounds));
        }}
        className="relative flex min-h-60 flex-1 cursor-grab touch-none flex-col justify-end overflow-hidden rounded-2xl border border-border bg-card outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 active:cursor-grabbing"
      >
        <FramesLane
          slots={slots}
          items={byId}
          height={height}
          playX={playX}
          hovering={cursor !== null}
          focusId={focus?.id ?? null}
          onCluster={(from, to) => glideTo(fitView([from, to], bounds))}
        >
          {century && <CenturyChart items={items} view={view} width={width} />}
        </FramesLane>
        <TimeAxis ticks={ticks} width={width} />

        {/* The playhead: a line, a dot on the axis and the date. */}
        <div aria-hidden className="pointer-events-none absolute inset-y-0 z-20" style={{ left: playX }}>
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
