import sharp from "sharp";

// Nia's own image resizer (Ika, 2026-11-09; src/lib/image-loader.ts): fetches a picture from Nia
// itself or the few places Nia's pictures come from, resizes it to the width asked for and sends it
// as WebP. Vercel's network keeps each answer for a year, so a picture at a size is made once.
// Only the widths next/image asks for, and only those sources, so it can't be used to fetch or
// resize anything else.
const WIDTHS = new Set([16, 32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840]);
const QUALITIES = new Set([75, 90]);
const REMOTE = [
  // Project covers and profile photos in Supabase Storage (public buckets only).
  (u: URL) => u.hostname.endsWith(".supabase.co") && u.pathname.startsWith("/storage/v1/object/public/"),
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
  if (!WIDTHS.has(width) || !QUALITIES.has(quality) || !src) return notFound();

  let from: URL;
  if (src.startsWith("/") && !src.startsWith("//")) {
    // Nia's own files (public/ and the bundled pictures), never its other routes.
    if (src.startsWith("/api/")) return notFound();
    from = new URL(src, request.url);
  } else {
    try {
      from = new URL(src);
    } catch {
      return notFound();
    }
    if (from.protocol !== "https:" || !REMOTE.some((ok) => ok(from))) return notFound();
  }

  const r = await fetch(from, { signal: AbortSignal.timeout(15000) }).catch(() => null);
  if (!r?.ok) return notFound();
  try {
    const body = await sharp(Buffer.from(await r.arrayBuffer()))
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality })
      .toBuffer();
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
