"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { centredOn, panBy, zoomAround, type View } from "./scale";

// The Timeline's view and its motion (EXPLORE_TIMELINE_SPEC.md §2–3): zoom around a point
// (wheel and pinch steps gathered into one change per frame), pan by pixels, momentum after a
// drag (velocity × 0.92 a frame), and glides to a preset or Today (400ms, Explore's glide
// curve). With reduced motion there's no momentum and every glide jumps.

const GLIDE_MS = 400;
// cubic-bezier(0.16, 1, 0.3, 1): Explore's --ease-glide.
function glide(t: number) {
  const [x1, y1, x2, y2] = [0.16, 1, 0.3, 1];
  const bez = (p1: number, p2: number, s: number) => 3 * p1 * s * (1 - s) ** 2 + 3 * p2 * s ** 2 * (1 - s) + s ** 3;
  let lo = 0, hi = 1, s = t;
  for (let i = 0; i < 20; i++) {
    s = (lo + hi) / 2;
    if (bez(x1, x2, s) < t) lo = s;
    else hi = s;
  }
  return bez(y1, y2, s);
}

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function useTimelineScale(initial: View, bounds: View) {
  const [view, setView] = useState(initial);
  const viewRef = useRef(view);
  const motion = useRef<number | null>(null);
  const pendingZoom = useRef<{ anchor: number; factor: number } | null>(null);
  const frame = useRef<number | null>(null);

  const commit = useCallback((v: View) => {
    viewRef.current = v;
    setView(v);
  }, []);

  const stop = useCallback(() => {
    if (motion.current !== null) cancelAnimationFrame(motion.current);
    motion.current = null;
  }, []);

  /** Zoom by `factor` (> 1 out) around the time `anchor`; several calls in one frame add up. */
  const zoomAt = useCallback(
    (anchor: number, factor: number) => {
      stop();
      const p = pendingZoom.current;
      pendingZoom.current = { anchor, factor: (p?.factor ?? 1) * factor };
      if (frame.current !== null) return;
      frame.current = requestAnimationFrame(() => {
        frame.current = null;
        const z = pendingZoom.current;
        pendingZoom.current = null;
        if (z) commit(zoomAround(viewRef.current, z.anchor, z.factor, bounds));
      });
    },
    [bounds, commit, stop],
  );

  /** Move by `px` on a lane `width` wide (positive moves later in time). */
  const panPx = useCallback(
    (px: number, width: number) => {
      const v = viewRef.current;
      commit(panBy(v, (px / width) * (v.end - v.start), bounds));
    },
    [bounds, commit],
  );

  /** Keep moving after a drag, slowing each frame. `velocity` in px per ms. */
  const fling = useCallback(
    (velocity: number, width: number) => {
      stop();
      if (reducedMotion() || Math.abs(velocity) < 0.05) return;
      let v = velocity * 16;
      const step = () => {
        v *= 0.92;
        if (Math.abs(v) < 0.5) return (motion.current = null);
        panPx(v, width);
        motion.current = requestAnimationFrame(step);
      };
      motion.current = requestAnimationFrame(step);
    },
    [panPx, stop],
  );

  /** Glide to a view (presets, Today, Fit, paging). */
  const animateTo = useCallback(
    (target: View) => {
      stop();
      const from = viewRef.current;
      if (reducedMotion()) return commit(target);
      // Interpolate the span in log space so century → hour feels even.
      const [s0, s1] = [from.end - from.start, target.end - target.start];
      const [c0, c1] = [(from.start + from.end) / 2, (target.start + target.end) / 2];
      const t0 = performance.now();
      const step = (now: number) => {
        const k = glide(Math.min(1, (now - t0) / GLIDE_MS));
        const span = Math.exp(Math.log(s0) + (Math.log(s1) - Math.log(s0)) * k);
        commit(centredOn(c0 + (c1 - c0) * k, span, bounds));
        motion.current = k < 1 ? requestAnimationFrame(step) : null;
      };
      motion.current = requestAnimationFrame(step);
    },
    [bounds, commit, stop],
  );

  useEffect(
    () => () => {
      stop();
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    },
    [stop],
  );

  return { view, viewRef, zoomAt, panPx, fling, animateTo, stop };
}
