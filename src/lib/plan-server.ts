import "server-only";

import { getSession } from "@/lib/supabase/session";
import { isLimited, type PlanId } from "@/lib/plans";

/** Whether the signed-in person may use paid-plan features: a paid plan on any workspace they
 * belong to. Like the other plan limits, everyone may off the live site. Call inside Suspense. */
export async function hasPaidAccess(): Promise<boolean> {
  if (!isLimited("free")) return true;
  const { supabase, user } = await getSession();
  if (!user) return false;
  const { data } = await supabase.from("workspaces").select("plan");
  return (data ?? []).some((w) => !isLimited((w.plan as PlanId) ?? "free"));
}
