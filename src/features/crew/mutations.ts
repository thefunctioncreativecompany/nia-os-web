// Changes to a project's cast and crew, from the browser like the project page's other edits; the
// database's rules decide who may make them (20261109000000_people.sql). After each change the
// project's Crew & talent list (projects.crew) is written again from the directory, so the share
// link and anything else still reading that list stays in step.

import { createClient } from "@/lib/supabase/client";
import type { ProductionStatus } from "@/components/nia/status-badge";
import { departmentFor, isCastRole, type Kind, type QuickPerson } from "./directory";

export type PersonForm = {
  name: string;
  kind: Kind;
  department: string;
  role: string;
  character: string;
  episodes: string;
  status: ProductionStatus;
  email: string;
  phone: string;
  agent: string;
  union: string;
  bio: string;
  availability: boolean[];
  notes: string;
  /** Their Nia account, when they were picked from Nia (their photo and name come from it). */
  userId?: string | null;
};

const text = (s: string, max: number) => s.trim().slice(0, max) || null;
const episodesOf = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean).slice(0, 60);

function personFields(f: PersonForm) {
  return {
    name: f.name.trim().slice(0, 120),
    email: text(f.email, 254),
    phone: text(f.phone, 40),
    agent: text(f.agent, 160),
    union_name: text(f.union, 80),
    bio: text(f.bio, 2000),
    availability: f.availability.some(Boolean) ? f.availability : null,
    ...(f.userId ? { user_id: f.userId } : {}),
  };
}

function roleFields(f: PersonForm) {
  return {
    kind: f.kind,
    department: text(f.department, 60),
    role: f.role.trim().slice(0, 80),
    character: f.kind === "cast" ? text(f.character, 120) : null,
    episodes: episodesOf(f.episodes),
    status: f.status,
    notes: text(f.notes, 2000),
  };
}

/** Adds someone to the project: the same person from the workspace's directory when their email
 * matches, else a new one. */
export async function addPerson(projectId: string, f: PersonForm) {
  const db = createClient();
  const { data: project, error: projectError } = await db.from("projects").select("workspace_id").eq("id", projectId).single();
  if (projectError) throw projectError;
  let personId: string | null = null;
  const email = text(f.email, 254);
  if (f.userId) {
    const { data: found } = await db.from("people").select("id").eq("workspace_id", project.workspace_id).eq("user_id", f.userId).is("deleted_at", null).limit(1).maybeSingle();
    personId = found?.id ?? null;
  }
  if (!personId && email) {
    const { data: found } = await db.from("people").select("id").eq("workspace_id", project.workspace_id).ilike("email", email).is("deleted_at", null).limit(1).maybeSingle();
    personId = found?.id ?? null;
  }
  if (personId) {
    const { error } = await db.from("people").update(personFields(f)).eq("id", personId);
    if (error) throw error;
  } else {
    const { data, error } = await db.from("people").insert({ workspace_id: project.workspace_id, ...personFields(f) }).select("id").single();
    if (error) throw error;
    personId = data.id;
  }
  const { count } = await db.from("cast_crew").select("id", { count: "exact", head: true }).eq("project_id", projectId).is("deleted_at", null);
  const { error } = await db.from("cast_crew").insert({ project_id: projectId, person_id: personId, position: count ?? 0, ...roleFields(f) });
  if (error) throw error;
  await syncCrewList(projectId);
}

/** Someone added in a line (Ika, 2026-11-15: "just add name, role, profile picture as a start"):
 * the details can come later. Who they are, in the order checked: someone already in the workspace's
 * directory (`personId`), a Nia account (`userId`), an email; else a new person. An existing person's
 * details are never overwritten here. */

