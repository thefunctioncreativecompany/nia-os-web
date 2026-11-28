"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { noticeFor, type NoticeRow } from "@/lib/notice-rules";

// Desktop notifications (FEEDBACK D6, Ika 2026-11-25): the computer shows when someone shares a
// project with you, comments or asks for access; since 2026-11-27 also new documents, being added
// to a cast or crew, and changes to shoot dates, deliverables or budget (which ones: notice-rules.ts).
// Other edits stay in Updates. A choice
// for this device (Settings → General), on only once the browser allows it.
// Step 2: where the browser can, this computer also gets them when Nia is closed. Turning on gives
// Nia the browser's address for notices (a push subscription, saved for this person); the server
// sends each notice there (lib/push.ts) and the service worker shows it (public/sw.js). Off, or Log
// out, takes the address away. Where that's not possible, the open page shows them itself.

const KEY = "nia-desktop-notices";
const PUSH_KEY = "nia-push";
const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const listeners = new Set<() => void>();
const changed = () => listeners.forEach((l) => l());

export const desktopNoticesSupported = () => typeof window !== "undefined" && "Notification" in window;

/** "on", "off", or "blocked" (the browser said no; only its site settings can undo that). */
export type NoticeState = "on" | "off" | "blocked";
export function desktopNotices(): NoticeState {
  if (!desktopNoticesSupported()) return "off";
  if (Notification.permission === "denied") return "blocked";
  try {
    return Notification.permission === "granted" && localStorage.getItem(KEY) === "on" ? "on" : "off";
  } catch {
    return "off";
  }
}

export function subscribeDesktopNotices(listener: () => void) {
  listeners.add(listener);
  // The browser's permission can change in its own settings.
  const onFocus = () => listener();
  window.addEventListener("focus", onFocus);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("focus", onFocus);
  };
}

/** Notices can reach this computer with Nia closed: the live site, a browser with push, keys set. */
export const pushAvailable = () =>
  process.env.NODE_ENV === "production" && !!VAPID && typeof navigator !== "undefined" && "serviceWorker" in navigator && typeof window !== "undefined" && "PushManager" in window;

const pushSaved = () => {
  try {
    return localStorage.getItem(PUSH_KEY) === "on";
  } catch {
    return false;
  }
};
const remember = (on: boolean) => {
  try {
    localStorage.setItem(PUSH_KEY, on ? "on" : "off");
  } catch {}
};

function keyBytes(base64url: string) {
  const raw = atob(base64url.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (base64url.length % 4)) % 4));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}
const sameKey = (a: ArrayBuffer | null | undefined, b: Uint8Array) => !!a && new Uint8Array(a).every((x, i) => x === b[i]) && a.byteLength === b.length;

/** Gives Nia this browser's address for notices, for the signed-in person. True when saved.
 *  One at a time: turning on and the page opening both ask, and two at once made two addresses. */
let starting: Promise<boolean> | null = null;
function startPush(): Promise<boolean> {
  starting ??= savePush().finally(() => {
    starting = null;
  });
  return starting;
}

async function savePush(): Promise<boolean> {
  if (!pushAvailable() || Notification.permission !== "granted") return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    const key = keyBytes(VAPID);
    let sub = await reg.pushManager.getSubscription();
    // Made with other keys (they were changed): start again.
    if (sub && !sameKey(sub.options.applicationServerKey, key)) {
      await sub.unsubscribe();
      sub = null;
    }
    sub ??= await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
    const { keys } = sub.toJSON();
    const { error } = await createClient().rpc("save_push_subscription", { sub_endpoint: sub.endpoint, sub_p256dh: keys?.p256dh ?? "", sub_auth: keys?.auth ?? "" });
    remember(!error);
    return !error;
  } catch {
    remember(false);
    return false;
  }
}

/** Takes the address away (needs the sign-in, so before Log out). */
async function stopPush() {
  // Let one that's under way finish first, so its address is the one removed.
  await starting?.catch(() => false);
  remember(false);
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    const sub = await (await navigator.serviceWorker.getRegistration())?.pushManager.getSubscription();
    if (!sub) return;
    await createClient().rpc("remove_push_subscription", { sub_endpoint: sub.endpoint });
    await sub.unsubscribe();
  } catch {}
}

/** Asks the browser (the first time), then turns them on; returns where things ended up. */
export async function setDesktopNotices(on: boolean): Promise<NoticeState> {
  if (on && desktopNoticesSupported() && Notification.permission === "default") await Notification.requestPermission();
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {}
  changed();
  const state = desktopNotices();
  if (on && state === "on") {
    const closedToo = await startPush();
    show({
      title: "Desktop notifications are on",
      body: `Shares, comments, new documents and production changes show here${closedToo ? ", even when Nia is closed" : " while Nia is open"}.`,
      tag: "nia-on",
    });
  }
  if (!on) await stopPush();
  return state;
}

/** Log out: this computer stops getting the account's notices. */
export async function endDesktopNotices() {
  await stopPush();
  try {
    localStorage.setItem(KEY, "off");
  } catch {}
  changed();
}

function show({ title, body, tag, onClick }: { title: string; body: string; tag: string; onClick?: () => void }) {
  try {
    // The same tag from several open windows shows once.
    const n = new Notification(title, { body, tag, icon: "/app-icons/icon-192.png" });
    n.onclick = () => {
      window.focus();
      onClick?.();
      n.close();
    };
  } catch {}
}

const noServer = () => "off" as NoticeState;

/** Listens for new notifications and shows the ones that matter (mounted once in the app shell). */
export function DesktopNotices() {
  const router = useRouter();
  const state = useSyncExternalStore(subscribeDesktopNotices, desktopNotices, noServer);
  useEffect(() => {
    if (state !== "on") return;
    // Keeps this computer's address saved for whoever is signed in (it may have moved, or been
    // turned on before notices could arrive with Nia closed).
    void startPush();
    const supabase = createClient();
    let live = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    void (async () => {
      // Mounted with the page, so the sign-in may not be loaded yet: joining before it would join
      // signed out, and the database would send nothing (Row Level Security, "401").
      const { data } = await supabase.auth.getSession();
      if (!live || !data.session) return;
      await supabase.realtime.setAuth(data.session.access_token);
      if (!live) return;
      // Row Level Security sends each person only their own notifications.
      channel = supabase
        .channel("desktop-notices")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, ({ new: row }) => {
          const notice = noticeFor(row as NoticeRow);
          // Looking at Nia already: it shows in Updates. Arriving by push: the service worker shows it.
          if (!notice || (document.visibilityState === "visible" && document.hasFocus()) || pushSaved()) return;
          const r = row as NoticeRow;
          show({ title: r.title, body: r.body, tag: `nia-${r.id}`, onClick: () => router.push(notice.href) });
        })
        .subscribe();
    })();
    return () => {
      live = false;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [state, router]);
  return null;
}
