"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

type Layout = { width: number; track: number; centres: number[] };

// A row of cards the pointer scrubs through (Ika's Claude Design "Templates", 2026-10-20):
// moving across the strip slides the whole row from first card to last; the card nearest the
// middle comes forward and the rest shrink, drop and fade. Tabbing to a card brings it to the
// middle. Under it, "03 / 06", the focused card's footer text and a progress bar. Phones, touch
// screens and reduced motion get a plain row to swipe.
export function ScrubFilmstrip<T>({
  items,
  getKey,
  renderCard,
  footer,
  start = 0.2,
  label,
  className,
}: {
  items: T[];
  getKey: (item: T) => string;
  /** The card itself (a button or link); the strip only moves it. */
  renderCard: (item: T, index: number) => ReactNode;
  /** Footer text for the card in the middle. */
  footer: (item: T) => string;
  /** Where the row rests before the pointer arrives (0 = first card, 1 = last). */
  start?: number;
  label: string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLUListElement>(null);
  const frame = useRef(0);
  const [scrub, setScrub] = useState(false);
  const [layout, setLayout] = useState<Layout | null>(null);
  const [x, setX] = useState(start);

  // Scrubbing needs a mouse and room for it.
  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 48rem)");
    const update = () => setScrub(query.matches && !reduce);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [reduce]);

  useLayoutEffect(() => {
    const el = box.current;
    const row = track.current;
    if (!scrub || !el || !row) return;
    const measure = () =>
      setLayout({
        width: el.clientWidth,
        track: row.scrollWidth,
        centres: [...row.children].map((c) => (c as HTMLElement).offsetLeft + (c as HTMLElement).offsetWidth / 2),
      });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [scrub, items.length]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const overflow = layout ? Math.max(0, layout.track - layout.width) : 0;
  const offset = -x * overflow;
  // How far each card's centre is from the middle of the strip.
  const distances = items.map((_, i) => (layout ? Math.abs(layout.centres[i] + offset - layout.width / 2) : 0));
  const best = distances.reduce((closest, d, i) => (d < distances[closest] ? i : closest), 0);
  const looks = distances.map((distance) => {
    if (!scrub || !layout) return undefined;
    const k = Math.max(0, 1 - distance / (layout.width * 0.6));
    return { transform: `translateY(${((1 - k) * 24).toFixed(1)}px) scale(${(0.86 + 0.14 * k).toFixed(3)})`, opacity: Number((0.45 + 0.55 * k).toFixed(2)) };
  });

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!scrub || e.pointerType !== "mouse") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const next = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => setX(next));
  };

  // Focus mirrors the pointer: bring the focused card to the middle.
  const focusCard = (i: number) => {
    if (!scrub || !layout || !overflow) return;
    setX(Math.min(1, Math.max(0, (layout.centres[i] - layout.width / 2) / overflow)));
  };

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className={className}>
      <div
        ref={box}
        onPointerMove={onMove}
        // Tabbing makes the browser scroll a clipped row to the card; the strip moves it instead.
        onScroll={(e) => {
          if (scrub) e.currentTarget.scrollLeft = 0;
        }}
        className={cn("relative py-6", scrub ? "overflow-hidden" : "snap-x snap-mandatory overflow-x-auto [scrollbar-width:none]")}
      >
        <ul
          ref={track}
          aria-label={label}
          style={scrub ? { transform: `translateX(${offset.toFixed(1)}px)` } : undefined}
          className={cn("flex w-max gap-5", scrub && "transition-transform duration-track ease-glide")}
        >
          {items.map((item, i) => (
            <li
              key={getKey(item)}
              onFocusCapture={() => focusCard(i)}
              style={looks[i]}
              className={cn("flex-none snap-start", scrub && "transition-[transform,opacity] duration-settle ease-glide")}
            >
              {renderCard(item, i)}
            </li>
          ))}
        </ul>
      </div>
      {scrub && items.length > 0 && (
        <div className="flex items-center gap-4 border-t border-border pt-2">
          <span className="text-small font-semibold text-foreground">
            {pad(best + 1)} / {pad(items.length)}
          </span>
          <span className="min-w-0 truncate text-small text-muted-foreground">{footer(items[best])}</span>
          <span className="flex-1" />
          <span aria-hidden className="relative h-0.5 w-55 shrink-0 bg-border">
            <span
              className="absolute inset-y-0 left-0 bg-foreground transition-[width] duration-glide ease-glide"
              style={{ width: `${(((best + 1) / items.length) * 100).toFixed(1)}%` }}
            />
          </span>
        </div>
      )}
    </div>
  );
}
