"use client";

import { LazyMotion } from "framer-motion";

const features = () => import("@/lib/motion-features").then((m) => m.default);

// Animated elements are written as `m.div` (not `motion.div`): they draw at once and start
// animating when Motion's features arrive, a moment after the page. `strict` makes a stray
// `motion.div`, which would bring the whole library back into every page, an error.
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={features} strict>
      {children}
    </LazyMotion>
  );
}
