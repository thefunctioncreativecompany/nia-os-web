"use client";

import { useEffect, useSyncExternalStore } from "react";

// Which of Home's right-hand panels is open (Ika, 2026-11-19: "view all activity and upcoming
// schedule can open on right panel"). One at a time: opening one closes the other.

export type HomePanel = "activity" | "schedule";

let open: HomePanel | null = null;
const listeners = new Set<() => void>();

export function setHomePanel(next: HomePanel | null) {
  open = next;
  for (const l of listeners) l();
}

/** The open panel; leaving Home (opening a project from a panel) closes it. */
export function useHomePanel(): HomePanel | null {
  useEffect(() => () => setHomePanel(null), []);
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => void listeners.delete(l);
    },
    () => open,
    () => null,
  );
}
