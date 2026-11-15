import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { connection } from "next/server";

import { publicPreview } from "@/features/portfolios/data";

// A portfolio link's preview in messages and email (PORTFOLIOS_BUILD.md P8; Ika: the shared link's
// thumbnail is the cover): the cover framed as the owner framed it, with the title and name. Only
// published portfolios show theirs; anything else gets the plain NIA card, so a preview never shows
// what the link wouldn't.
export const alt = "A portfolio on Nia";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  // Read on each request, so publishing or a new cover shows straight away.
  await connection();
  const { slug } = await params;
  const [preview, bold, regular] = await Promise.all([
    publicPreview(slug),
    readFile(join(process.cwd(), "public/fonts/Geist-Bold.ttf")),
    readFile(join(process.cwd(), "public/fonts/Geist-Regular.ttf")),
  ]);
  const fonts = [
    { name: "Geist", data: bold, weight: 700 as const, style: "normal" as const },
    { name: "Geist", data: regular, weight: 400 as const, style: "normal" as const },
  ];

  if (!preview) {
    return new ImageResponse(
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "black", color: "white", fontFamily: "Geist", fontSize: 96, fontWeight: 700, letterSpacing: 8 }}>
        NIA
      </div>,
      { ...size, fonts },
    );
  }

  const { title, byline, cover, frame } = preview;
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "black", fontFamily: "Geist" }}>
      {cover && (
        <img
          src={cover}
          alt=""
          width={1200}
          height={630}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: `${frame.x}% ${frame.y}%`, transform: `scale(${frame.z})`, transformOrigin: `${frame.x}% ${frame.y}%` }}
        />
      )}
      <div style={{ position: "absolute", inset: 0, display: "flex", background: "linear-gradient(to top, rgba(0,0,0,0.65), rgba(0,0,0,0) 55%)" }} />
      <div style={{ position: "absolute", left: 64, right: 64, bottom: 56, display: "flex", flexDirection: "column", color: "white" }}>
        <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.1 }}>{title}</div>
        {byline && <div style={{ fontSize: 30, opacity: 0.85, marginTop: 12 }}>{byline}</div>}
      </div>
      <div style={{ position: "absolute", top: 48, right: 64, color: "white", fontSize: 28, fontWeight: 700, letterSpacing: 4, opacity: 0.9 }}>NIA</div>
    </div>,
    { ...size, fonts },
  );
}
