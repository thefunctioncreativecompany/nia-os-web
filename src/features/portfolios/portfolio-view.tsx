"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Lightbox } from "@/components/nia/lightbox";
import type { Piece, Portfolio, PortfolioProject } from "./types";

// A published portfolio as visitors see it. The cover fills the screen (the one picture that's
// cropped, PORTFOLIOS_BUILD.md §1); after it, every piece is shown whole, at its own shape, in the
// gallery chosen: Grid (square cells, the picture fitted inside), Rows (one under another, full
// width) or Slides (one at a time). The page takes the portfolio's background; text and controls
// switch to light on a dark one.
export function PortfolioView({ portfolio: p, projects, cover, preview }: { portfolio: Portfolio; projects: PortfolioProject[]; cover: Piece | null; preview: boolean }) {
  const dark = isDark(p.background);
  const all = projects.flatMap((x) => x.pieces);
  return (
    <div style={{ backgroundColor: p.background }} className={cn("min-h-svh", dark ? "text-white" : "text-black/85")}>
      {preview && (
        <p className="sticky top-0 z-20 bg-nia-blue px-4 py-2 text-center text-small font-semibold text-nia-blue-foreground">Preview: not published, only people in your workspace can open this link.</p>
      )}

      <section aria-label="Cover" className="relative flex h-svh items-end overflow-hidden">
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element -- a private file's link that lasts an hour
          <img src={cover.url} alt="" className="absolute inset-0 size-full object-cover" />
        )}
        <span aria-hidden className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent" />
        <div className="relative flex flex-col gap-2 px-6 pb-12 text-white md:px-12 md:pb-16">
          <h1 className="text-h1 font-semibold tracking-tight">{p.title}</h1>
          {p.byline && <p className="text-lead text-white/85">{p.byline}</p>}
        </div>
      </section>

      <main className="flex flex-col gap-20 px-4 py-16 md:px-12">
        {p.template === "slides" ? <Slides pieces={all} dark={dark} /> : projects.map((project) => <ProjectBlock key={project.id} project={project} template={p.template} dark={dark} />)}
      </main>

      <footer className={cn("px-6 pb-10 text-center text-caption", dark ? "text-white/50" : "text-black/45")}>Made with NIA</footer>
    </div>
  );
}

function ProjectBlock({ project, template, dark }: { project: PortfolioProject; template: Portfolio["template"]; dark: boolean }) {
  const [open, setOpen] = useState<number | null>(null);
  const images = project.pieces.filter((x) => x.kind === "image");
  return (
    <section aria-labelledby={`project-${project.id}`} className="flex flex-col gap-6">
      <h2 id={`project-${project.id}`} className="text-subtitle font-semibold">
        {project.title}
      </h2>
      {template === "rows" ? (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          {project.pieces.map((x) => (
            <Media key={x.id} piece={x} className="h-auto w-full" />
          ))}
        </div>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,18rem),1fr))] gap-4">
          {project.pieces.map((x) => (
            <li key={x.id} className={cn("relative aspect-square overflow-hidden rounded-lg", dark ? "bg-white/5" : "bg-black/[0.03]")}>
              {x.kind === "image" ? (
                <button type="button" onClick={() => setOpen(images.indexOf(x))} aria-label={`Open ${x.name}`} className="absolute inset-0 outline-none focus-visible:ring-3 focus-visible:ring-nia-blue/60">
                  <Media piece={x} className="size-full object-contain" />
                </button>
              ) : (
                <Media piece={x} className="absolute inset-0 size-full object-contain" />
              )}
            </li>
          ))}
        </ul>
      )}
      <Lightbox
        images={images.map((x) => ({ src: x.url, alt: "", title: x.name }))}
        index={open ?? 0}
        onIndexChange={setOpen}
        open={open !== null}
        onOpenChange={(o) => !o && setOpen(null)}
      />
    </section>
  );
}

function Slides({ pieces, dark }: { pieces: Piece[]; dark: boolean }) {
  const [i, setI] = useState(0);
  const step = (by: number) => setI((n) => (n + by + pieces.length) % pieces.length);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setI((n) => (n + 1) % pieces.length);
      if (e.key === "ArrowLeft") setI((n) => (n - 1 + pieces.length) % pieces.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pieces.length]);
  const x = pieces[i];
  if (!x) return null;
  const control = cn("flex size-11 items-center justify-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-nia-blue/60", dark ? "bg-white/10 hover:bg-white/20" : "bg-black/5 hover:bg-black/10");
  return (
    <section aria-label="Slides" aria-roledescription="carousel" className="flex flex-col items-center gap-6">
      <div className="flex h-[78svh] w-full items-center justify-center">
        <Media key={x.id} piece={x} className="max-h-full max-w-full object-contain" />
      </div>
      <div className="flex items-center gap-4">
        <button type="button" onClick={() => step(-1)} aria-label="Previous" className={control}>
          <ChevronLeft aria-hidden />
        </button>
        <span aria-live="polite" className="min-w-16 text-center text-small tabular-nums">
          {i + 1} / {pieces.length}
        </span>
        <button type="button" onClick={() => step(1)} aria-label="Next" className={control}>
          <ChevronRight aria-hidden />
        </button>
      </div>
    </section>
  );
}

function Media({ piece, className }: { piece: Piece; className?: string }) {
  if (piece.kind === "video") return <video src={piece.url} controls playsInline preload="metadata" className={className} />;
  // eslint-disable-next-line @next/next/no-img-element -- a private file's link that lasts an hour
  return <img src={piece.url} alt={piece.name} loading="lazy" className={className} />;
}

// Light text on a dark background (black, or any dark colour later).
function isDark(hex: string) {
  const n = parseInt(hex.replace("#", ""), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 128;
}
