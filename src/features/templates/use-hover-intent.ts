"use client";

import { useEffect, useRef } from "react";

// Open something after the pointer rests on it (TEMPLATES_BUILD.md §5: 800 ms). Mouse only:
// touch and pen never trigger it, so phones and tablets open previews by tapping.
export function useHoverIntent(onIntent: (() => void) | undefined, delay = 800) {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const cancel = () => clearTimeout(timer.current);
  return {
    onPointerEnter: (e: React.PointerEvent) => {
      if (e.pointerType !== "mouse" || !onIntent) return;
      cancel();
      timer.current = setTimeout(onIntent, delay);
    },
    onPointerLeave: cancel,
    cancel,
  };
}