/** Adds people to the project in one go; returns how many were added and the names already on it. */
export async function quickAdd(projectId: string, people: QuickPerson[]) {
  const db = createClient();
  const { data: project, error: projectError } = await db.from("projects").select("workspace_id").eq("id", projectId).single();
  if (projectError) throw projectError;
  const { data: onProject } = await db.from("cast_crew").select("person_id").eq("project_id", projectId).is("deleted_at", null);
  const taken = new Set((onProject ?? []).map((r) => r.person_id as string));
  let position = taken.size;
  let added = 0;
  const already: string[] = [];
  for (const p of people) {
    const name = p.name.trim().slice(0, 120);
    const role = p.role.trim().slice(0, 80) || "TBC";
    const email = p.email ? text(p.email, 254) : null;
    let personId = p.personId ?? null;
    if (!personId && p.userId) {
      const { data } = await db.from("people").select("id").eq("workspace_id", project.workspace_id).eq("user_id", p.userId).is("deleted_at", null).limit(1).maybeSingle();
      personId = data?.id ?? null;
    }
    if (!personId && email) {
      const { data } = await db.from("people").select("id").eq("workspace_id", project.workspace_id).ilike("email", email).is("deleted_at", null).limit(1).maybeSingle();
      personId = data?.id ?? null;
    }
    // A name typed (or pasted) without picking: the one person in the workspace with exactly that
    // name, so the directory doesn't fill with copies. Two with the same name: a new one is added.
    if (!personId && !p.userId && !email && name) {
      const { data } = await db.from("people").select("id").eq("workspace_id", project.workspace_id).ilike("name", name.replace(/[%_\\]/g, "\\$&")).is("deleted_at", null).limit(2);
      if (data?.length === 1) personId = data[0].id as string;
    }
    if (personId && taken.has(personId)) {
      already.push(name);
      continue;
    }
    if (!personId) {
      if (!name) continue;
      const { data, error } = await db.from("people").insert({ workspace_id: project.workspace_id, name, email, ...(p.userId ? { user_id: p.userId } : {}) }).select("id").single();
      if (error) throw error;
      personId = data.id as string;
    }
    const kind: Kind = isCastRole(role) ? "cast" : "crew";
    const { error } = await db.from("cast_crew").insert({ project_id: projectId, person_id: personId, position: position++, kind, role, department: kind === "crew" ? departmentFor(role) : null, status: "pending" });
    if (error) throw error;
    taken.add(personId);
    added++;
  }
  if (added) await syncCrewList(projectId);
  return { added, already };
}

/** Saves a person's details and their role on this project. */
export async function updatePerson(projectId: string, roleId: string, personId: string, f: PersonForm) {
  const db = createClient();
  const [person, role] = await Promise.all([
    db.from("people").update(personFields(f)).eq("id", personId),
    db.from("cast_crew").update(roleFields(f)).eq("id", roleId),
  ]);
  if (person.error) throw person.error;
  if (role.error) throw role.error;
  await syncCrewList(projectId);
}

export async function setStatus(roleId: string, status: ProductionStatus) {
  const { error } = await createClient().from("cast_crew").update({ status }).eq("id", roleId);
  if (error) throw error;
}

/** Takes someone off this project (kept, not erased); they stay in the workspace's directory. */
export async function removeFromProject(projectId: string, roleId: string) {
  const { error } = await createClient().from("cast_crew").update({ deleted_at: new Date().toISOString() }).eq("id", roleId);
  if (error) throw error;
  await syncCrewList(projectId);
}

/** Writes the project's Crew & talent list (role, name, Nia account) from the directory. */
async function syncCrewList(projectId: string) {
  const db = createClient();
  const { data } = await db
    .from("cast_crew")
    .select("role, position, person:people(name, user_id)")
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .order("position")
    .returns<{ role: string; position: number; person: { name: string; user_id: string | null } | null }[]>();
  const crew = (data ?? []).flatMap((r) => (r.person ? [{ role: r.role, name: r.person.name, ...(r.person.user_id ? { userId: r.person.user_id } : {}) }] : []));
  await db.from("projects").update({ crew }).eq("id", projectId);
}
