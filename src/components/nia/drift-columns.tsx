"use client";

import { useState, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";
import { isMouse, pointerIn, useFrame } from "@/hooks/use-pointer";

// Columns of cards that drift apart as the pointer moves down them (Ika's Claude Designs: Explore's
// poster grid, Marketplace's Latest gear). Card i goes to column i % columns, so the order reads
// across. Each column moves by its own `drift` (pixels at the top or bottom edge, either way), odd
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
}: {
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
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
}) {
  const reduce = useReducedMotion();
  const [pointerY, setPointerY] = useState(0.5);
  const frame = useFrame();

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
              {items
                .filter((_, i) => i % drift.length === c)
                .map((item) => (
                  <div key={getKey(item)} className="contents">
                    {renderItem(item)}
                  </div>
                ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}
