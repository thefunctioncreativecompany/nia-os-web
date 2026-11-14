import "server-only";
import { connection } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { features } from "@/lib/features";
import { getSession } from "@/lib/supabase/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { portfolioFrom, type Piece, type Portfolio, type PortfolioProject } from "./types";

// Portfolios' server side (beta). Inside the app everything is read as the signed-in person, so the
// database rules apply; the public page reads with the admin client only after checking the
// portfolio is published (or that the viewer is in its workspace, to preview it).

const BUCKET = "project-files";
const HOUR = 60 * 60;
const PORTFOLIO_COLUMNS = "id, title, byline, slug, template, background, cover_file_id, published_at, updated_at";

/** Whether the signed-in person may use Portfolios: the beta switch and the PORTFOLIOS_BETA_EMAILS list
 * (Ika, 2026-11-14: test accounts only, kept out of the code). */
export async function canUsePortfolios() {
  if (!features.portfoliosBeta) return false;
  await connection();
  const { user } = await getSession();
  const allowed = (process.env.PORTFOLIOS_BETA_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return Boolean(user?.email && allowed.includes(user.email.toLowerCase()));
}

type FileRow = { id: string; project_id: string; name: string; path: string; kind: string };

// The final pictures and films of these projects, oldest first (the order they were added in).
async function finals(client: SupabaseClient, projectIds: string[]) {
  if (!projectIds.length) return [] as FileRow[];
  const { data } = await client
    .from("project_files")
    .select("id, project_id, name, path, kind")
    .in("project_id", projectIds)
    .eq("tag", "final")
    .in("kind", ["image", "video"])
    .is("deleted_at", null)
    .order("created_at");
  return (data ?? []) as FileRow[];
}

async function signed(client: SupabaseClient, files: FileRow[]) {
  if (!files.length) return new Map<string, string>();
  const { data } = await client.storage.from(BUCKET).createSignedUrls(files.map((f) => f.path), HOUR);
  return new Map((data ?? []).map((d, i) => [files[i].id, d.signedUrl ?? ""]));
}

const piece = (f: FileRow, urls: Map<string, string>): Piece => ({ id: f.id, name: f.name, kind: f.kind === "video" ? "video" : "image", url: urls.get(f.id) ?? "" });

/** Your workspace's portfolios, newest first, each with its cover picture. */
export async function listPortfolios(): Promise<{ portfolio: Portfolio; cover: string | null }[]> {
  const { supabase } = await getSession();
  const { data } = await supabase.from("portfolios").select(PORTFOLIO_COLUMNS).is("deleted_at", null).order("updated_at", { ascending: false });
  const rows = (data ?? []).map(portfolioFrom);
  const coverIds = rows.map((p) => p.coverFileId).filter((id): id is string => Boolean(id));
  const { data: files } = coverIds.length ? await supabase.from("project_files").select("id, project_id, name, path, kind").in("id", coverIds) : { data: [] };
  const urls = await signed(supabase, (files ?? []) as FileRow[]);
  return rows.map((portfolio) => ({ portfolio, cover: portfolio.coverFileId ? urls.get(portfolio.coverFileId) || null : null }));
}

/** A portfolio for its editor: its projects in order, and every project of yours with final assets. */
export async function loadEditor(id: string) {
  const { supabase } = await getSession();
  const { data: row } = await supabase.from("portfolios").select(PORTFOLIO_COLUMNS).eq("id", id).is("deleted_at", null).maybeSingle();
  if (!row) return null;
  const [{ data: links }, { data: projects }] = await Promise.all([
    supabase.from("portfolio_projects").select("project_id, position").eq("portfolio_id", id).order("position"),
    supabase.from("projects").select("id, title").is("deleted_at", null).order("updated_at", { ascending: false }),
  ]);
  const all = (projects ?? []) as { id: string; title: string }[];
  const files = await finals(supabase, all.map((p) => p.id));
  const urls = await signed(supabase, files);
  const withFinals: PortfolioProject[] = all
    .map((p) => ({ id: p.id, title: p.title || "Untitled project", pieces: files.filter((f) => f.project_id === p.id).map((f) => piece(f, urls)) }))
    .filter((p) => p.pieces.length > 0);
  const chosen = ((links ?? []) as { project_id: string }[]).map((l) => l.project_id);
  return { portfolio: portfolioFrom(row), chosen, projects: withFinals };
}

/** The public page: a published portfolio (or an unpublished one, for people in its workspace). */
export async function loadPublic(slug: string) {
  await connection();
  const admin = createAdminClient();
  if (!admin) return null;
  const { data: row } = await admin.from("portfolios").select(`${PORTFOLIO_COLUMNS}, workspace_id`).eq("slug", slug).is("deleted_at", null).maybeSingle();
  if (!row) return null;
  let preview = false;
  if (!row.published_at) {
    // Not published: only people in its workspace see it, as a preview.
    const { supabase, user } = await getSession();
    if (!user) return null;
    const { data: mine } = await supabase.from("portfolios").select("id").eq("id", row.id).maybeSingle();
    if (!mine) return null;
    preview = true;
  }
  const { data: links } = await admin.from("portfolio_projects").select("project_id, position").eq("portfolio_id", row.id).order("position");
  const ids = ((links ?? []) as { project_id: string }[]).map((l) => l.project_id);
  const { data: projects } = ids.length ? await admin.from("projects").select("id, title").in("id", ids).is("deleted_at", null) : { data: [] };
  const files = await finals(admin, ids);
  const coverFile = row.cover_file_id ? files.find((f) => f.id === row.cover_file_id) ?? null : null;
  const urls = await signed(admin, files);
  const byId = new Map(((projects ?? []) as { id: string; title: string }[]).map((p) => [p.id, p]));
  const shown: PortfolioProject[] = ids
    .map((pid) => byId.get(pid))
    .filter((p): p is { id: string; title: string } => Boolean(p))
    .map((p) => ({ id: p.id, title: p.title || "Untitled project", pieces: files.filter((f) => f.project_id === p.id).map((f) => piece(f, urls)) }))
    .filter((p) => p.pieces.length > 0);
  const cover = coverFile ? piece(coverFile, urls) : shown[0]?.pieces.find((x) => x.kind === "image") ?? null;
  return { portfolio: portfolioFrom(row), projects: shown, cover, preview };
}
