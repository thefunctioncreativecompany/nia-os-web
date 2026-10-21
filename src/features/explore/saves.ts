// Collections and project references (Ika, 2026-10-21), read and written in the browser. The
// database's access rules keep collections private and references to people on the project.
// Removing goes through database functions (20261031010000_collections_remove.sql), as with
// project files. Before 20261031000000_collections_references.sql is run, everything here reports `ready: false`
// so the screens can say so instead of failing.
import type { SupabaseClient } from "@supabase/supabase-js";

import { currentUser } from "@/lib/supabase/current-user";

export type Collection = { id: string; name: string; items: { id: string; slug: string }[] };
export type Reference = { id: string; slug: string; addedBy: string };
export type EditableProject = { id: string; title: string; coverUrl: string | null };

/** Whether this person can use Explore (early access by invite or code), from the browser. */
export async function exploreAccess(db: SupabaseClient): Promise<boolean> {
  const { data, error } = await db.rpc("has_explore_access");
  return !error && data === true;
}

export type CodeResult = "unlocked" | "wrong" | { error: string };
/** Enter an invite code. */
export async function redeemCode(db: SupabaseClient, code: string): Promise<CodeResult> {
  const { data, error } = await db.rpc("redeem_explore_code", { code });
  if (error) return { error: error.code === "P0001" ? error.message : "That didn't work. Try again in a moment." };
  return data === true ? "unlocked" : "wrong";
}

/** The collection a first save goes into. */
export const DEFAULT_COLLECTION = "Saved";

// The tables don't exist yet (the migration hasn't been run).
const missing = (error: { code?: string; message?: string } | null) =>
  !!error && (error.code === "PGRST205" || error.code === "PGRST202" || error.code === "42P01" || /schema cache|does not exist/i.test(error.message ?? ""));

export type Result<T> = { ready: true; data: T } | { ready: false; error: string };
const fail = (error: { code?: string; message?: string }): Result<never> => ({
  ready: false,
  error: missing(error) ? "Collections aren't switched on yet." : (error.message ?? "Something went wrong."),
});

export async function loadCollections(db: SupabaseClient): Promise<Result<Collection[]>> {
  const { data, error } = await db
    .from("collections")
    .select("id, name, created_at, items:collection_items(id, title_slug, created_at, deleted_at)")
    .is("deleted_at", null)
    .order("created_at");
  if (error) return fail(error);
  type Row = { id: string; name: string; items: { id: string; title_slug: string; created_at: string; deleted_at: string | null }[] };
  return {
    ready: true,
    data: (data as Row[]).map((c) => ({
      id: c.id,
      name: c.name,
      items: c.items
        .filter((i) => !i.deleted_at)
        .toSorted((a, b) => b.created_at.localeCompare(a.created_at))
        .map((i) => ({ id: i.id, slug: i.title_slug })),
    })),
  };
}

export async function createCollection(db: SupabaseClient, name: string): Promise<Result<Collection>> {
  const { data, error } = await db.from("collections").insert({ name: name.trim() }).select("id, name").single();
  return error ? fail(error) : { ready: true, data: { id: data.id, name: data.name, items: [] } };
}

/** Puts a title in a collection; already there counts as done. */
export async function saveTitle(db: SupabaseClient, collectionId: string, slug: string): Promise<Result<{ id: string } | null>> {
  const { data, error } = await db.from("collection_items").insert({ collection_id: collectionId, title_slug: slug }).select("id").single();
  if (error?.code === "23505") return { ready: true, data: null };
  return error ? fail(error) : { ready: true, data: { id: data.id } };
}

export async function unsaveTitle(db: SupabaseClient, itemId: string): Promise<Result<null>> {
  const { error } = await db.rpc("remove_collection_item", { item_id: itemId });
  return error ? fail(error) : { ready: true, data: null };
}

export async function loadReferences(db: SupabaseClient, projectId: string): Promise<Result<Reference[]>> {
  const { data, error } = await db
    .from("project_references")
    .select("id, title_slug, added_by, created_at")
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) return fail(error);
  return { ready: true, data: data.map((r) => ({ id: r.id, slug: r.title_slug, addedBy: r.added_by })) };
}

/** Adds a title to a project's references; already there counts as done. */
export async function addReference(db: SupabaseClient, projectId: string, slug: string): Promise<Result<{ id: string } | null>> {
  const { data, error } = await db.from("project_references").insert({ project_id: projectId, title_slug: slug }).select("id").single();
  if (error?.code === "23505") return { ready: true, data: null };
  return error ? fail(error) : { ready: true, data: { id: data.id } };
}

export async function removeReference(db: SupabaseClient, referenceId: string): Promise<Result<null>> {
  const { error } = await db.rpc("remove_project_reference", { reference_id: referenceId });
  return error ? fail(error) : { ready: true, data: null };
}

/** Which of these projects already hold a title, for the "Add to project" list. */
export async function projectsHolding(db: SupabaseClient, slug: string): Promise<Set<string>> {
  const { data } = await db.from("project_references").select("project_id").eq("title_slug", slug).is("deleted_at", null);
  return new Set((data ?? []).map((r) => r.project_id as string));
}

/** Projects the person can add references to: their own and ones shared with them to edit. */
export async function editableProjects(db: SupabaseClient): Promise<EditableProject[]> {
  const user = await currentUser(db);
  if (!user) return [];
  const [{ data: own }, { data: shared }] = await Promise.all([
    db.from("projects").select("id, title, cover_url, updated_at").eq("owner_id", user.id).is("deleted_at", null),
    db.from("project_members").select("projects(id, title, cover_url, updated_at, deleted_at)").eq("user_id", user.id).eq("role", "editor"),
  ]);
  type Row = { id: string; title: string; cover_url: string | null; updated_at: string; deleted_at?: string | null };
  const rows: Row[] = [
    ...((own ?? []) as Row[]),
    ...((shared ?? []) as unknown as { projects: Row | null }[]).map((m) => m.projects).filter((p): p is Row => !!p && !p.deleted_at),
  ];
  return rows
    .toSorted((a, b) => b.updated_at.localeCompare(a.updated_at))
    .map((p) => ({ id: p.id, title: p.title || "Untitled project", coverUrl: p.cover_url }));
}
