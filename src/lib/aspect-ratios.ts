// Frame shapes (Ika, 2026-10-22): films, stills and posters show at their true shape everywhere,
// never squeezed into another's frame, because DPs, directors and creative directors choose a
// look by its shape. This is the list of standard shapes, and the rule that names a picture's
// shape from its width and height. Use it wherever work is added, published or uploaded, so a
// 4:3 film is never shown as 9:16 or the other way round.

export type AspectRatio = {
  /** As written on a call sheet or camera report: "16:9", "2.39:1". */
  label: string;
  /** Width ÷ height. */
  value: number;
  /** What it's known as, and where it's used. */
  name: string;
};

/** Standard shapes, tallest to widest. */
export const ASPECT_RATIOS: AspectRatio[] = [
  { label: "9:16", value: 9 / 16, name: "Vertical: reels, stories, TikTok" },
  { label: "2:3", value: 2 / 3, name: "Portrait: posters, 35mm stills" },
  { label: "3:4", value: 3 / 4, name: "Portrait: medium format stills" },
  { label: "4:5", value: 4 / 5, name: "Portrait feed: Instagram posts" },
  { label: "1:1", value: 1, name: "Square" },
  { label: "5:4", value: 5 / 4, name: "Large format stills" },
  { label: "4:3", value: 4 / 3, name: "Full frame: classic TV, 16mm" },
  { label: "1.37:1", value: 1.37, name: "Academy: classic cinema" },
  { label: "1.43:1", value: 1.43, name: "IMAX film" },
  { label: "3:2", value: 3 / 2, name: "35mm stills, VistaVision" },
  { label: "1.66:1", value: 1.66, name: "European widescreen" },
  { label: "16:9", value: 16 / 9, name: "HD widescreen: TV, streaming, YouTube" },
  { label: "1.85:1", value: 1.85, name: "Flat widescreen: cinema" },
  { label: "1.90:1", value: 1.9, name: "DCI full container, IMAX digital" },
  { label: "2:1", value: 2, name: "Univisium: streaming series" },
  { label: "2.20:1", value: 2.2, name: "70mm" },
  { label: "2.39:1", value: 2.39, name: "Anamorphic scope: cinema" },
  { label: "2.76:1", value: 2.76, name: "Ultra Panavision 70" },
];

/** How close a measured shape must be to a standard one to take its name (2%, which covers a
 * thumbnail's rounding and a pixel or two of edge). */
const TOLERANCE = 0.02;

export type RecognizedAspect = {
  /** Width ÷ height: the standard value when recognised, else as measured. */
  value: number;
  /** "16:9", or the measured shape written as "1.55:1" when no standard one is close. */
  label: string;
  /** The standard shape, when recognised. */
  standard: AspectRatio | null;
};

/** Names a picture's shape from its width and height (or a measured width ÷ height). */
export function recognizeAspect(width: number, height = 1): RecognizedAspect {
  const measured = width / height;
  let best: AspectRatio | null = null;
  let gap = Infinity;
  for (const r of ASPECT_RATIOS) {
    const d = Math.abs(measured - r.value) / r.value;
    if (d < gap) [best, gap] = [r, d];
  }
  if (best && gap <= TOLERANCE) return { value: best.value, label: best.label, standard: best };
  return { value: measured, label: `${measured.toFixed(2)}:1`, standard: null };
}
