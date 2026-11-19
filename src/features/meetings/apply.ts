import { createClient } from "@/lib/supabase/client";
import { quickAdd } from "@/features/crew/mutations";
import type { Proposal } from "@/features/meetings/proposals";

// Applying suggested changes from a meeting (docs/MEETINGS_SPEC.md, step 2): each one ticked goes
// where it belongs through the same paths the project page uses (milestones, the cast and crew
// quick add, the project's details), as the signed-in editor. Something already there isn't added
// twice. What happened is saved on the meeting, so each suggestion is applied only once.

async function saveProposals(meetingId: string, proposals: Proposal[]) {
  const { error } = await createClient().from("meetings").update({ proposals, updated_at: new Date().toISOString() }).eq("id", meetingId);
  if (error) throw new Error(error.message);
}

/** Applies the chosen suggestions; returns the meeting's suggestions afterwards and those that failed. */
export async function applyProposals(projectId: string, meetingId: string, all: Proposal[], chosen: Proposal[]) {
  const db = createClient();
  const done = new Set<string>();
  const failed: string[] = [];

  const items = chosen.filter((p) => p.kind === "action" || p.kind === "milestone");
  if (items.length) {
    const { data: existing } = await db.from("project_milestones").select("title").eq("project_id", projectId).is("deleted_at", null);
    const have = new Set((existing ?? []).map((m) => (m.title as string).trim().toLowerCase()));
    for (const p of items) {
      if (p.kind !== "action" && p.kind !== "milestone") continue;
      if (!have.has(p.title.trim().toLowerCase())) {
        const { error } = await db.from("project_milestones").insert({ project_id: projectId, kind: p.kind, title: p.title, due_on: p.dueOn });
        if (error) {
          failed.push(p.title);
          continue;
        }
        have.add(p.title.trim().toLowerCase());
      }
      done.add(p.id);
    }
  }

  const people = chosen.filter((p) => p.kind === "person");
  for (const p of people) {
    if (p.kind !== "person") continue;
    try {
      await quickAdd(projectId, [{ name: p.name, role: p.role, email: p.email }]);
      done.add(p.id);
    } catch {
      failed.push(p.name);
    }
  }

  const details = chosen.flatMap((p) => (p.kind === "project" ? [p] : []));
  if (details.length) {
    const { error } = await db.from("projects").update(Object.fromEntries(details.map((p) => [p.field, p.value]))).eq("id", projectId);
    if (error) failed.push(...details.map((p) => p.value));
    else details.forEach((p) => done.add(p.id));
  }

  const proposals = all.map((p) => {
    const edited = chosen.find((c) => c.id === p.id);
    return done.has(p.id) ? { ...(edited ?? p), status: "applied" as const } : p;
  });
  await saveProposals(meetingId, proposals);
  return { proposals, failed };
}

/** Sets aside every suggestion not yet applied. */
export async function dismissProposals(meetingId: string, all: Proposal[]) {
  const proposals = all.map((p) => (p.status === "proposed" ? { ...p, status: "dismissed" as const } : p));
  await saveProposals(meetingId, proposals);
  return proposals;
}
