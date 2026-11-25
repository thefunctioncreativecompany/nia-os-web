import { timingSafeEqual } from "node:crypto";

import type { NoticeRow } from "@/lib/notice-rules";
import { sendNotice } from "@/lib/push";

// Called by the database when a notification is made (Supabase > Database > Webhooks, on
// notifications, Insert), with the shared secret PUSH_WEBHOOK_SECRET in the x-nia-push-secret
// header. Sends it to the person's computers (lib/push.ts). Anyone else gets 401.
export async function POST(request: Request) {
  const secret = process.env.PUSH_WEBHOOK_SECRET;
  const given = Buffer.from(request.headers.get("x-nia-push-secret") ?? "");
  if (!secret || given.length !== Buffer.byteLength(secret) || !timingSafeEqual(given, Buffer.from(secret))) {
    return new Response(null, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as { type?: string; table?: string; record?: NoticeRow } | null;
  if (body?.type !== "INSERT" || body.table !== "notifications" || !body.record) return new Response(null, { status: 204 });
  const sent = await sendNotice(body.record);
  return Response.json({ sent });
}
