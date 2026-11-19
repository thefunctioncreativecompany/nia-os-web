import { createClient } from "@/lib/supabase/client";

// Points from a meeting's notes sent to the project's Key milestones (Ika, 2026-11-19: "an easier
// way to send action items to milestones/objectives"), as the signed-in editor, without the AI.
// A point already there (same words) isn't added twice. The milestones list hears about it
// (MILESTONES_CHANGED) and shows them straight away.

export const MILESTONES_CHANGED = "nia:milestones-changed";

export type NewMilestone = { kind: "action" | "milestone"; title: string; dueOn: string | null };

const key = (title: string) => title.trim().toLowerCase();

/** The project's milestone and action words, for "already in milestones". */
export async function milestoneTitles(projectId: string): Promise<Set<string>> {
  const { data } = await createClient().from("project_milestones").select("title").eq("project_id", projectId).is("deleted_at", null);
  return new Set((data ?? []).map((m) => key(m.title as string)));
}

/** Adds the ones not there yet; returns how many were added. */
export async function addMilestones(projectId: string, items: NewMilestone[]): Promise<number> {
  const have = await milestoneTitles(projectId);
  const fresh = items
    .map((i) => ({ ...i, title: i.title.trim().slice(0, 300) }))
    .filter((i, n, all) => i.title && !have.has(key(i.title)) && all.findIndex((x) => key(x.title) === key(i.title)) === n);
  if (fresh.length) {
    const { error } = await createClient()
      .from("project_milestones")
      .insert(fresh.map((i) => ({ project_id: projectId, kind: i.kind, title: i.title, due_on: i.dueOn })));
    if (error) throw new Error(error.message);
  }
  window.dispatchEvent(new CustomEvent(MILESTONES_CHANGED, { detail: projectId }));
  return fresh.length;
}

export const titleKey = key;
