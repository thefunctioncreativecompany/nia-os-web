import type { SupabaseClient } from "@supabase/supabase-js";
import { currentUser } from "@/lib/supabase/current-user";

import { FREE_LIMITS, isLimited, limitsOn, type PlanId } from "@/lib/plans";

// A workspace's plan, read in the browser. Anything unreadable counts as Free (including before
// the plans migration has been run).
export async function workspacePlan(supabase: SupabaseClient, workspaceId: string | null | undefined): Promise<PlanId> {
  if (!workspaceId) return "free";
  const { data, error } = await supabase.from("workspaces").select("plan").eq("id", workspaceId).maybeSingle();
  return error || !data?.plan ? "free" : (data.plan as PlanId);
}

/** The plan of the workspace a project belongs to. */
export async function projectPlan(supabase: SupabaseClient, projectId: string | null | undefined): Promise<PlanId> {
  if (!projectId) return "free";
  // One request: the project with its workspace's plan.
  const { data, error } = await supabase.from("projects").select("workspaces(plan)").eq("id", projectId).maybeSingle();
  const plan = (data as { workspaces: { plan?: string } | null } | null)?.workspaces?.plan;
  return error || !plan ? "free" : (plan as PlanId);
}

/** Whether the free limits apply to this project (live site only). */
export async function projectLimited(supabase: SupabaseClient, projectId: string | null | undefined) {
  if (!isLimited("free")) return false;
  return isLimited(await projectPlan(supabase, projectId));
}

/** Plans of several workspaces at once, Free for any it can't read. */
export async function workspacePlans(supabase: SupabaseClient, ids: string[]): Promise<Map<string, PlanId>> {
  const plans = new Map<string, PlanId>();
  if (!ids.length) return plans;
  const { data, error } = await supabase.from("workspaces").select("id, plan").in("id", [...new Set(ids)]);
  if (!error) for (const row of data ?? []) plans.set(row.id as string, (row.plan as PlanId) ?? "free");
  return plans;
}

/** Whether a free workspace already has its most projects (live site only). */
export async function projectLimitReached(supabase: SupabaseClient, workspaceId: string | null | undefined) {
  if (!limitsOn || !workspaceId) return false;
  if (!isLimited(await workspacePlan(supabase, workspaceId))) return false;
  const { count } = await supabase.from("projects").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId).is("deleted_at", null);
  return (count ?? 0) >= FREE_LIMITS.projects;
}

/** The signed-in person's own workspace plan (their first workspace). */
export async function myPlan(supabase: SupabaseClient): Promise<PlanId> {
  const user = await currentUser(supabase);
  if (!user) return "free";
  // One request: the plan of their first workspace.
  const { data, error } = await supabase.from("workspaces").select("plan").eq("owner_id", user.id).order("created_at").limit(1).maybeSingle();
  return error || !data?.plan ? "free" : (data.plan as PlanId);
}
