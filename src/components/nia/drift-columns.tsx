"use client";

import { useState, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";
import { isMouse, pointerIn, useFrame } from "@/hooks/use-pointer";

// Columns of cards that drift apart as the pointer moves down them (Ika's Claude Designs: Explore's
// poster grid, Marketplace's Latest gear). Card i goes to column i % columns, so the order reads
// across; with `getAspect` (cards of mixed shapes, Ika 2026-11-08), each card goes into the
// shortest column so far instead, so the columns stay level. Each column moves by its own `drift` (pixels at the top or bottom edge, either way), odd
// columns sit `oddOffset` higher. Wide screens only; phones and tablets get a plain grid of the
// same cards. Reduced motion keeps the columns still (the odd offset stays).
export function DriftColumns<T>({
  items,
  getKey,
  renderItem,
  drift,
  oddOffset = 0,
  label,
  className,
  gridClassName,
  columnClassName,
  getAspect,
}: {
  items: T[];
  getKey: (item: T) => string;
  /** `index` is the item's place in `items`, e.g. to load the first pictures first. */
  renderItem: (item: T, index: number) => ReactNode;
  /** One entry per column: how far it drifts, in pixels. */
  drift: number[];
  oddOffset?: number;
  label: string;
  /** The area that follows the pointer (height, overflow). */
  className?: string;
  /** The grid on phones and tablets (columns, gaps). */
  gridClassName?: string;
  /** Gaps inside each column on wide screens. */
  columnClassName?: string;
  /** Each card's picture shape (width ÷ height), when the cards differ. */
  getAspect?: (item: T) => number;
}) {
  const reduce = useReducedMotion();
  const [pointerY, setPointerY] = useState(0.5);
  const frame = useFrame();
  // Which column each card goes in: in turn, or the shortest so far (a card's height in column
  // widths: its picture, plus about a third for its lines of text).
  const columnOf: number[] = [];
  const heights = drift.map(() => 0);
  items.forEach((item, i) => {
    if (!getAspect) return void columnOf.push(i % drift.length);
    const c = heights.indexOf(Math.min(...heights));
    columnOf.push(c);
    heights[c] += 1 / getAspect(item) + 0.35;
  });

  const onMove = (e: React.PointerEvent<HTMLElement>) => {
    if (reduce || !isMouse(e)) return;
    const y = pointerIn(e).fy;
    frame.next(() => setPointerY(y));
  };
  const onLeave = () => {
    frame.cancel();
    setPointerY(0.5);
  };

  return (
    <section aria-label={label} onPointerMove={onMove} onPointerLeave={onLeave} className={className}>
      <div className={cn("grid lg:flex lg:items-start", gridClassName)}>
        {drift.map((d, c) => {
          const y = (reduce ? 0 : (pointerY - 0.5) * d) + (c % 2 ? oddOffset : 0);
          return (
            <div
              key={c}
              style={{ transform: `translate3d(0, ${y.toFixed(1)}px, 0)` }}
              className={cn("contents lg:flex lg:min-w-0 lg:flex-1 lg:flex-col lg:transition-transform lg:duration-drift lg:ease-glide", columnClassName)}
            >
              {items.map((item, i) =>
                columnOf[i] === c ? (
                  <div key={getKey(item)} className="contents">
                    {renderItem(item, i)}
                  </div>
                ) : null,
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
