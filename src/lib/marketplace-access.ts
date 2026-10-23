import "server-only";
import { cache } from "react";

import { features } from "@/lib/features";
import { getSession } from "@/lib/supabase/session";

// Whether the signed-in person can see the Marketplace store before it opens (Ika, 2026-10-22: by
// invite code; 20261102000000_marketplace_access.sql). Everyone once `features.marketplaceUnlocked`
// is on. Call inside <Suspense>.
export const hasMarketplaceAccess = cache(async () => {
  if (features.marketplaceUnlocked) return true;
  const { supabase, user } = await getSession();
  if (!user) return false;
  const { data, error } = await supabase.rpc("has_marketplace_access");
  return !error && data === true;
});
