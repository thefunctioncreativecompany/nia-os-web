import "server-only";
import { connection } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { features } from "@/lib/features";
import { getSession } from "@/lib/supabase/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { fileLinks } from "@/lib/file-links";
import { portfolioFrom, type Piece, type Portfolio, type PortfolioProject } from "./types";

// Portfolios' server side (beta). Inside the app everything is read as the signed-in person, so the
// database rules apply; the public page reads with the admin client only after checking the
// portfolio is published (or that the viewer is in its workspace, to preview it).

// Every column ("*"), so the pages keep working before a migration adds one (cover_frame, 2026-11-15).
const PORTFOLIO_COLUMNS = "*";

/** Whether the signed-in person may use Portfolios: the beta switch and the PORTFOLIOS_BETA_EMAILS list
 * (Ika, 2026-11-14: test accounts only, kept out of the code). */
export async function canUsePortfolios() {
  if (!features.portfoliosBeta) return false;
  await connection();
  const { user } = await getSession();
  return inBeta(user?.email);
}

const inBeta = (email: string | null | undefined) => {
  const allowed = (process.env.PORTFOLIOS_BETA_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return Boolean(email && allowed.includes(email.toLowerCase()));
};

// The database lets anyone signed in make a portfolio, so the public page checks that whoever made
// it is in the beta (platform audit 2026-11-18, PA3). Goes when Portfolios opens to everyone.
async function madeInBeta(admin: SupabaseClient, ownerId: string) {
  if (!features.portfoliosBeta) return false;
  const { data } = await admin.auth.admin.getUserById(ownerId);
  return inBeta(data.user?.email);
}

// A portfolio's projects that belong to its own workspace, in its order (PA1: never another
// team's work, even if a link to one was added before 20261123000000_portfolios_own_work.sql).
async function ownProjects(admin: SupabaseClient, portfolioId: string, workspaceId: string) {
  const { data: links } = await admin.from("portfolio_projects").select("project_id, position").eq("portfolio_id", portfolioId).order("position");
  const ids = ((links ?? []) as { project_id: string }[]).map((l) => l.project_id);
  const { data: projects } = ids.length
    ? await admin.from("projects").select("id, title").in("id", ids).eq("workspace_id", workspaceId).is("deleted_at", null)
    : { data: [] };
  const byId = new Map(((projects ?? []) as { id: string; title: string }[]).map((p) => [p.id, p]));
  return ids.flatMap((id) => byId.get(id) ?? []);
}

type FileRow = { id: string; project_id: string; name: string; path: string; kind: string; thumb_path: string | null; position?: number | null; created_at: string };

// The final pictures and films of these projects, in the order arranged (`position`, then the order
// they were added in). "*" so it reads before the position column exists (2026-11-15).
async function finals(client: SupabaseClient, projectIds: string[]) {
  if (!projectIds.length) return [] as FileRow[];
  const { data } = await client
    .from("project_files")
    .select("*")
    .in("project_id", projectIds)
    .eq("tag", "final")
    .in("kind", ["image", "video"])
    .is("deleted_at", null)
    .order("created_at");
  const rows = (data ?? []) as FileRow[];
  const at = (f: FileRow) => (typeof f.position === "number" ? f.position : Number.MAX_SAFE_INTEGER);
  return rows.sort((a, b) => at(a) - at(b) || a.created_at.localeCompare(b.created_at));
}

// A picture's smaller copy when it has one (the original only for films), through links that stay
// the same for a while (file-links.ts). Callers pass files already checked. Keyed by file id.
const shownPath = (f: FileRow) => (f.kind === "image" && f.thumb_path ? f.thumb_path : f.path);
async function signed(files: FileRow[]) {
  const links = await fileLinks(files.map(shownPath));
  return new Map(files.map((f) => [f.id, links.get(shownPath(f)) ?? ""]));
}

const piece = (f: FileRow, urls: Map<string, string>): Piece => ({ id: f.id, name: f.name, kind: f.kind === "video" ? "video" : "image", url: urls.get(f.id) ?? "" });

/** Your workspace's portfolios, newest first, each with its cover picture. */
export async function listPortfolios(): Promise<{ portfolio: Portfolio; cover: string | null }[]> {
  const { supabase } = await getSession();
  const { data } = await supabase.from("portfolios").select(PORTFOLIO_COLUMNS).is("deleted_at", null).order("updated_at", { ascending: false });
  const rows = (data ?? []).map(portfolioFrom);
  const coverIds = rows.map((p) => p.coverFileId).filter((id): id is string => Boolean(id));
  const { data: files } = coverIds.length ? await supabase.from("project_files").select("id, project_id, name, path, kind, thumb_path").in("id", coverIds) : { data: [] };
  const urls = await signed((files ?? []) as FileRow[]);
  return rows.map((portfolio) => ({ portfolio, cover: portfolio.coverFileId ? urls.get(portfolio.coverFileId) || null : null }));
}

/** A portfolio for its editor: its projects in order, and every project of yours with final assets. */
export async function loadEditor(id: string) {
  const { supabase } = await getSession();
  const { data: row } = await supabase.from("portfolios").select(PORTFOLIO_COLUMNS).eq("id", id).is("deleted_at", null).maybeSingle();
  if (!row) return null;
  const [{ data: links }, { data: projects }] = await Promise.all([
    supabase.from("portfolio_projects").select("project_id, position").eq("portfolio_id", id).order("position"),
    // Only the portfolio's own workspace's projects (the database refuses others).
    supabase.from("projects").select("id, title").eq("workspace_id", row.workspace_id).is("deleted_at", null).order("updated_at", { ascending: false }),
  ]);
  const all = (projects ?? []) as { id: string; title: string }[];
  const files = await finals(supabase, all.map((p) => p.id));
  const urls = await signed(files);
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
  const { data: row } = await admin.from("portfolios").select(PORTFOLIO_COLUMNS).eq("slug", slug).is("deleted_at", null).maybeSingle();
  if (!row || !(await madeInBeta(admin, row.owner_id))) return null;
  let preview = false;
  if (!row.published_at) {
    // Not published: only people in its workspace see it, as a preview.
    const { supabase, user } = await getSession();
    if (!user) return null;
    const { data: mine } = await supabase.from("portfolios").select("id").eq("id", row.id).maybeSingle();
    if (!mine) return null;
    preview = true;
  }
  const projects = await ownProjects(admin, row.id, row.workspace_id);
  const files = await finals(admin, projects.map((p) => p.id));
  const coverFile = row.cover_file_id ? files.find((f) => f.id === row.cover_file_id) ?? null : null;
  const urls = await signed(files);
  const shown: PortfolioProject[] = projects
    .map((p) => ({ id: p.id, title: p.title || "Untitled project", pieces: files.filter((f) => f.project_id === p.id).map((f) => piece(f, urls)) }))
    .filter((p) => p.pieces.length > 0);
  const cover = coverFile ? piece(coverFile, urls) : shown[0]?.pieces.find((x) => x.kind === "image") ?? null;
  return { portfolio: portfolioFrom(row), projects: shown, cover, preview };
}

/** What a link preview may show: a published portfolio's title, name, cover (its smaller copy) and
 * framing. Null for anything not published, so a preview never shows what the link wouldn't. */
export async function publicPreview(slug: string) {
  const admin = createAdminClient();
  if (!admin) return null;
  const { data: row } = await admin.from("portfolios").select(PORTFOLIO_COLUMNS).eq("slug", slug).is("deleted_at", null).not("published_at", "is", null).maybeSingle();
  if (!row || !(await madeInBeta(admin, row.owner_id))) return null;
  const portfolio = portfolioFrom(row);
  // The cover only from the work the page itself shows (PA2), as loadPublic does: the chosen
  // cover, or else the first picture of the first project.
  const projects = await ownProjects(admin, row.id, row.workspace_id);
  const files = await finals(admin, projects.map((p) => p.id));
  const file =
    (portfolio.coverFileId ? files.find((f) => f.id === portfolio.coverFileId) : undefined) ??
    projects.map((p) => files.find((f) => f.project_id === p.id && f.kind === "image")).find(Boolean) ??
    null;
  const cover = file ? (await signed([file])).get(file.id) || null : null;
  return { title: portfolio.title, byline: portfolio.byline, cover, frame: portfolio.coverFrame };
}

/** A published portfolio's title and name, for the page's title in browser tabs and previews. */
export async function publicTitle(slug: string) {
  const admin = createAdminClient();
  if (!admin) return null;
  const { data } = await admin.from("portfolios").select("title, byline, owner_id").eq("slug", slug).is("deleted_at", null).not("published_at", "is", null).maybeSingle();
  const row = data as { title: string; byline: string; owner_id: string } | null;
  if (!row || !(await madeInBeta(admin, row.owner_id))) return null;
  return { title: row.title, byline: row.byline };
}
