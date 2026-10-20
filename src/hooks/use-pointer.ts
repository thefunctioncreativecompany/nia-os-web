import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from "react";

// Shared helpers for things that follow the pointer (Explore, Templates, Marketplace). Reduced
// motion is always read with Motion's `useReducedMotion()`; pointer effects switch off under it.

// A mouse or trackpad: something that can point at things without pressing them.
export const FINE_POINTER = "(hover: hover) and (pointer: fine)";

// Whether a media query matches, kept up to date. False while the page is drawn on the server
// and on the first paint, so pointer-only effects switch on once the page is in the browser.
export function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false);
}

// Pointer effects follow a mouse only; a finger on a touch screen scrolls instead.
export const isMouse = (e: { pointerType: string }) => e.pointerType === "mouse";

// Where the pointer is inside the element handling the event: pixels from its top-left corner,
// and the same as fractions of its width and height (0 to 1).
export function pointerIn(e: React.PointerEvent<Element>) {
  const box = e.currentTarget.getBoundingClientRect();
  const x = e.clientX - box.left;
  const y = e.clientY - box.top;
  return { x, y, fx: x / box.width, fy: y / box.height };
}

// At most one update per screen refresh: `next(run)` replaces any update still waiting, and
// leaving the page cancels it.
export function useFrame() {
  const frame = useRef(0);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);
  return useMemo(
    () => ({
      next(run: () => void) {
        cancelAnimationFrame(frame.current);
        frame.current = requestAnimationFrame(run);
      },
      cancel() {
        cancelAnimationFrame(frame.current);
      },
    }),
    [],
  );
}
