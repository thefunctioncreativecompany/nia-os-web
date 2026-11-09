// Nia's theme values for the films, from the web app's themes (src/app/globals.css): neutral
// greys and Nia Blue as the one accent (Ika, 2026-10-31: no Obsidian or Aged Gold anywhere).
// Films use these names only; see alpha() below for see-through versions.
export const theme = {
  /** Dark mode: the background, a deeper film canvas under it, and the text on them. */
  bg: "#1f1f1f",
  bgDeep: "#141414",
  text: "#e6e6e6",
  muted: "#a0a0a0",
  /** Nia Blue (dark mode), for indicators, borders and tints only. */
  blue: "#3794ff",
  /** Light mode: the text on white, its muted grey, and Nia Blue. */
  ink: "#1f1f1f",
  mutedOnLight: "#6b6b6b",
  blueOnLight: "#005fb8",
  white: "#ffffff",
  /** For shadows and vignettes. */
  black: "#000000",
  line: "rgba(255, 255, 255, 0.1)",
  panel: "rgba(38, 38, 38, 0.86)",
  radius: { md: 8, lg: 12, xl: 16, "2xl": 22 },
  font: "Geist, system-ui, sans-serif",
};

/** A theme color made see-through: alpha(theme.blue, 0.12) → "rgba(55, 148, 255, 0.12)". */
export function alpha(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}
