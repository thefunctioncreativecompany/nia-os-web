"use client";

import { useEffect, useSyncExternalStore } from "react";

// Whether this person has Explore (NAVBAR_BUILD.md N4): worked out on the server with the user
// menu, streamed in, and kept here so the search hint never offers an Explore idea without it.
let access = false;
const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => (listeners.add(fn), () => void listeners.delete(fn));

/** Rendered by the signed-in layout beside the user menu. */
export function ExploreAccessFlag({ value }: { value: boolean }) {
  useEffect(() => {
    access = value;
    listeners.forEach((fn) => fn());
  }, [value]);
  return null;
}

export const useExploreAccess = () => useSyncExternalStore(subscribe, () => access, () => false);
