"use client";

import { useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";
import { isMouse, pointerIn, useFrame } from "@/hooks/use-pointer";
import { getFilm, type Category, type CategoryItem } from "./explore-data";
import { PosterArt } from "./poster-art";
import { PressKitPreview } from "./press-kit-preview";

// Where the preview sits from the pointer (EXPLORE_SPEC.md), and its greatest tilt.
const OFFSET_X = 40;
const OFFSET_Y = -150;
const MAX_TILT = 8;

// Top 10 director's notes as a ranked list; choosing a row opens the film's preview. Pointing at a row brings it forward, greys the others
// and shows the film's poster beside the pointer, leaning with the pointer's speed. Keyboard focus
// (and reduced motion) shows the same poster, standing still beside the row.
export function DirectorsNotes({ category, bare = false }: { category: Category; bare?: boolean }) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState<string | null>(null);
  const [openItem, setOpenItem] = useState<CategoryItem | null>(null);
  const preview = useRef<HTMLDivElement>(null);
  const lastX = useRef<number | null>(null);
  const frame = useFrame();

  const place = (x: number, y: number, tilt = 0) => {
    if (preview.current) preview.current.style.transform = `translate(${x}px, ${y}px) rotate(${tilt}deg)`;
  };

  const onMove = (e: React.PointerEvent<HTMLElement>) => {
    if (reduce || !isMouse(e)) return;
    const { x, y } = pointerIn(e);
    const speed = lastX.current === null ? 0 : x - lastX.current;
    lastX.current = x;
    const tilt = Math.max(-MAX_TILT, Math.min(MAX_TILT, speed * 0.4));
    frame.next(() => place(x + OFFSET_X, y + OFFSET_Y, tilt));
  };

  const onLeave = () => {
    lastX.current = null;
    setActive(null);
  };

  // Beside the row instead of the pointer: keyboard focus, or reduced motion.
  const placeBeside = (row: HTMLElement) => {
    place(row.offsetWidth * 0.55, row.offsetTop + row.offsetHeight / 2 + OFFSET_Y);
  };

  const activeFilm = active ? getFilm(active) : null;

  return (
    <section
      aria-labelledby={`${category.id}-title`}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={bare ? "relative" : "relative mt-16"}
    >
      <h3 id={`${category.id}-title`} className={bare ? "sr-only" : "mb-3 text-subtitle font-semibold text-foreground"}>
        {category.title}
      </h3>
      <div aria-hidden className="flex gap-4 border-b border-border px-2 py-3 text-caption font-medium text-muted-foreground max-md:hidden">
        <span className="w-16">Rank</span>
        <span className="flex-1">Film</span>
        <span className="w-50">Director</span>
        <span className="w-37.5">Document</span>
        <span className="w-22.5" />
      </div>

      <ol
        className="group/list"
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setActive(null);
        }}
      >
        {category.items.map((item) => {
          const film = getFilm(item.filmId);
          return (
            <li key={item.filmId}>
              <button
                type="button"
                onClick={() => setOpenItem(item)}
                aria-haspopup="dialog"
                onPointerEnter={(e) => {
                  if (!isMouse(e)) return;
                  setActive(item.filmId);
                  if (reduce) placeBeside(e.currentTarget);
                }}
                onFocus={(e) => {
                  if (!e.currentTarget.matches(":focus-visible")) return;
                  setActive(item.filmId);
                  placeBeside(e.currentTarget);
                }}
                aria-label={`Number ${item.rank}: ${film.title}, ${film.director}, ${item.documentType}`}
                className="group/row flex min-h-18 w-full items-center gap-4 border-b border-secondary px-2 py-3 text-left text-foreground outline-none transition-colors duration-base ease-out focus-visible:ring-3 focus-visible:ring-ring/50 group-focus-within/list:text-nia-placeholder group-hover/list:text-nia-placeholder hover:text-foreground! focus-visible:text-foreground!"
              >
                <span className="w-10 text-h3 leading-none font-bold md:w-16 md:text-h1">{item.rank}</span>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-lead font-semibold tracking-tight transition-transform duration-glide ease-glide group-hover/row:translate-x-3.5 group-focus-visible/row:translate-x-3.5 md:text-h2 motion-reduce:translate-x-0!">
                    {film.title}
                  </span>
                  <span className="flex flex-wrap items-center gap-2 md:hidden">
                    <span className="text-small text-muted-foreground">{film.director}</span>
                    <DocumentPill type={item.documentType} />
                  </span>
                </span>
                <span className="w-50 text-sm text-muted-foreground max-md:hidden">{film.director}</span>
                <span className="w-37.5 max-md:hidden">
                  <DocumentPill type={item.documentType} />
                </span>
                <span className="inline-flex w-22.5 items-center gap-1.5 text-small font-semibold opacity-0 transition-opacity duration-base ease-out group-hover/row:opacity-100 group-focus-visible/row:opacity-100 max-md:hidden">
                  Open
                  <ArrowRight aria-hidden className="size-3.25" strokeWidth={2} />
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div
        ref={preview}
        aria-hidden
        className={cn(
          "pointer-events-none absolute top-0 left-0 z-10 aspect-[268/373] w-50 overflow-hidden rounded-lg shadow-card-hover transition-[transform,opacity] duration-glide ease-glide max-lg:hidden",
          activeFilm ? "opacity-100" : "opacity-0",
        )}
      >
        {activeFilm && <PosterArt film={activeFilm} sizes="200px" />}
      </div>
      {openItem && (
        <PressKitPreview
          item={openItem}
          list={category.items}
          onNavigate={setOpenItem}
          onClose={() => setOpenItem(null)}
          actionLabel={(i) => (i.documentType ? `Open ${i.documentType}` : "Open film page")}
        />
      )}
    </section>
  );
}

function DocumentPill({ type }: { type?: string }) {
  if (!type) return null;
  return (
    <span className="inline-flex h-6.5 items-center rounded-full bg-secondary px-2.5 text-caption font-medium text-secondary-foreground">
      {type}
    </span>
  );
}
