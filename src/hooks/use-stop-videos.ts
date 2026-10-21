"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";

// Stops any video playing inside `box` when the page is left. Next keeps the last few pages alive
// but hidden (React Activity, so Back is instant), and a hidden page's player would otherwise keep
// playing. Hiding runs this cleanup: the player is cut off at once and `onStop` puts the
// thumbnail back for when the page shows again (Next's "Preserving UI state" guide).
// Use it in the component that holds the playing state, which mounts before anything plays.
export function useStopVideosWhenHidden(box: RefObject<HTMLElement | null>, onStop: () => void) {
  const stop = useRef(onStop);
  useLayoutEffect(() => {
    stop.current = onStop;
  });
  useLayoutEffect(() => {
    const el = box.current;
    return () => {
      el?.querySelectorAll("iframe").forEach((frame) => frame.setAttribute("src", "about:blank"));
      stop.current();
    };
  }, [box]);
}
