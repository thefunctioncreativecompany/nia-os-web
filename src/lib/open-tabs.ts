"use client";

import { useSyncExternalStore } from "react";

// Open tabs (Ika, 2026-10-20): projects and documents you've opened stay as tabs under the navbar
// so you can switch between them, like a browser. Remembered on this computer (localStorage),
// newest last, at most MAX; opening more drops the oldest.

export type OpenTab = { href: string; title: string; kind: "project" | "document" };

const KEY = "nia:open-tabs";
const MAX = 10;
const EMPTY: OpenTab[] = [];

let tabs: OpenTab[] | null = null;
const listeners = new Set<() => void>();

function read(): OpenTab[] {
  if (tabs) return tabs;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    tabs = Array.isArray(parsed) ? (parsed as OpenTab[]).filter((t) => t && typeof t.href === "string") : [];
  } catch {
    tabs = [];
  }
  return tabs;
}

function write(next: OpenTab[]) {
  tabs = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Private windows can refuse storage; the tabs still work until the page reloads.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another window of Nia changed the tabs.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    tabs = null;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useOpenTabs() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

/** Opens (or renames) a tab. Called by project and document pages when they show. */
export function openTab(tab: OpenTab) {
  const list = read();
  const at = list.findIndex((t) => t.href === tab.href);
  if (at >= 0) {
    if (list[at].title === tab.title) return;
    write(list.map((t, i) => (i === at ? tab : t)));
    return;
  }
  write([...list, tab].slice(-MAX));
}

/** Closes a tab; returns where to go if it was the one showing (its neighbour, or nowhere). */
export function closeTab(href: string): string | null {
  const list = read();
  const at = list.findIndex((t) => t.href === href);
  if (at < 0) return null;
  const next = list.filter((t) => t.href !== href);
  write(next);
  return next[at]?.href ?? next[at - 1]?.href ?? null;
}

/** Forgets a tab whose page no longer exists (deleted project or document). */
export function forgetTab(href: string) {
  const list = read();
  if (list.some((t) => t.href === href)) write(list.filter((t) => t.href !== href));
}
