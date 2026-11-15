"use server";

import { z } from "zod";

import { getSession } from "@/lib/supabase/session";
import { fileLinks } from "@/lib/file-links";
import { rowId } from "@/lib/schemas";

// Pictures in documents (a shot list's Reference column, Ika 2026-11-15: "some teams may only have
// references for shot list"). A picture is one of the project's own files; these read as the
// signed-in person, so the database's rules decide which files they may see, and the links come
// from file-links.ts (the smaller copy, the same link for a while, so a picture isn't fetched again
// on every visit: Supabase's free plan).

export type Picture = { id: string; name: string; url: string; tag: string | null };

type Row = { id: string; name: string; path: string; thumb_path: string | null; tag: string | null };

async function linked(rows: Row[]): Promise<Picture[]> {
  const shown = (r: Row) => r.thumb_path ?? r.path;
  const links = await fileLinks(rows.map(shown));
  return rows.flatMap((r) => {
    const url = links.get(shown(r));
    return url ? [{ id: r.id, name: r.name, url, tag: r.tag }] : [];
  });
}

/** Links for pictures already in a document, by file id. Ones they can't see (or that are gone) are left out. */
export async function pictureLinks(ids: unknown): Promise<Picture[]> {
  const parsed = z.array(rowId).max(200).safeParse(ids);
  if (!parsed.success || parsed.data.length === 0) return [];
  const { supabase, user } = await getSession();
  if (!user) return [];
  const { data } = await supabase.from("project_files").select("id, name, path, thumb_path, tag").in("id", parsed.data).eq("kind", "image").is("deleted_at", null);
  return linked((data ?? []) as Row[]);
}

/** A project's pictures for the picker: references first, then the rest, newest first. */
export async function projectPictures(projectId: unknown): Promise<Picture[]> {
  const parsed = rowId.safeParse(projectId);
  if (!parsed.success) return [];
  const { supabase, user } = await getSession();
  if (!user) return [];
  const { data } = await supabase
    .from("project_files")
    .select("id, name, path, thumb_path, tag")
    .eq("project_id", parsed.data)
    .eq("kind", "image")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = (data ?? []) as Row[];
  return linked([...rows.filter((r) => r.tag === "reference"), ...rows.filter((r) => r.tag !== "reference")]);
}
