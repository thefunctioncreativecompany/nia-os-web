import sharp from "sharp";

import stills from "@/features/explore/trailer-stills.json";

// A stand-in cover (Ika, 2026-10-31): the frame chosen from a title's official trailer
// (scripts/trailer-stills.mjs), its black bars cut off and cropped to the poster shape around
// the subject (chosen by eye), so every card shows the person or place, not the gap between. Serves only the frames in that list, never any other address. Ends in .jpg so
// the sign-in check (src/proxy.ts) skips it like any picture. The frame is in the address
// (/api/explore-still/<video>-<frame>/<slug>.jpg, see coverFor in made-in-africa.ts), so a new
// choice gets a new address and each can be cached for a year.
const STILLS = stills as Record<string, { id: string; size: string; top: number; bottom: number; left?: number; right?: number; x: number }>;
// Explore's poster shape (title-card.tsx).
const POSTER = 268 / 373;

export async function GET(_request: Request, { params }: { params: Promise<{ frame: string; file: string }> }) {
  const { frame, file } = await params;
  const still = STILLS[file.replace(/\.jpg$/, "")];
  // `-wide` (Recently added's mosaic): the whole frame, only its black bars cut.
  const wideFrame = frame === `${still?.id}-${still?.size}-wide`;
  if (!still || (frame !== `${still.id}-${still.size}` && !wideFrame)) return new Response("Not found", { status: 404 });

  const r = await fetch(`https://i.ytimg.com/vi/${still.id}/${still.size}.jpg`);
  if (!r.ok) return new Response("Not found", { status: 404 });
  const image = sharp(Buffer.from(await r.arrayBuffer()));
  const { width = 1280, height = 720 } = await image.metadata();
  // The picture inside its bars (top and bottom, and either side of a 4:3 film).
  const side = still.left ?? 0;
  const inner = width - side - (still.right ?? 0);
  const tall = height - still.top - still.bottom;
  const wide = wideFrame ? inner : Math.min(inner, Math.round(tall * POSTER));
  const left = side + Math.max(0, Math.min(inner - wide, Math.round(still.x * inner - wide / 2)));
  const body = await image
    .extract({ left, top: still.top, width: wide, height: tall })
    .jpeg({ quality: 88 })
    .toBuffer();
  return new Response(new Uint8Array(body), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable" },
  });
}
