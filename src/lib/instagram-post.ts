"use server";

import sharp from "sharp";

import type { Credit } from "@/features/explore/creators";
import { PRODUCTION_TYPES } from "@/lib/projects";
import { decodeEntities, parseDescription, parseInstagramLink, readCaption, shapeFromBars, type InstagramLink } from "@/lib/instagram";
import { referenceSlug } from "@/lib/instagram-references";
import { getSession } from "@/lib/supabase/session";

// Reads an Instagram post the way link previews do (WhatsApp, Slack), from its public page:
// who posted it, when, the caption, and the cover from Instagram's image server. Beta only: before
// launch this moves to Meta's oEmbed API, which needs a Meta app (CLAUDE.md, 2026-10-21).
const PREVIEW_BOT = "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)";
// Covers come only from Instagram's own image servers.
const IMAGE_HOSTS = /(^|\.)(cdninstagram\.com|fbcdn\.net)$/;
const MAX_IMAGE = 10 * 1024 * 1024;

const NOT_SHARED = "Instagram didn't share this post. It may be private or removed, or Instagram may be busy.";

type Post = {
  account: string | null;
  postedOn: string | null;
  caption: string;
  cover: { jpeg: Buffer; aspect: number; frame: number | null } | null;
};

function meta(html: string, attribute: "name" | "property", key: string) {
  const m = html.match(new RegExp(`<meta\\s+${attribute}="${key}"\\s+content="([^"]*)"`));
  return m ? decodeEntities(m[1]) : null;
}

async function download(url: string): Promise<Buffer | null> {
  const response = await fetch(url, { headers: { "User-Agent": PREVIEW_BOT }, signal: AbortSignal.timeout(10_000), cache: "no-store" }).catch(() => null);
  if (!response?.ok) return null;
  const host = new URL(response.url).hostname;
  if (!IMAGE_HOSTS.test(host) || !response.headers.get("content-type")?.startsWith("image/")) return null;
  const body = Buffer.from(await response.arrayBuffer());
  return body.length <= MAX_IMAGE ? body : null;
}

/** The cover as a JPEG of just the picture (black bars cut off), up to 1280 wide, and its shape. */
async function coverFrom(image: Buffer): Promise<Post["cover"]> {
  try {
    const picture = sharp(image).rotate();
    const { width, height } = await picture.metadata();
    if (!width || !height) return null;
    const inner = await sharp(image)
      .rotate()
      .trim({ background: "#000000", threshold: 24 })
      .toBuffer({ resolveWithObject: true })
      .then(({ info }) => ({ width: info.width, height: info.height, left: -(info.trimOffsetLeft ?? 0), top: -(info.trimOffsetTop ?? 0) }))
      .catch(() => ({ width, height, left: 0, top: 0 }));
    const shape = shapeFromBars(width, height, inner);
    const cropped = shape.frame ? picture.extract(inner) : picture;
    const jpeg = await cropped.resize({ width: 1280, withoutEnlargement: true }).jpeg({ quality: 85, mozjpeg: true }).toBuffer();
    return { jpeg, ...shape };
  } catch {
    return null;
  }
}

async function readPost(link: InstagramLink): Promise<Post | null> {
  const page = await fetch(link.link, {
    headers: { "User-Agent": PREVIEW_BOT, "Accept-Language": "en-US,en;q=0.9" },
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  }).catch(() => null);
  if (!page?.ok || page.url.includes("/accounts/login")) return null;
  const html = await page.text();
  const description = meta(html, "name", "description");
  const summary = description ? parseDescription(description) : null;
  const ogImage = meta(html, "property", "og:image");
  if (!summary && !ogImage) return null;

  // The full-size cover first; the preview image (smaller, with a play button on it) if not.
  const image = (await download(`https://www.instagram.com/p/${link.code}/media/?size=l`)) ?? (ogImage ? await download(ogImage) : null);
  return {
    account: summary?.account ?? null,
    postedOn: summary?.postedOn ?? null,
    caption: (summary?.caption ?? "").slice(0, 5000),
    cover: image ? await coverFrom(image) : null,
  };
}

export type InstagramDraft = {
  link: string;
  account: string | null;
  postedOn: string | null;
  title: string;
  credits: Credit[];
  aspect: number | null;
  /** A small copy of the cover to check before saving. */
  preview: string | null;
};

