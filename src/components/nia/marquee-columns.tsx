import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

// Columns of cards that scroll on their own, alternate columns the other way (Ika's Claude
// Design; the same look as Explore's press kits). Pointing at a column, or tabbing into it,
// pauses it and dims its other cards (cards add `group-hover/lane:opacity-45` themselves, or use
// `laneCardClass`). Each column repeats its cards so the loop has no seam; only the first set
// can be reached by keyboard or screen reader. Reduced motion stops the columns; phones get a
// plain two-column grid.
export const laneCardClass =
  "transition-[opacity,transform] duration-glide ease-glide sm:group-focus-within/lane:opacity-45 sm:group-hover/lane:opacity-45 sm:hover:scale-103 sm:hover:opacity-100! sm:focus-visible:opacity-100! motion-reduce:hover:scale-100";

// Each column holds its cards this many times: two halves, so sliding half its height loops
// without a seam, each half tall enough to fill the column.
const COPIES = 4;

export function MarqueeColumns<T>({
  items,
  getKey,
  renderCard,
  speeds,
  className,
}: {
  items: T[];
  getKey: (item: T) => string;
  renderCard: (item: T) => ReactNode;
  /** Seconds per loop for each column; there are as many columns as speeds. */
  speeds: number[];
  /** Height and gaps of the scrolling area (from `sm` up). */
  className?: string;
}) {
  if (!items.length) return null;
  const columns = speeds.length;
  const perColumn = Math.ceil(items.length / columns);

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-4 sm:flex sm:overflow-hidden sm:[mask-image:linear-gradient(transparent,black_8%,black_92%,transparent)]",
        className,
      )}
    >
      {speeds.map((speed, c) => {
        // Short of cards, the last columns borrow from the start (shown, not focusable twice).
        const slots = Array.from({ length: perColumn }, (_, k) => c * perColumn + k);
        return (
          <div key={c} className="group/lane contents sm:block sm:min-w-0 sm:flex-1 sm:overflow-hidden sm:px-1">
            <div
              style={{ animationDuration: `${speed}s` }}
              className={cn(
                "contents sm:flex sm:flex-col sm:gap-4 sm:pt-1 sm:pb-4 sm:group-focus-within/lane:[animation-play-state:paused] sm:group-hover/lane:[animation-play-state:paused]",
                c % 2 ? "sm:animate-lane-down" : "sm:animate-lane-up",
              )}
            >
              {Array.from({ length: COPIES }, (_, copy) => (
                <div key={copy} className="contents sm:flex sm:flex-col sm:gap-4">
                  {slots.map((slot) => {
                    const item = items[slot % items.length];
                    const repeat = copy > 0 || slot >= items.length;
                    return (
                      <div
                        key={`${slot}-${getKey(item)}`}
                        aria-hidden={repeat || undefined}
                        inert={repeat}
                        className={cn("flex flex-col", repeat && "max-sm:hidden")}
                      >
                        {renderCard(item)}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
