import type { CSSProperties } from "react";

// Reference cards' size (Ika, 2026-11-15: "portrait size cards (similar to what's on explore) …
// horizontal images stay full size with height of portrait image … the general case"): 13rem at
// Explore's poster shape; a wider picture keeps its shape at the same height, so its card widens
// (on phones it stops at 85% of the screen). Used by a template's reference cards (card-row.tsx)
// and the project Overview's references.

/** Explore's poster shape (title-card.tsx). */
export const POSTER = 268 / 373;

/** A card's width for a picture of this shape (width ÷ height); portrait or unknown: a poster. */
export const posterSpan = (shape?: number | null) => ({ "--span": Math.max(POSTER, shape || POSTER) / POSTER }) as CSSProperties;

/** The card: put `posterSpan(shape)` in its style. */
export const POSTER_CARD = "group/card flex w-[calc(13rem*var(--span,1))] max-w-[85vw] shrink-0 snap-start flex-col gap-2.5 rounded-xl transition-opacity duration-fast print:break-inside-avoid";

/** Where a row of these puts its arrows: the middle of the pictures (ScrollRow's padding + half a poster). */
export const POSTER_ARROWS = `calc(0.5rem + 13rem / ${POSTER} / 2)`;
