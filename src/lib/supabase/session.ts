import "server-only";
import { cache } from "react";
import { connection } from "next/server";

import { createClient } from "@/lib/supabase/server";

export type SessionUser = {
  id: string;
  email: string;
  metadata: { full_name?: string; avatar_url?: string; onboarded?: boolean };
};

// The signed-in person and one Supabase client, shared by everything on a page (layout, navbar,
// page loaders) through `cache`. The sign-in token is checked here against Supabase's public
// signing key, which the library keeps for ten minutes, so this costs no trip to Supabase; the
// proxy has already refreshed the token for this request. Call inside <Suspense>: it reads
// cookies, and Supabase checks expiry with Date.now().
export const getSession = cache(async () => {
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const user: SessionUser | null = claims
    ? { id: claims.sub, email: claims.email ?? "", metadata: (claims.user_metadata ?? {}) as SessionUser["metadata"] }
    : null;
  return { supabase, user };
});
