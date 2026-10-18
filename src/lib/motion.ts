// Motion tokens for animations written in code (Framer Motion), matching the
// duration-fast / -base / -slow utilities in globals.css. Seconds, as Motion expects.
export const DURATION = {
  fast: 0.15, // taps, hovers
  base: 0.25, // panels, modals
  slow: 0.4, // page changes
} as const;

// Ease-out for things entering the screen.
export const EASE_OUT = [0, 0, 0.2, 1] as const;
