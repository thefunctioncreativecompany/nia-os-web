import "server-only";
import { cacheLife } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";

// Links to private project files that stay the same for about 45 minutes, so a browser reuses a
// picture it already has instead of downloading it again on every visit (Ika, 2026-11-14: Supabase's
// free plan, 5 GB of egress a month, was used up; a new link on every page load meant every picture
// was fetched again each time). Each link is signed for an hour and handed out for at most 50
// minutes. Only pass paths the person may see: read them through their own database rules first
// (or after a share link's or published portfolio's check), because signing passes every rule.

const BUCKET = "project-files";

async function linkFor(path: string): Promise<string | null> {
  "use cache";
  cacheLife({ stale: 45 * 60, revalidate: 45 * 60, expire: 50 * 60 });
  const admin = createAdminClient();
  if (!admin) return null;
  const { data } = await admin.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}

/** Path → link for each path (missing ones are left out). */
export async function fileLinks(paths: (string | null | undefined)[]): Promise<Map<string, string>> {
  const unique = [...new Set(paths.filter((p): p is string => Boolean(p)))];
  const links = await Promise.all(unique.map((p) => linkFor(p)));
  return new Map(unique.flatMap((p, i) => (links[i] ? [[p, links[i]] as const] : [])));
}
