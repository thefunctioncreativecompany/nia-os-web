import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";

// Brand typefaces (BUILD_PLAN.md → Design rules). Applied on <html> in the root layout
// and exposed to Tailwind as font-sans, font-serif and font-mono in globals.css.

// Interface text.
export const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

// Accent headings only, always italic.
export const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: "italic",
  variable: "--font-instrument-serif",
});

// Numbers and code.
export const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});
