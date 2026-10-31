"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, m, useReducedMotion, type PanInfo } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { DURATION, EASE_OUT } from "@/lib/motion";
import { useMediaQuery } from "@/hooks/use-pointer";
import { Button } from "@/components/ui/button";
import { exploreHome } from "@/features/explore/made-in-africa";
import { LIBRARY, type LibraryItem } from "@/features/explore/library";
import { quickFacts } from "@/features/explore/quick-view";
import type { CategoryItem } from "./explore-data";
import { ExploreAllViews } from "./explore-all-views";
import { PressKitPreview } from "./press-kit-preview";

// Poster shape (width ÷ height), as on the canvas.
const POSTER = 268 / 373;
const N = LIBRARY.length;
const at = (i: number) => LIBRARY[((i % N) + N) % N];

// Explore all's quick view (Ika, 2026-10-30): the same library as the canvas, one title at a
// time at its true shape, with what it is, a line about it and a few tags beside it. Swipe or
// drag left and right, use the arrow keys or the buttons at either side; it goes round from the
// last title to the first. Open goes to the title's page (Explore's films open their pop-up).
// Reduced motion: the next title appears without sliding.
export function LibraryQuickView() {
  const reduce = useReducedMotion();
  const touch = useMediaQuery("(pointer: coarse)");
  // Below wide screens the details sit under the picture, so the picture is shorter to keep both in view.
  const stacked = useMediaQuery("(max-width: 63.99rem)");
  const [{ index, direction }, setPlace] = useState({ index: 0, direction: 1 });
  const [film, setFilm] = useState<CategoryItem | null>(null);
  const item = at(index);
  const facts = quickFacts(item);

  const go = useCallback((by: 1 | -1) => setPlace((p) => ({ index: p.index + by, direction: by })), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (film || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, film]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -80 || info.velocity.x < -500) go(1);
    else if (info.offset.x > 80 || info.velocity.x > 500) go(-1);
  };

  const slide = reduce ? 0 : 48;
  const open = (i: LibraryItem) =>
    i.open.kind === "page" ? (
      <Button asChild>
        <Link href={i.open.href}>
          Open <ArrowRight aria-hidden data-icon="inline-end" />
        </Link>
      </Button>
    ) : (
      <Button onClick={() => i.open.kind === "film" && setFilm({ filmId: i.open.filmId })}>
        Open <ArrowRight aria-hidden data-icon="inline-end" />
      </Button>
    );

  return (
    <section aria-roledescription="carousel" aria-label="Explore all, one title at a time" className="relative flex min-h-[calc(100svh-5rem)] flex-col bg-nia-canvas">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 md:p-6">
        <Link
          href={exploreHome()}
          className="rounded-full bg-card/90 px-4 py-2 text-sm leading-[1.4] font-bold text-muted-foreground shadow-card outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          ← Back to Explore
        </Link>
        <div className="flex items-center gap-2">
          <h1 className="sr-only">Explore all</h1>
          <ExploreAllViews current="quick" />
        </div>
      </div>

      <div className="flex flex-1 items-start justify-center gap-4 px-4 pb-36 md:gap-8 md:px-6 lg:items-center lg:pb-10">
        <NavButton side="left" onClick={() => go(-1)} />

        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <m.article
            key={index}
            aria-roledescription="slide"
            aria-label={`${item.title}, ${(((index % N) + N) % N) + 1} of ${N}`}
            custom={direction}
            variants={{
              enter: (d: number) => ({ opacity: 0, x: d * slide }),
              center: { opacity: 1, x: 0 },
              exit: (d: number) => ({ opacity: 0, x: d * -slide }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: DURATION.base, ease: EASE_OUT }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.6}
            onDragEnd={onDragEnd}
            className="flex w-full max-w-5xl cursor-grab touch-pan-y flex-col items-center gap-6 select-none active:cursor-grabbing lg:flex-row lg:items-center lg:gap-12"
          >
            <div
              className={cn("relative w-full max-w-80 shrink-0 overflow-hidden rounded-xl shadow-card-hover lg:max-w-none", item.image ? "bg-muted" : item.grain)}
              style={{ aspectRatio: item.aspect ?? POSTER, height: stacked ? "min(44svh, 26rem)" : "min(62svh, 40rem)", width: "auto", maxWidth: "100%" }}
            >
              {item.image ? (
                <Image src={item.image} alt={item.title} fill priority sizes="(min-width: 64rem) 40vw, 80vw" quality={90} draggable={false} className="pointer-events-none object-cover" />
              ) : (
                <span className="absolute inset-x-0 bottom-0 p-5 text-h3 leading-tight font-bold text-foreground">{item.title}</span>
              )}
            </div>

            <div className="flex w-full max-w-md flex-col gap-3 rounded-2xl bg-card/90 p-5 shadow-card lg:p-6">
              {facts.meta && <span className="text-small text-muted-foreground">{facts.meta}</span>}
              <h2 className="text-h3 leading-tight font-bold text-foreground">{item.title}</h2>
              <span className="text-sm font-medium text-foreground/80">{item.credit}</span>
              {facts.note && <p className="line-clamp-4 text-sm leading-relaxed text-foreground/80">{facts.note}</p>}
              {facts.tags.length > 0 && (
                <ul aria-label="Tags" className="flex flex-wrap gap-1.5">
                  {facts.tags.map((t) => (
                    <li key={t} className="rounded-full border border-border px-2.5 py-1 text-caption text-muted-foreground">
                      {t}
                    </li>
                  ))}
                </ul>
              )}
              <div className="pt-1">{open(item)}</div>
            </div>
          </m.article>
        </AnimatePresence>

        <NavButton side="right" onClick={() => go(1)} />
      </div>

      {/* The next titles' pictures, fetched ahead so a swipe never waits. */}
      <div aria-hidden className="pointer-events-none fixed -left-[9999px] size-px overflow-hidden">
        {[1, 2, -1].map((by) => {
          const next = at(index + by);
          return next.image ? <Image key={next.key} src={next.image} alt="" width={400} height={560} quality={90} /> : null;
        })}
      </div>

      <p className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-card/90 px-4 py-2 text-caption text-muted-foreground shadow-card max-lg:bottom-28">
        {touch ? "Swipe left or right" : "Drag, or use the arrow keys"}
      </p>

      {film && (
        <PressKitPreview
          item={film}
          list={LIBRARY.flatMap((i) => (i.open.kind === "film" ? [{ filmId: i.open.filmId }] : []))}
          onNavigate={setFilm}
          onClose={() => setFilm(null)}
          actionLabel={() => "Open film page"}
        />
      )}
    </section>
  );
}

function NavButton({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Previous title" : "Next title"}
      className="hidden size-12 shrink-0 items-center justify-center rounded-full border border-border bg-card/95 text-foreground shadow-elevation-2 outline-none transition-colors duration-fast hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/50 md:flex"
    >
      <Icon aria-hidden className="size-5" />
    </button>
  );
}
