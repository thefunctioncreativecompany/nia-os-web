import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";

// Brand typefaces (BUILD_PLAN.md → Design rules). Applied on <html> in the root layout
// and exposed to Tailwind as font-sans, font-serif and font-mono in globals.css.

// Interface text.
export const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

// Kept as theme fonts but not used in the interface (Geist only, Ika 2026-10-19), so they
// aren't preloaded: the browser fetches one only if a page actually uses it.
export const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: "italic",
  variable: "--font-instrument-serif",
  preload: false,
});

// The screenplay preview's typewriter text (content formatting).
export const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  preload: false,
});
