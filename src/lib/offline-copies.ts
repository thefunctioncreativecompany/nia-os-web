"use client";

import { useEffect, useSyncExternalStore } from "react";

// Documents readable offline (FEEDBACK D5, Ika 2026-11-25). The work happens in the service
// worker (public/sw.js); these are the page's side of it. Live site only: in development the
// worker would hold on to old files between edits.

const DOCS = "nia-docs-v1";
const enabled = () => process.env.NODE_ENV === "production" && typeof navigator !== "undefined" && "serviceWorker" in navigator;

/** Starts the service worker (mounted once in the app shell). */
export function OfflineCopies() {
  useEffect(() => {
    if (enabled()) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);
  return null;
}

/** Keeps a copy of this document on this computer, as it is on the server now. */
export function saveOfflineCopy(title: string, project: string | null) {
  if (!enabled()) return;
  void navigator.serviceWorker.ready.then((reg) => reg.active?.postMessage({ type: "save", url: location.href, title, project }));
}

/** Log out: the copies go too (a shared computer shouldn't keep someone's call sheets). */
export async function clearOfflineCopies() {
  if (typeof caches === "undefined") return;
  try {
    await caches.delete(DOCS);
    if (enabled()) (await navigator.serviceWorker.getRegistration())?.active?.postMessage({ type: "clear" });
  } catch {}
}

const noChange = () => () => {};
const copyTime = () => document.querySelector<HTMLMetaElement>('meta[name="nia-offline-copy"]')?.content ?? "";

/** When this page is the offline copy, the time it was saved (ms); otherwise null. Reloads the
 *  live page as soon as the connection is back. */
export function useOfflineCopy(): number | null {
  const saved = useSyncExternalStore(noChange, copyTime, () => "");
  useEffect(() => {
    if (!saved) return;
    const back = () => location.reload();
    window.addEventListener("online", back);
    return () => window.removeEventListener("online", back);
  }, [saved]);
  return saved ? Number(saved) || 0 : null;
}

export type OfflineCopy = { href: string; title: string; project: string | null; savedAt: number };

/** The documents saved on this computer, newest first (the /offline page). */
export async function listOfflineCopies(): Promise<OfflineCopy[]> {
  if (typeof caches === "undefined") return [];
  try {
    const docs = await caches.open(DOCS);
    const list = await Promise.all(
      (await docs.keys()).map(async (req) => {
        const h = (await docs.match(req))?.headers;
        const read = (k: string) => (h?.get(k) ? decodeURIComponent(h.get(k)!) : null);
        const url = new URL(req.url);
        return { href: url.pathname + url.search, title: read("x-nia-title") ?? "Document", project: read("x-nia-project"), savedAt: Number(h?.get("x-nia-saved")) || 0 };
      }),
    );
    return list.sort((a, b) => b.savedAt - a.savedAt);
  } catch {
    return [];
  }
}

/** "7:42" today, "24 Nov, 7:42" before. */
export function savedTime(ms: number) {
  const d = new Date(ms);
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return d.toDateString() === new Date().toDateString() ? time : `${d.toLocaleDateString(undefined, { day: "numeric", month: "short" })}, ${time}`;
}
