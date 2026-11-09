"use client";

import { memo, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { GAP, MAX_ROWS, perYear, type Slot } from "@/features/explore/timeline/layout";
import type { View } from "@/features/explore/timeline/scale";
import type { TimelineFrame } from "./timeline-view";
import { servedSized } from "@/lib/served-sized";

// The Timeline's posters (EXPLORE_TIMELINE_SPEC.md §4, §6): each title at its date, stacked in up
// to three rows; a cluster shows its leading title with two more peeking behind and a count, and
// opens up when clicked. Around the playhead the nearest poster lifts and its neighbours fall
// off, while titles far from it dim; with reduced motion nothing moves and the title at the
// playhead gets an outline instead.

const ROW_GAP = 12;

const REDUCE = "(prefers-reduced-motion: reduce)";
const onMotionChange = (cb: () => void) => {
  const mq = window.matchMedia(REDUCE);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const useReducedMotion = () => useSyncExternalStore(onMotionChange, () => window.matchMedia(REDUCE).matches, () => false);
const CHART = 72; // the Century chart's height

export function FramesLane({
  slots,
  items,
  height,
  playX,
  hovering,
  focusId,
  onCluster,
  onFocusSlot,
  children,
}: {
  slots: Slot[];
  items: Map<string, TimelineFrame>;
  height: number;
  playX: number;
  hovering: boolean;
  focusId: string | null;
  onCluster: (from: number, to: number) => void;
  /** Tabbing onto a poster puts the playhead on it. */
  onFocusSlot: (x: number) => void;
  children?: React.ReactNode;
}) {
  const base = (children ? CHART : 0) + 20;
  const reduced = useReducedMotion();
  return (
    <div className="relative flex-1" style={{ minHeight: base + MAX_ROWS * (height + ROW_GAP) + 24 }}>
      {children}
      {slots.map((s) => {
        const item = items.get(s.id);
        if (!item) return null;
        const pitch = s.width + GAP;
        const dx = Math.abs(s.x - playX);
        const lift = hovering && !reduced ? Math.max(0, 1 - dx / (3 * pitch)) : 0;
        const light = hovering ? 0.55 + 0.45 * Math.max(0, 1 - dx / (8 * pitch)) : 1;
        const focused = s.id === focusId;
        const cluster = s.members.length > 1;
        // Placed with transform (no layout work as the line moves); the lift rides on it.
        const style: React.CSSProperties = {
          left: 0,
          bottom: base + s.row * (height + ROW_GAP),
          width: s.width,
          height,
          transform: `translate3d(${(s.x - s.width / 2).toFixed(1)}px, ${(-12 * lift).toFixed(1)}px, 0) scale(${(1 + 0.06 * lift).toFixed(3)})`,
          filter: light < 1 ? `brightness(${light.toFixed(2)})` : undefined,
          zIndex: 10 + Math.round(lift * 10),
        };
        const look = cn(
          "absolute origin-bottom rounded-lg outline-none transition-[filter,box-shadow] duration-fast ease-out focus-visible:ring-3 focus-visible:ring-ring/50",
          focused && (reduced ? "ring-2 ring-nia-blue" : "shadow-elevation-2"),
        );
        const label = `${item.format}, ${item.title}, ${new Date(item.at).getUTCFullYear()}`;
        if (cluster) {
          return (
            <button
              key={`${s.id}-${s.members.length}`}
              type="button"
              data-frame
              aria-label={`${s.members.length} titles around ${label}. Zoom in to see them.`}
              onClick={() => onCluster(s.from, s.to)}
              onFocus={() => onFocusSlot(s.x)}
              className={look}
              style={style}
            >
              <span aria-hidden className="absolute inset-0 -translate-y-2 translate-x-2 rounded-lg border border-border bg-muted" />
              <span aria-hidden className="absolute inset-0 -translate-y-1 translate-x-1 rounded-lg border border-border bg-secondary" />
              <Poster item={item} width={s.width} />
              <span className="absolute -top-2.5 -right-2.5 z-10 min-w-6 rounded-full bg-foreground px-1.5 py-0.5 text-center text-micro font-bold text-background tabular-nums">
                {s.members.length}
              </span>
            </button>
          );
        }
        return (
          <Link key={s.id} href={item.href} data-frame aria-label={label} draggable={false} onFocus={() => onFocusSlot(s.x)} className={look} style={style}>
            <Poster item={item} width={s.width} />
          </Link>
        );
      })}
    </div>
  );
}

// Memoised: a poster's picture doesn't redraw while the line moves.
const Poster = memo(function Poster({ item, width }: { item: TimelineFrame; width: number }) {
  return (
    <span className={cn("absolute inset-0 overflow-hidden rounded-lg", item.image ? "bg-muted" : item.grain)}>
      {item.image ? (
        <Image src={item.image} unoptimized={servedSized(item.image)} alt="" fill sizes={`${Math.max(64, width)}px`} draggable={false} className="pointer-events-none object-cover" />
      ) : (
        <span className="absolute inset-x-1.5 bottom-1.5 line-clamp-3 text-micro leading-tight font-bold">{item.title}</span>
      )}
    </span>
  );
});

/** Century level: titles per year as bars along the bottom of the lane. */
export function CenturyChart({ items, view, width }: { items: TimelineFrame[]; view: View; width: number }) {
  const counts = perYear(items, view);
  const max = Math.max(1, ...counts.values());
  const perMs = width / (view.end - view.start);
  const yearPx = 365.2425 * 86_400_000 * perMs;
  return (
    <div aria-hidden className="absolute inset-x-0 bottom-3" style={{ height: CHART }}>
      {[...counts].map(([year, n]) => (
        <span
          key={year}
          className="absolute bottom-0 rounded-t-sm bg-foreground/25"
          style={{ left: (Date.UTC(year, 0, 1) - view.start) * perMs, width: Math.max(1, yearPx - 1), height: 4 + ((CHART - 4) * n) / max }}
        />
      ))}
    </div>
  );
}
