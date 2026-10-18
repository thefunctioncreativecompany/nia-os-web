import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";

import {
  PROJECT_COLUMNS,
  toProject,
  type ActivityItem,
  type Project,
  type ProjectRole,
} from "@/lib/projects";
import { createClient } from "@/lib/supabase/server";

// Loaders for the project screens and Home. They read cookies, so call them inside
// <Suspense>. Row Level Security limits every query to projects the user can access.

const requireUser = cache(async () => {
  // Supabase checks token expiry with Date.now(), so keep this out of the prerendered shell.
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user, now: Date.now() };
});

export async function listProjects(query?: string, limit?: number) {
  const { supabase, now } = await requireUser();
  let request = supabase
    .from("projects")
    .select(PROJECT_COLUMNS)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });
  const search = query?.trim();
  if (search) request = request.ilike("title", `%${search.replace(/[%_]/g, "\\$&")}%`);
  if (limit) request = request.limit(limit);
  const { data, error } = await request;
  if (error) throw new Error(`Couldn't load your projects: ${error.message}`);
  return { projects: data.map(toProject), now };
}

export const getProject = cache(
  async (id: string): Promise<{ project: Project; role: ProjectRole; userId: string; now: number }> => {
    const { supabase, user, now } = await requireUser();
    if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
    const { data, error } = await supabase
      .from("projects")
      .select(PROJECT_COLUMNS)
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();
    if (error) throw new Error(`Couldn't load this project: ${error.message}`);
    if (!data) notFound();

    let role: ProjectRole = "owner";
    if (data.owner_id !== user.id) {
      const { data: membership } = await supabase
        .from("project_members")
        .select("role")
        .eq("project_id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      // No membership row means they see it through the workspace, where everyone edits.
      role = (membership?.role as ProjectRole | undefined) ?? "editor";
    }
    return { project: toProject(data), role, userId: user.id, now };
  },
);

type ActivityRow = {
  id: number;
  project_id: string;
  actor_id: string | null;
  actor_name: string;
  action: string;
  detail: string;
  created_at: string;
  projects: { title: string } | null;
};

export async function listActivity({ projectId, limit = 5 }: { projectId?: string; limit?: number }) {
  const { supabase, user, now } = await requireUser();
  let request = supabase
    .from("activity")
    .select("id, project_id, actor_id, actor_name, action, detail, created_at, projects(title)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (projectId) request = request.eq("project_id", projectId);
  const { data, error } = await request.returns<ActivityRow[]>();
  if (error) throw new Error(`Couldn't load recent activity: ${error.message}`);
  const items: ActivityItem[] = data.map((row) => ({
    id: row.id,
    projectId: row.project_id,
    projectTitle: row.projects?.title ?? "",
    actorName: row.actor_name,
    isYou: row.actor_id === user.id,
    action: row.action,
    detail: row.detail,
    createdAt: row.created_at,
  }));
  return { items, now };
}

export async function countProjectPeople(projectId: string) {
  const { supabase } = await requireUser();
  const { data } = await supabase.rpc("project_people", { pid: projectId });
  return (data ?? []).filter((person: { kind: string }) => person.kind !== "invite").length;
}
