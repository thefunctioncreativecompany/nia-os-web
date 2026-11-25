"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

// Desktop notifications (FEEDBACK D6 step 1, Ika 2026-11-25): while Nia is open, even behind
// other apps, the computer shows when someone shares a project with you, comments or asks for
// access. Collaborators' edits stay in Updates. A choice for this device (Settings → General),
// on only once the browser allows it. Nia closed: nothing yet (step 2, web push).

const KEY = "nia-desktop-notices";
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

/** Asks the browser (the first time), then turns them on; returns where things ended up. */
export async function setDesktopNotices(on: boolean): Promise<NoticeState> {
  if (on && desktopNoticesSupported() && Notification.permission === "default") await Notification.requestPermission();
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {}
  changed();
  const state = desktopNotices();
  if (on && state === "on") show({ title: "Desktop notifications are on", body: "Shares, comments and access requests show here while Nia is open.", tag: "nia-on" });
  return state;
}

type Row = { id: number; project_id: string | null; kind: string; title: string; body: string };

/** Which notifications pop up, and where clicking one goes (null: Updates only). Comments are
 *  "activity" rows told apart by their wording (20261112000000_comments.sql). */
export function noticeFor(row: Row): { href: string } | null {
  const project = row.project_id ? `/projects/${row.project_id}` : "/home";
  if (row.kind === "shared") return { href: project };
  if (row.kind === "activity" && / commented on | replied to your comment /.test(` ${row.title} `)) return { href: row.project_id ? `${project}?tab=comments` : project };
  return null;
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
          const notice = noticeFor(row as Row);
          // Looking at Nia already: it shows in Updates.
          if (!notice || (document.visibilityState === "visible" && document.hasFocus())) return;
          const r = row as Row;
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
