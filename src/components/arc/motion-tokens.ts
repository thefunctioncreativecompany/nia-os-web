import { DURATION, EASE_OUT } from "@/lib/motion";

// Motion settings shared by the uiarc components in this folder, tuned to Nia's motion rules:
// fast 150ms, base 250ms, slow 400ms, ease-out, no overshoot (CLAUDE.md → Design → Motion).
// The names stay as uiarc expects them so the components work unchanged.
const ease = [...EASE_OUT] as [number, number, number, number];

export const motionTokens = {
  duration: { instant: DURATION.fast, fast: DURATION.fast, exit: DURATION.fast, standard: DURATION.base, considered: DURATION.slow },
  ease: { enter: ease, exit: ease, standard: ease, inOut: ease },
  spring: {
    responsive: { type: "spring", visualDuration: DURATION.base, bounce: 0 },
    gentle: { type: "spring", visualDuration: DURATION.slow, bounce: 0 },
    /** Presses, toggles and small indicators. */
    snappy: { type: "spring", visualDuration: DURATION.base, bounce: 0 },
    /** Panels, height changes and layout shifts. */
    smooth: { type: "spring", visualDuration: DURATION.slow, bounce: 0 },
    /** Shape changes, such as the search icon growing into a field. */
    morph: { type: "spring", visualDuration: DURATION.slow, bounce: 0 },
  },
  /** Stagger steps in seconds. Keep total stagger under roughly 0.4s. */
  stagger: { char: 0.016, word: 0.04, line: 0.08, item: 0.035 },
  /** Blur radii in px for brief content crossfades. */
  blur: { subtle: 2, soft: 4, text: 8 },
} as const;