/** Reads a pasted link into a draft to check. Nothing is saved. */
export async function readInstagramPost(input: string): Promise<{ ok: true; draft: InstagramDraft } | { ok: false; error: string; link?: string }> {
  const { user } = await getSession();
  if (!user) return { ok: false, error: "Sign in to add references." };
  const link = parseInstagramLink(input);
  if (!link) return { ok: false, error: "That isn't a link to an Instagram post or reel. Copy it from the post's Share or ⋯ menu." };
  const post = await readPost(link);
  if (!post) return { ok: false, error: NOT_SHARED, link: link.link };
  const { title, credits } = readCaption(post.caption, post.account ?? "");
  const preview = post.cover ? await sharp(post.cover.jpeg).resize({ width: 480, withoutEnlargement: true }).jpeg({ quality: 75 }).toBuffer() : null;
  return {
    ok: true,
    draft: {
      link: link.link,
      account: post.account,
      postedOn: post.postedOn,
      title,
      credits,
      aspect: post.cover?.aspect ?? null,
      preview: preview ? `data:image/jpeg;base64,${preview.toString("base64")}` : null,
    },
  };
}

export type ReferenceInput = { link: string; title: string; productionType: string | null; note: string; credits: Credit[] };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const HANDLE = /^[A-Za-z0-9._]{1,30}$/;

function cleanCredits(credits: unknown): Credit[] | null {
  if (!Array.isArray(credits) || credits.length > 100) return null;
  const out: Credit[] = [];
  for (const c of credits) {
    if (!c || typeof c.role !== "string" || typeof c.name !== "string") return null;
    const role = c.role.trim().slice(0, 40);
    const name = c.name.trim().slice(0, 200);
    if (!role || !name) continue;
    out.push(typeof c.handle === "string" && HANDLE.test(c.handle) ? { role, name, handle: c.handle } : { role, name });
  }
  return out;
}

/** Saves a checked draft to the project's references. The post is read again for its cover, so
 * what's stored comes from Instagram, not the browser. A post Instagram won't share is saved
 * with the title the person gave it and no cover. */
export async function addInstagramReference(projectId: string, input: ReferenceInput): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const { supabase, user } = await getSession();
  if (!user) return { ok: false, error: "Sign in to add references." };
  const link = parseInstagramLink(input.link);
  const title = input.title.trim();
  const note = input.note.trim();
  const credits = cleanCredits(input.credits);
  const productionType = input.productionType && (PRODUCTION_TYPES as readonly string[]).includes(input.productionType) ? input.productionType : null;
  if (!UUID.test(projectId) || !link || !credits) return { ok: false, error: "Something in this reference didn't read. Paste the link again." };
  if (!title || title.length > 120) return { ok: false, error: "Give the reference a title (up to 120 characters)." };
  if (note.length > 1000) return { ok: false, error: "Keep the note under 1,000 characters." };

  const slug = referenceSlug(link);
  const { data: existing } = await supabase
    .from("project_references")
    .select("id")
    .eq("project_id", projectId)
    .eq("kind", "instagram")
    .eq("title_slug", slug)
    .is("deleted_at", null)
    .maybeSingle();
  if (existing) return { ok: false, error: "This post is already in the project's references." };

  const post = await readPost(link);
  let coverPath: string | null = null;
  if (post?.cover) {
    const path = `${projectId}/references/${crypto.randomUUID()}.jpg`;
    const { error } = await supabase.storage.from("project-files").upload(path, post.cover.jpeg, { contentType: "image/jpeg" });
    if (error) return { ok: false, error: /row-level security|unauthorized|403/i.test(error.message) ? "Only people who can edit this project can add references." : `Couldn't save the cover: ${error.message}` };
    coverPath = path;
  }

  const { data, error } = await supabase
    .from("project_references")
    .insert({
      project_id: projectId,
      kind: "instagram",
      title_slug: slug,
      link: link.link,
      title,
      production_type: productionType,
      account: post?.account ?? null,
      posted_on: post?.postedOn ?? null,
      caption: post?.caption || null,
      credits,
      aspect: post?.cover?.aspect ?? null,
      frame: post?.cover?.frame ?? null,
      cover_path: coverPath,
      note: note || null,
    })
    .select("id")
    .single();
  if (error?.code === "23505") return { ok: false, error: "This post is already in the project's references." };
  if (error?.code === "42501") return { ok: false, error: "Only people who can edit this project can add references." };
  if (error?.code === "PGRST204" || error?.code === "42703" || error?.code === "23514") {
    return { ok: false, error: "Instagram references aren't switched on yet (migration 20261104000000 needs to run)." };
  }
  if (error) return { ok: false, error: `Couldn't add it: ${error.message}` };
  return { ok: true, id: data.id };
}
