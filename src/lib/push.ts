import "server-only";

import webpush from "web-push";

import { noticeFor, type NoticeRow } from "@/lib/notice-rules";
import { createAdminClient } from "@/lib/supabase/admin";

// Sends a notification to the computers where its person turned on Desktop notifications, so it
// arrives even when Nia is closed (FEEDBACK D6 step 2). Keys: NEXT_PUBLIC_VAPID_PUBLIC_KEY and
// VAPID_PRIVATE_KEY (.env.local and Vercel). Without them, or without the Supabase secret key,
// nothing is sent and the open page still shows notices itself.

export function pushConfigured() {
  return !!(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.SUPABASE_SECRET_KEY);
}

/** Returns how many computers it went to. */
export async function sendNotice(row: NoticeRow): Promise<number> {
  const notice = noticeFor(row);
  const admin = createAdminClient();
  if (!notice || !row.user_id || !admin || !pushConfigured()) return 0;
  const { data: subs } = await admin.from("push_subscriptions").select("endpoint, p256dh, auth").eq("user_id", row.user_id);
  if (!subs?.length) return 0;

  webpush.setVapidDetails("https://app.niatechnologies.co", process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);
  const payload = JSON.stringify({ title: row.title, body: row.body, href: notice.href, tag: `nia-${row.id}` });
  const results = await Promise.allSettled(
    subs.map((s) => webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 60 * 60 * 24, urgency: "normal" })),
  );
  // Addresses the browser has given up (uninstalled, notices turned off there): forget them.
  const gone = subs.filter((_, i) => {
    const r = results[i];
    return r.status === "rejected" && [404, 410].includes((r.reason as { statusCode?: number })?.statusCode ?? 0);
  });
  if (gone.length) await admin.from("push_subscriptions").delete().in("endpoint", gone.map((s) => s.endpoint));
  return results.filter((r) => r.status === "fulfilled").length;
}
