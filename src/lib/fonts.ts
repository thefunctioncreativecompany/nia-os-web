import { DM_Sans } from "next/font/google";

// Brand typeface from Figma. Pair with [font-variation-settings:'opsz'_14] to match the designs.
export const dmSans = DM_Sans({
  subsets: ["latin"],
  axes: ["opsz"],
});
