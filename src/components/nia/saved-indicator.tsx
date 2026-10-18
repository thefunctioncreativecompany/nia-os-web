"use client";

import { motion, useReducedMotion } from "motion/react";

import { DURATION, EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";

// "All changes saved ✓" beside a document's title (Figma: Call Sheet editor). Pass the
// time of the last save as `savedAt`; the tick pops in again each time it changes.
export function SavedIndicator({
  savedAt,
  className,
}: {
  savedAt?: number | string;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <p
      role="status"
      className={cn(
        "flex items-center gap-1.5 text-small leading-normal font-medium whitespace-nowrap text-muted-foreground",
        className,
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-nia-success" />
      All changes saved
      <motion.span
        key={savedAt}
        aria-hidden
        initial={reduceMotion ? false : { scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: DURATION.fast, ease: EASE_OUT }}
        className="inline-block"
      >
        ✓
      </motion.span>
    </p>
  );
}
