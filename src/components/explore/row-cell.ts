// A row cell's width, the same in every Explore row (Top 10, categories, Made in Africa, Creators,
// press kits): a share of the row, times the card's `--span` (cardSpan in title-card.tsx: a wide
// film's card is wider so it stands as tall as the posters beside it). On wide desktop screens the
// share shrinks (2xl from 1536px, 3xl from 1920px) so a row shows more cards instead of growing
// each one (1920px showed four posters of 335px, 2560px would have shown 450px).
export const ROW_CELL =
  "w-[calc(44%*var(--span,1))] flex-none snap-start sm:w-[calc(30%*var(--span,1))] md:w-[calc(22%*var(--span,1))] lg:w-[calc(18%*var(--span,1))] 2xl:w-[calc(15%*var(--span,1))] 3xl:w-[calc(12%*var(--span,1))]";

/** `sizes` for a poster in a ROW_CELL, so the browser fetches the width it shows. */
export const ROW_SIZES = "(min-width: 120rem) 12vw, (min-width: 96rem) 15vw, (min-width: 64rem) 18vw, (min-width: 40rem) 30vw, 44vw";
