import "server-only";

import { createClient } from "@/lib/supabase/server";
import { exploreItem } from "./items";
import { essentialWhy } from "./made-in-africa";
import { topTen, type TopActivity } from "./top";

// Explore's essentials, in their curated order: the list's fill-in while activity is thin.
const PICKS = [...essentialWhy.keys()];
const shown = (slug: string) => Boolean(exploreItem(slug)?.image);

/** This visit's Top 10 (top.ts). Read after `connection()`; until the migration is run, or if
 * the database can't be reached, the essentials stand in. */
export async function loadTopTen(): Promise<string[]> {
  let activity: TopActivity[] = [];
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("explore_top", { days: 30 });
    if (!error && Array.isArray(data)) activity = data as TopActivity[];
  } catch {}
  return topTen(activity, PICKS, shown);
}
