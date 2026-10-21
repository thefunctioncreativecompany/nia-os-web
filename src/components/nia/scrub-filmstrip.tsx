"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";
import { FINE_POINTER, isMouse, pointerIn, useFrame, useMediaQuery } from "@/hooks/use-pointer";

type Layout = { width: number; track: number; centres: number[] };

// How cards away from the middle step back. "card": Templates (shrink, drop and fade). "reel":
// Explore's filmstrip (Ika's Claude Design "05 · Filmstrip scrub"): shrink and drop further and
// darken instead of fading, with the middle title large under the strip.
const LOOKS = {
  card: { reach: 0.6, drop: 24, scale: 0.86, dim: (k: number) => ({ opacity: Number((0.45 + 0.55 * k).toFixed(2)) }) },
  reel: { reach: 0.55, drop: 40, scale: 0.84, dim: (k: number) => ({ filter: `brightness(${(0.4 + 0.6 * k).toFixed(2)})` }) },
} as const;

// A row of cards the pointer scrubs through (Ika's Claude Design "Templates", 2026-10-20):
// moving across the strip slides the whole row from first card to last; the card nearest the
// middle comes forward and the rest shrink, drop and fade. Tabbing to a card brings it to the
// middle. Under it, "03 / 06", the focused card's footer text and a progress bar. Phones, touch
// screens and reduced motion get a plain row to swipe.
// `control="arrows"` (Explore's Made in Africa, Ika 2026-10-21): no scrubbing; it starts on the
// first card, and arrows at the left and right edges (or the arrow keys) step one card at a time,
// the chosen card forward and the row sliding to keep it in view. Phones get the plain row.
export function ScrubFilmstrip<T>({
  items,
  getKey,
  renderCard,
  footer,
  start = 0.2,
  look = "card",
  control = "scrub",
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
  look?: keyof typeof LOOKS;
  control?: "scrub" | "arrows";
  label: string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLUListElement>(null);
  const frame = useFrame();
  // Scrubbing needs a mouse and room for it; arrows need only room.
  const finePointer = useMediaQuery(`${FINE_POINTER} and (min-width: 48rem)`);
  const wide = useMediaQuery("(min-width: 48rem)");
  const step = control === "arrows" && wide;
  const scrub = control === "scrub" && finePointer && !reduce;
  const moving = scrub || step;
  const [layout, setLayout] = useState<Layout | null>(null);
  const [x, setX] = useState(start);
  const [active, setActive] = useState(0);

  useLayoutEffect(() => {
    const el = box.current;
    const row = track.current;
    if (!moving || !el || !row) return;
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
  }, [moving, items.length]);

  const overflow = layout ? Math.max(0, layout.track - layout.width) : 0;
  // Arrows: the chosen card in the middle where the row allows (the first starts at the left).
  const offset = step && layout ? Math.min(0, Math.max(-overflow, layout.width / 2 - layout.centres[active])) : -x * overflow;
  // How far each card's centre is from the middle of the strip (arrows: from the chosen card).
  const distances = items.map((_, i) =>
    layout ? Math.abs(step ? layout.centres[i] - layout.centres[active] : layout.centres[i] + offset - layout.width / 2) : 0,
  );
  const best = step ? active : distances.reduce((closest, d, i) => (d < distances[closest] ? i : closest), 0);
  const go = (i: number) => setActive(Math.min(items.length - 1, Math.max(0, i)));
  const style = LOOKS[look];
  const looks = distances.map((distance) => {
    if (!moving || !layout) return undefined;
    const k = Math.max(0, 1 - distance / (layout.width * style.reach));
    return { transform: `translateY(${((1 - k) * style.drop).toFixed(1)}px) scale(${(style.scale + (1 - style.scale) * k).toFixed(3)})`, ...style.dim(k) };
  });

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!scrub || !isMouse(e)) return;
    const next = Math.min(1, Math.max(0, pointerIn(e).fx));
    frame.next(() => setX(next));
  };

  // Focus mirrors the pointer: bring the focused card to the middle.
  const focusCard = (i: number) => {
    if (step) return go(i);
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
          if (moving) e.currentTarget.scrollLeft = 0;
        }}
        onKeyDown={(e) => {
          if (!step) return;
          if (e.key === "ArrowRight") go(active + 1);
          else if (e.key === "ArrowLeft") go(active - 1);
        }}
        className={cn("relative py-6", moving ? "overflow-hidden" : "snap-x snap-mandatory overflow-x-auto [scrollbar-width:none]")}
      >
        <ul
          ref={track}
          aria-label={label}
          style={moving ? { transform: `translateX(${offset.toFixed(1)}px)` } : undefined}
          className={cn("flex w-max gap-5", moving && "transition-transform duration-track ease-glide motion-reduce:transition-none")}
        >
          {items.map((item, i) => (
            <li
              key={getKey(item)}
              onFocusCapture={() => focusCard(i)}
              style={looks[i]}
              className={cn("flex-none snap-start", moving && "transition-[transform,opacity,filter] duration-settle ease-glide motion-reduce:transition-none")}
            >
              {renderCard(item, i)}
            </li>
          ))}
        </ul>
        {step && (
          <>
            <StripArrow side="left" disabled={active === 0} onClick={() => go(active - 1)} label={`Previous: ${active > 0 ? footer(items[active - 1]) : ""}`} />
            <StripArrow side="right" disabled={active === items.length - 1} onClick={() => go(active + 1)} label={`Next: ${active < items.length - 1 ? footer(items[active + 1]) : ""}`} />
          </>
        )}
      </div>
      {moving && items.length > 0 && (
        <div className={cn("flex items-center gap-4 border-t border-border", look === "reel" ? "pt-3" : "pt-2")}>
          <span className="text-small font-semibold text-foreground">
            {pad(best + 1)} / {pad(items.length)}
          </span>
          <span className={cn("min-w-0 truncate", look === "reel" ? "text-h3 font-semibold tracking-tight text-foreground" : "text-small text-muted-foreground")}>{footer(items[best])}</span>
          <span className="flex-1" />
          <span aria-hidden className={cn("relative h-0.5 shrink-0 bg-border", look === "reel" ? "w-90 max-w-[30%] rounded-full" : "w-55")}>
            <span
              className={cn("absolute inset-y-0 left-0 transition-[width] duration-glide ease-glide", look === "reel" ? "rounded-full bg-gold" : "bg-foreground")}
              style={{ width: `${(((best + 1) / items.length) * 100).toFixed(1)}%` }}
            />
          </span>
        </div>
      )}
    </div>
  );
}

// The arrows at the strip's left and right edges (Ika, 2026-10-21).
function StripArrow({ side, disabled, onClick, label }: { side: "left" | "right"; disabled: boolean; onClick: () => void; label: string }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "absolute top-1/2 z-10 flex size-12 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white/95 text-foreground shadow-elevation-2 outline-none transition-[opacity,background-color] duration-fast hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-0",
        side === "left" ? "left-2" : "right-2",
      )}
    >
      <Icon aria-hidden className="size-5" />
    </button>
  );
}
