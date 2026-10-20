"use client";

import { useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";
import { isMouse, pointerIn, useFrame } from "@/hooks/use-pointer";

const MAX_TILT = 8;

// Rows you point along (Ika's Claude Design, used by Templates; the same look as Explore's
// director's notes). Pointing at a row brings it forward and greys the others; with
// `previewFollowsCursor`, a preview follows the pointer and leans with its speed. Rows put
// `group-hover/row` and `group-focus-visible/row` on what should move (the name sliding right,
// the action appearing). Keyboard focus, and reduced motion, show the preview beside the row.
// Phones and tablets don't get the preview.
export function RankedList<T>({
  items,
  getKey,
  getLabel,
  renderRow,
  onSelect,
  renderPreview,
  previewFollowsCursor = false,
  previewClassName,
  offset = { x: 40, y: -130 },
  header,
  className,
  rowClassName,
}: {
  items: T[];
  getKey: (item: T) => string;
  /** What a screen reader says for the row. */
  getLabel: (item: T) => string;
  renderRow: (item: T, index: number) => ReactNode;
  onSelect: (item: T) => void;
  renderPreview?: (item: T) => ReactNode;
  previewFollowsCursor?: boolean;
  /** Size and shape of the preview box. */
  previewClassName?: string;
  /** Where the preview sits from the pointer, in pixels. */
  offset?: { x: number; y: number };
  header?: ReactNode;
  /** The list's own layout (a column by default; a grid for compact lists). */
  className?: string;
  rowClassName?: string;
}) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState<number | null>(null);
  const preview = useRef<HTMLDivElement>(null);
  const lastX = useRef<number | null>(null);
  const frame = useFrame();
  const follows = previewFollowsCursor && !!renderPreview;

  const place = (x: number, y: number, tilt = 0) => {
    if (preview.current) preview.current.style.transform = `translate(${x}px, ${y}px) rotate(${tilt}deg)`;
  };

  const onMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!follows || reduce || !isMouse(e)) return;
    const { x, y } = pointerIn(e);
    const speed = lastX.current === null ? 0 : x - lastX.current;
    lastX.current = x;
    const tilt = Math.max(-MAX_TILT, Math.min(MAX_TILT, speed * 0.4));
    frame.next(() => place(x + offset.x, y + offset.y, tilt));
  };

  // Beside the row instead of the pointer: keyboard focus, or reduced motion.
  const placeBeside = (row: HTMLElement) =>
    place(row.offsetLeft + row.offsetWidth * 0.55, row.offsetTop + row.offsetHeight / 2 + offset.y);

  return (
    <div
      onPointerMove={onMove}
      onPointerLeave={() => {
        lastX.current = null;
        setActive(null);
      }}
      className="relative"
    >
      {header}
      <ul
        className={cn("group/list", className)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setActive(null);
        }}
      >
        {items.map((item, i) => (
          <li key={getKey(item)}>
            <button
              type="button"
              onClick={() => onSelect(item)}
              onPointerEnter={(e) => {
                if (!isMouse(e)) return;
                setActive(i);
                if (reduce) placeBeside(e.currentTarget);
              }}
              onFocus={(e) => {
                if (!e.currentTarget.matches(":focus-visible")) return;
                setActive(i);
                placeBeside(e.currentTarget);
              }}
              aria-label={getLabel(item)}
              className={cn(
                "group/row flex w-full items-center text-left text-foreground outline-none transition-colors duration-base ease-out focus-visible:ring-3 focus-visible:ring-ring/50 group-focus-within/list:text-nia-placeholder group-hover/list:text-nia-placeholder hover:text-foreground! focus-visible:text-foreground!",
                rowClassName,
              )}
            >
              {renderRow(item, i)}
            </button>
          </li>
        ))}
      </ul>

      {follows && (
        <div
          ref={preview}
          aria-hidden
          className={cn(
            "pointer-events-none absolute top-0 left-0 z-10 overflow-hidden shadow-card-hover transition-[transform,opacity] duration-glide ease-glide max-lg:hidden",
            active === null ? "opacity-0" : "opacity-100",
            previewClassName,
          )}
        >
          {active !== null && renderPreview?.(items[active])}
        </div>
      )}
    </div>
  );
}
