import { DM_Sans } from "next/font/google";

// Brand typeface from Figma, used app-wide as --font-sans.
// The designs use the 14pt optical size; globals.css sets that on <body>.
export const dmSans = DM_Sans({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-sans",
});
