"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChipMenu } from "@/components/nia/filter-bar";
import {
  PRESETS,
  type PresetId,
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
import { OverviewBrush } from "./overview-brush";
import { EraBackground, EraNames } from "./era-bands";
import { eraAt } from "@/features/explore/timeline/eras";
import { TmdbCredit } from "../tmdb-credit";
import { ExploreAllViews } from "../explore-all-views";
import { BackLink } from "@/components/nia/back-link";

// Explore all's Timeline (Ika, 2026-11-02; design-ref EXPLORE_TIMELINE_SPEC.md): every title on
// one line through time that zooms from a century to an hour. The playhead follows the pointer;
// the title nearest it lifts and shows above the lane (its format, then its name). Posters stack
// in up to three rows and gather into clusters when there's no room; at Century the lane is a
// chart of titles per year with each decade's leading title above it.

export type TimelineFrame = Omit<TimelineItem, "precision">;

export function TimelineView({
  items,
  bounds,
  initial,
  now,
  initialFocus = null,
}: {
  items: TimelineFrame[];
  bounds: View;
  initial: View;
  now: number;
  /** A title to put the playhead on first (the address's `focus`). */
  initialFocus?: string | null;
}) {
  const router = useRouter();
  const { view, viewRef, zoomAt, panPx, fling, animateTo, jumpTo, stop } = useTimelineScale(initial, bounds);
  const lane = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1200);
  const [laneHeight, setLaneHeight] = useState(560);
  const [cursor, setCursor] = useState<number | null>(null);
  const [measured, setMeasured] = useState(false);

  useEffect(() => {
    const el = lane.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      // Hidden (phones and tablets show a note instead): keep the last real size.
      if (!e.contentRect.width) return;
      setWidth(e.contentRect.width);
      setLaneHeight(e.contentRect.height);
      setMeasured(true);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const span = view.end - view.start;
  const timeAt = (x: number) => view.start + (x / width) * span;
  const ticks = useMemo(() => ticksFor(view, width), [view, width]);
  const level = nearestPreset(span);
  const century = level === "century";
  // Posters as tall as the level asks, but three rows must fit under the date at the top (phones).
  const room = laneHeight - 56 - 24 - 48 - (century ? 92 : 20) - 24;
  const height = Math.max(36, Math.min(FRAME_HEIGHT[level], Math.floor(room / 3) - 12));
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
  const era = eraAt(playT, now);
  const inView = useMemo(() => items.filter((i) => i.at >= view.start && i.at <= view.end).length, [items, view]);

  // The address's `focus`: put the playhead on that title once the lane knows its width.
  const [pendingFocus, setPendingFocus] = useState(initialFocus);
  if (pendingFocus && measured) {
    setPendingFocus(null);
    const s = slots.find((x) => x.members.includes(pendingFocus));
    if (s) setCursor(s.x);
  }

  // When the view settles: tell screen readers what's showing, and keep the address in step so
  // the view can be shared (`?from=…&to=…&focus=…`; replaced, not added, so Back leaves Explore all).
  const [announce, setAnnounce] = useState("");
  useEffect(() => {
    const t = setTimeout(() => {
      setAnnounce(`Showing ${rangeLabel(view)}, ${inView} ${inView === 1 ? "title" : "titles"}.`);
      const stamp = (ms: number) => new Date(ms).toISOString().slice(0, 16);
      const q = new URLSearchParams({ from: stamp(view.start), to: stamp(view.end) });
      if (focused) q.set("focus", focused.id);
      window.history.replaceState(window.history.state, "", `?${q}`);
    }, 600);
    return () => clearTimeout(t);
  }, [view, inView, focused]);

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
  const preset = (id: PresetId) => animateTo(centredOn(playT, PRESETS.find((p) => p.id === id)!.span, bounds));

  // Keyboard (§3), with the lane focused: arrows move (Shift: a whole screen), + and − zoom,
  // 1–7 the levels, T today, F fit, Enter opens the title at the playhead. Tab walks the
  // posters in time order and the playhead follows.
  const onKeyDown = (e: React.KeyboardEvent) => {
    const k = e.key;
    let handled = true;
    if (k === "ArrowLeft" || k === "ArrowRight") {
      const dir = k === "ArrowLeft" ? -1 : 1;
      if (e.shiftKey) glideTo(panBy(view, dir * span, bounds));
      else panPx(dir * width * 0.1, width);
    } else if (k === "+" || k === "=") glideTo(zoomAround(view, playT, 0.5, bounds));
    else if (k === "-" || k === "_") glideTo(zoomAround(view, playT, 2, bounds));
    else if (/^[1-7]$/.test(k)) preset(PRESETS[Number(k) - 1].id);
    else if (k === "t" || k === "T") glideTo(centredOn(now, span, bounds));
    else if (k === "f" || k === "F") glideTo(fitView(allDates, bounds));
    else if (k === "Enter" && e.target === e.currentTarget && focused) router.push(focused.href);
    else handled = false;
    if (handled) e.preventDefault();
  };

  return (
    // Below the navbar; on phones and tablets above the dock, on desktop clear of Send feedback.
    <div className="flex h-[calc(100svh-12rem)] min-h-140 flex-col gap-4 px-4 pt-4 pb-4 md:px-6 lg:h-[calc(100svh-5rem)] lg:pb-20">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BackLink
          href="/explore"
          className="rounded-full bg-card/90 px-4 py-2 text-sm leading-[1.4] font-bold text-muted-foreground shadow-card outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          ← Explore
        </BackLink>
        <ExploreAllViews current="timeline" />
      </div>

      {/* The readout (§1): the title under the playhead (click to open it), and the visible range. */}
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        {/* Empty (but holding its space) when no title is near the playhead. */}
        <div key={focused?.id ?? "none"} className={cn("flex min-w-0 animate-in flex-col gap-1 duration-200 fade-in slide-in-from-bottom-1.5 motion-reduce:animate-none", !focused && "invisible")}>
          <p className="text-small font-bold text-muted-foreground">{focused?.format ?? "\u00a0"}</p>
          {focused ? (
            <Link
              href={focused.href}
              title="Shows the title under the playhead. Click to open it."
              className="truncate rounded-sm text-h2 leading-tight font-semibold text-foreground outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 md:text-h1"
            >
              {focused.title}
            </Link>
          ) : (
            <p aria-hidden className="text-h2 leading-tight font-semibold md:text-h1">&nbsp;</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" aria-label="Earlier" onClick={() => glideTo(panBy(view, -span, bounds))}>
            <ChevronLeft aria-hidden />
          </Button>
          <p className="min-w-36 text-center text-sm font-semibold text-foreground tabular-nums">
            {rangeLabel(view)}
          </p>
          <Button variant="ghost" size="icon" aria-label="Later" onClick={() => glideTo(panBy(view, span, bounds))}>
            <ChevronRight aria-hidden />
          </Button>
        </div>
      </header>
      <h1 className="sr-only">Explore all, timeline</h1>
      <p aria-live="polite" className="sr-only">
        {announce}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <div className="md:hidden">
          <ChipMenu label="Zoom" value={level} options={PRESETS.map((p) => ({ value: p.id, label: p.label }))} onChange={preset} />
        </div>
        <div role="group" aria-label="Zoom level" className="flex flex-wrap gap-1 rounded-full bg-secondary p-1 max-md:hidden">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={level === p.id}
              onClick={() => preset(p.id)}
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
        <TmdbCredit className="ml-auto" />
      </div>

      {/* The lane: drag, scroll or pinch. The playhead follows the pointer. */}
      <div
        ref={lane}
        tabIndex={0}
        role="group"
        aria-roledescription="timeline"
        aria-label={`Timeline, ${rangeLabel(view)}. Scroll or drag to move through time; pinch or ⌘ + scroll to zoom. Arrow keys move, plus and minus zoom, 1 to 7 pick a level, T today, F fit.`}
        onKeyDown={onKeyDown}
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
        <EraBackground view={view} width={width} now={now} active={era?.id ?? null} />
        <FramesLane
          slots={slots}
          items={byId}
          height={height}
          playX={playX}
          hovering={cursor !== null}
          focusId={focus?.id ?? null}
          onCluster={(from, to) => glideTo(fitView([from, to], bounds))}
          onFocusSlot={setCursor}
        >
          {century && <CenturyChart items={items} view={view} width={width} />}
        </FramesLane>
        {!century && inView === 0 && slots.every((s) => s.x < 0 || s.x > width) && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 pb-14">
            <p className="text-sm text-muted-foreground">Nothing here between {rangeLabel(view).replace(" – ", " and ")}.</p>
            <Button variant="outline" size="compact" className="pointer-events-auto" onClick={() => glideTo(fitView(allDates, bounds))}>
              Fit
            </Button>
          </div>
        )}
        <EraNames view={view} width={width} now={now} active={era?.id ?? null} />
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

      <OverviewBrush dates={allDates} bounds={bounds} view={view} now={now} onDrag={jumpTo} onJump={(t) => glideTo(centredOn(t, span, bounds))} />
    </div>
  );
}
