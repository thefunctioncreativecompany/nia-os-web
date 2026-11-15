import { fetchImage, safeSharp } from "@/lib/fetch-image";

// Nia's own image resizer (Ika, 2026-11-09; src/lib/image-loader.ts): fetches a picture from Nia
// itself or the few places Nia's pictures come from, resizes it to the width asked for and sends it
// as WebP. Vercel's network keeps each answer for a year, so a picture at a size is made once.
// Only the widths next/image asks for, and only those sources, so it can't be used to fetch or
// resize anything else. Downloads go through fetchImage (size cap, pictures only, no redirects)
// and sharp's pixel limit (security audit, 2026-11-15).
const WIDTHS = new Set([16, 32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840]);
const QUALITIES = new Set([75, 90]);
// Nia's own Supabase project only (any *.supabase.co was allowed before the audit).
const SUPABASE_HOST = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : null;
const REMOTE = [
  // Project covers and profile photos in Supabase Storage (public buckets only).
  (u: URL) => u.hostname === SUPABASE_HOST && u.pathname.startsWith("/storage/v1/object/public/"),
  // YouTube's own video thumbnails (Explore), fetched here so the browser doesn't contact YouTube.
  (u: URL) => u.hostname === "i.ytimg.com" && u.pathname.startsWith("/vi/"),
  // Film people's free photos on Wikimedia Commons.
  (u: URL) => u.hostname === "upload.wikimedia.org" && u.pathname.startsWith("/wikipedia/commons/"),
];

const notFound = () => new Response("Not found", { status: 404 });

export async function GET(request: Request, { params }: { params: Promise<{ w: string; q: string; file: string }> }) {
  const { w, q } = await params;
  const width = Number(w);
  const quality = Number(q);
  const src = new URL(request.url).searchParams.get("u");
  if (!WIDTHS.has(width) || !QUALITIES.has(quality) || !src || src.length > 2000) return notFound();

  let from: URL;
  try {
    from = new URL(src, request.url);
  } catch {
    return notFound();
  }
  const self = new URL(request.url);
  if (src.startsWith("/")) {
    // Nia's own files (public/ and the bundled pictures), never its other routes. Checked after
    // reading the address, since "/\evil.example" reads as another site.
    if (from.origin !== self.origin || from.pathname.startsWith("/api/")) return notFound();
  } else if (from.protocol !== "https:" || !REMOTE.some((ok) => ok(from))) {
    return notFound();
  }

  const picture = await fetchImage(from);
  if (!picture) return notFound();
  try {
    const body = await safeSharp(picture).rotate().resize({ width, withoutEnlargement: true }).webp({ quality }).toBuffer();
    return new Response(new Uint8Array(body), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
      },
    });
  } catch {
    return notFound();
  }
}
