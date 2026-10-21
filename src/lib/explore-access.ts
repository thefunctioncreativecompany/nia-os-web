import "server-only";
import { cache } from "react";

import { features } from "@/lib/features";
import { getSession } from "@/lib/supabase/session";

// Whether the signed-in person can use Explore (Ika, 2026-10-21: early access by confirmed email
// invite or invite code; 20261101000000_explore_access.sql). Everyone once `features.exploreUnlocked`
// is on. Call inside <Suspense>.
export const hasExploreAccess = cache(async () => {
  if (features.exploreUnlocked) return true;
  const { supabase, user } = await getSession();
  if (!user) return false;
  const { data, error } = await supabase.rpc("has_explore_access");
  return !error && data === true;
});
