// Instagram posts added to a project's references (Ika, 2026-10-22): the project's own, seen only by
// its owner and the people invited to it. Rows live in `project_references` with kind "instagram";
// covers in the project's private "project-files" folder, opened with short-lived links.
// Migration: 20261104000000_project_instagram_references.sql.
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Credit } from "@/features/explore/creators";
import { parseInstagramLink, type InstagramLink } from "@/lib/instagram";

export type InstagramReference = {
  id: string;
  link: InstagramLink;
  title: string;
  productionType: string | null;
  account: string | null;
  postedOn: string | null;
  caption: string | null;
  credits: Credit[];
  /** The picture's true shape, and the post's when the picture sits on black bars inside it. */
  aspect: number | null;
  frame: number | null;
  coverUrl: string | null;
  note: string | null;
  createdAt: string;
};

export const REFERENCE_COLUMNS = "id, link, title, production_type, account, posted_on, caption, credits, aspect, frame, cover_path, note, created_at";

type Row = {
  id: string;
  link: string;
  title: string;
  production_type: string | null;
  account: string | null;
  posted_on: string | null;
  caption: string | null;
  credits: Credit[] | null;
  aspect: number | null;
  frame: number | null;
  cover_path: string | null;
  note: string | null;
  created_at: string;
};

/** The reference's slug in `project_references`, which keeps a post from being added twice. */
export const referenceSlug = (link: InstagramLink) => `instagram-${link.code}`;

export const referenceHref = (projectId: string, id: string) => `/projects/${projectId}/references/${id}`;

/** Rows with their covers' links (valid for an hour). Rows whose link no longer reads are left out. */
export async function toReferences(db: SupabaseClient, rows: Row[]): Promise<InstagramReference[]> {
  const paths = rows.flatMap((r) => (r.cover_path ? [r.cover_path] : []));
  const signed = paths.length ? ((await db.storage.from("project-files").createSignedUrls(paths, 60 * 60)).data ?? []) : [];
  const urls = new Map(signed.map((s) => [s.path, s.signedUrl] as const));
  return rows.flatMap((r) => {
    const link = parseInstagramLink(r.link);
    if (!link) return [];
    return [
      {
        id: r.id,
        link,
        title: r.title,
        productionType: r.production_type,
        account: r.account,
        postedOn: r.posted_on,
        caption: r.caption,
        credits: Array.isArray(r.credits) ? r.credits : [],
        aspect: r.aspect,
        frame: r.frame,
        coverUrl: r.cover_path ? (urls.get(r.cover_path) ?? null) : null,
        note: r.note,
        createdAt: r.created_at,
      },
    ];
  });
}

/** A project's Instagram references, newest first. */
export async function loadInstagramReferences(db: SupabaseClient, projectId: string): Promise<InstagramReference[]> {
  const { data, error } = await db
    .from("project_references")
    .select(REFERENCE_COLUMNS)
    .eq("project_id", projectId)
    .eq("kind", "instagram")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return toReferences(db, data as Row[]);
}

/** One reference, or null when it's gone or the person can't see it. */
export async function loadInstagramReference(db: SupabaseClient, projectId: string, id: string): Promise<InstagramReference | null> {
  const { data } = await db
    .from("project_references")
    .select(REFERENCE_COLUMNS)
    .eq("project_id", projectId)
    .eq("id", id)
    .eq("kind", "instagram")
    .is("deleted_at", null)
    .maybeSingle();
  if (!data) return null;
  return (await toReferences(db, [data as Row]))[0] ?? null;
}
