// Recently viewed (Ika, 2026-10-22): Explore remembers which titles and creators' films each
// person opens (explore_views, 20261103000000_explore_views.sql), so the "Recently viewed" sort
// brings them back first, on any device. Until that file is run, nothing is remembered and the
// sort shows the usual order.
import { createClient } from "@/lib/supabase/client";

/** Notes that the signed-in person opened an item. Quietly does nothing if it can't. */
export async function recordView(slug: string) {
  await createClient().rpc("record_explore_view", { item: slug });
}

/** The items the signed-in person has opened, most recent first. Empty when there are none yet
 * or views aren't switched on. */
export async function recentViews(): Promise<string[]> {
  const { data, error } = await createClient().from("explore_views").select("slug").order("viewed_at", { ascending: false }).limit(200);
  return error || !data ? [] : data.map((row) => row.slug);
}

/** `items` with the ones in `recent` first, in the order they were viewed, then the rest as they
 * were. */
export function recentFirst<T>(items: readonly T[], recent: readonly string[], slugOf: (item: T) => string): T[] {
  const rank = new Map(recent.map((slug, i) => [slug, i]));
  const seen = items.filter((x) => rank.has(slugOf(x))).sort((a, b) => rank.get(slugOf(a))! - rank.get(slugOf(b))!);
  return [...seen, ...items.filter((x) => !rank.has(slugOf(x)))];
}
