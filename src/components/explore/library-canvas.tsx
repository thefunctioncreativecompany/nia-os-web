"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";

import { cn } from "@/lib/utils";
import { ambienceOn, ambientLoop, setAmbienceOn, soundsOn, subscribeSounds } from "@/lib/sounds";
import { useMediaQuery } from "@/hooks/use-pointer";
import { exploreHome } from "@/features/explore/made-in-africa";
import { LIBRARY, type LibraryItem } from "@/features/explore/library";
import type { CategoryItem } from "./explore-data";
import { features } from "@/lib/features";
import { ExploreAllViews } from "./explore-all-views";
import { PressKitPreview } from "./press-kit-preview";

// The gap between posters, as on Explore all's grid (0.8125rem).
const GAP = 13;
// Poster shape (height ÷ width), as on Explore all's grid.
const RATIO = 373 / 268;
// Every title appears once in any run of LIBRARY.length posters across; going down, each row
// starts this many titles further on, so the same poster never sits above or beside itself.
const N = LIBRARY.length;
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
const STRIDE = (() => {
  let s = Math.round(N * 0.382);
  while (gcd(s, N) !== 1) s++;
  return s;
})();
const mod = (a: number, n: number) => ((a % n) + n) % n;
// A tile's height at a given width: a creator film at its true shape, as in the Creators
// gallery, a poster at the poster shape.
const heightOf = (item: LibraryItem, w: number) => Math.round(item.aspect ? w / item.aspect : w * RATIO);

// The columns on screen, and the stretch of the canvas (top to bottom) they need to fill.
type Range = { c0: number; c1: number; top: number; bottom: number };

// Explore all (Ika, 2026-10-21): the whole library on one canvas that goes on in every direction,
// like Marketplace's coming-soon field but with posters as close as Explore all's grid, odd
// columns stepped down. Columns are a masonry like the Creators gallery (Ika, 2026-10-23): each
// tile as tall as its shape needs, so a 9:16 reel stands tall and a wide film lies flat. Drag it (it glides on after a flick), scroll with a trackpad or wheel, or
// use the arrow keys. Only the posters in view are drawn. A poster lifts and shows its name when
// pointed at; a click opens it (a drag never does). Reduced motion: no glide, no lift.
export function LibraryCanvas() {
  const reduce = useReducedMotion();
  const phone = useMediaQuery("(max-width: 47.99rem)");
  const touch = useMediaQuery("(pointer: coarse)");
  const tileW = phone ? 132 : 208;
  const cw = tileW + GAP;
  // A poster's row: the step for the arrow keys and for working out what's in view.
  const ch = Math.round(tileW * RATIO) + GAP;
  const stagger = Math.round(ch * 0.42);
  // Every column runs through the whole library once per N rows, so each column repeats every
  // `period` pixels; `tops` is where each of a column's N rows starts within that stretch.
  const { period, tops } = useMemo(() => {
    const cache = new Map<number, number[]>();
    const tops = (c: number) => {
      const key = mod(c, N);
      let list = cache.get(key);
      if (!list) {
        list = [0];
        for (let r = 0; r < N; r++) list.push(list[r] + heightOf(LIBRARY[mod(key + r * STRIDE, N)], tileW) + GAP);
        cache.set(key, list);
      }
      return list;
    };
    return { period: tops(0)[N], tops };
  }, [tileW]);

  const box = useRef<HTMLElement>(null);
  const plane = useRef<HTMLDivElement>(null);
  const offset = useRef({ x: 0, y: 0 });
  const [range, setRange] = useState<Range | null>(null);
  const [open, setOpen] = useState<CategoryItem | null>(null);
  const drag = useRef<{ id: number; x: number; y: number; moved: boolean; t: number; vx: number; vy: number } | null>(null);
  const glide = useRef(0);
  const suppressClick = useRef(false);

  // Which columns and rows are on screen, with a poster to spare on every side.
  const apply = useCallback(() => {
    const el = box.current;
    if (!el || !plane.current) return;
    const { x, y } = offset.current;
    plane.current.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    const next = {
      c0: Math.floor(-x / cw) - 1,
      c1: Math.ceil((el.clientWidth - x) / cw) + 1,
      top: (Math.floor(-y / ch) - 2) * ch,
      bottom: (Math.ceil((el.clientHeight - y) / ch) + 1) * ch,
    };
    setRange((r) => (r && r.c0 === next.c0 && r.c1 === next.c1 && r.top === next.top && r.bottom === next.bottom ? r : next));
  }, [cw, ch]);

  const pan = useCallback(
    (dx: number, dy: number) => {
      offset.current = { x: offset.current.x + dx, y: offset.current.y + dy };
      apply();
    },
    [apply],
  );

  // Start with the columns centred and a little room at the top.
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    offset.current = { x: Math.round((el.clientWidth % cw) / 2 + GAP / 2), y: 24 };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(el);
    return () => observer.disconnect();
  }, [apply, cw]);

  // Trackpads and wheels move the canvas, not the page.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return;
      e.preventDefault();
      cancelAnimationFrame(glide.current);
      pan(-e.deltaX, -e.deltaY);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [pan]);

  useEffect(() => () => cancelAnimationFrame(glide.current), []);

  // The film pop-up is portalled but its events still bubble here; only the canvas's own count.
  const own = (e: React.SyntheticEvent) => !!box.current?.contains(e.target as Node);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || !own(e)) return;
    cancelAnimationFrame(glide.current);
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false, t: e.timeStamp, vx: 0, vy: 0 };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < 6) return;
    if (!d.moved) {
      // From here on it's a drag: keep the pointer, and the click that ends it opens nothing.
      d.moved = true;
      box.current?.setPointerCapture(e.pointerId);
    }
    const dt = Math.max(1, e.timeStamp - d.t);
    d.vx = 0.8 * (dx / dt) + 0.2 * d.vx;
    d.vy = 0.8 * (dy / dt) + 0.2 * d.vy;
    d.x = e.clientX;
    d.y = e.clientY;
    d.t = e.timeStamp;
    pan(dx, dy);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    if (!d.moved) return;
    suppressClick.current = true;
    if (reduce) return;
    // Glide on after a flick, slowing to a stop.
    let vx = d.vx * 16;
    let vy = d.vy * 16;
    const step = () => {
      vx *= 0.92;
      vy *= 0.92;
      if (Math.hypot(vx, vy) < 0.3) return;
      pan(vx, vy);
      glide.current = requestAnimationFrame(step);
    };
    glide.current = requestAnimationFrame(step);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const moves: Record<string, [number, number]> = { ArrowLeft: [cw, 0], ArrowRight: [-cw, 0], ArrowUp: [0, ch], ArrowDown: [0, -ch] };
    const m = moves[e.key];
    if (!m || !own(e)) return;
    e.preventDefault();
    pan(...m);
  };

  const cells: { key: string; item: LibraryItem; x: number; y: number; h: number }[] = [];
  if (range) {
    for (let c = range.c0; c <= range.c1; c++) {
      const list = tops(c);
      const shift = mod(c, 2) ? stagger : 0;
      // The first row that reaches into view: whole repeats of the column, then a step through one.
      const start = range.top - shift;
      let r = Math.floor(start / period) * N;
      while (list[mod(r + 1, N)] + Math.floor((r + 1) / N) * period <= start) r++;
      for (; ; r++) {
        const y = Math.floor(r / N) * period + list[mod(r, N)] + shift;
        if (y > range.bottom) break;
        const item = LIBRARY[mod(c + r * STRIDE, N)];
        cells.push({ key: `${c}:${r}`, item, x: c * cw, y, h: heightOf(item, tileW) });
      }
    }
  }

  return (
    <section
      ref={box}
      aria-label={`Explore all: ${N} titles on a canvas you can move in any direction`}
      aria-describedby="library-help"
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClickCapture={(e) => {
        if (!suppressClick.current || !own(e)) return;
        suppressClick.current = false;
        e.preventDefault();
        e.stopPropagation();
      }}
      onKeyDown={onKeyDown}
      className="relative isolate h-[calc(100svh-5rem)] min-h-140 cursor-grab touch-none overflow-hidden bg-nia-canvas outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset active:cursor-grabbing"
    >
      <div ref={plane} className="absolute top-0 left-0 will-change-transform">
        {cells.map(({ key, item, x, y, h }) => (
          <Tile key={key} item={item} x={x} y={y} w={tileW} h={h} onFilm={(filmId) => setOpen({ filmId })} />
        ))}
      </div>

      {/* Where you are, and the way back. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-wrap items-center justify-between gap-3 p-4 md:p-6">
        <Link
          href={exploreHome()}
          className="pointer-events-auto rounded-full bg-card/90 px-4 py-2 text-sm leading-[1.4] font-bold text-muted-foreground shadow-card outline-none backdrop-blur-sm hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          ← Back to Explore
        </Link>
        <div className="flex items-center gap-2">
          <Ambience />
          <h1 className="sr-only">Explore all</h1>
          {features.exploreQuickViewShown && <ExploreAllViews current="canvas" />}
        </div>
      </div>
      <p id="library-help" className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-card/90 px-4 py-2 text-caption text-muted-foreground shadow-card backdrop-blur-sm max-lg:bottom-28">
        {touch ? "Drag to explore" : "Drag, scroll or use the arrow keys to explore"}
      </p>

      {open && (
        <PressKitPreview
          item={open}
          list={LIBRARY.flatMap((i) => (i.open.kind === "film" ? [{ filmId: i.open.filmId }] : []))}
          onNavigate={setOpen}
          onClose={() => setOpen(null)}
          actionLabel={() => "Open film page"}
        />
      )}
    </section>
  );
}

// The canvas's ambience (Ika, 2026-10-22): a quiet screening-room tone that fades in while you're
// on Explore all and out when you leave or switch tabs, with a button to turn it off (remembered
// on this device). Hidden when interface sounds are off in Settings.
function Ambience() {
  const sounds = useSyncExternalStore(subscribeSounds, soundsOn, () => false);
  const on = useSyncExternalStore(subscribeSounds, ambienceOn, () => false);

  useEffect(() => {
    if (!sounds || !on) return;
    const loop = ambientLoop("/sounds/explore-ambient.mp3", 2);
    void loop.start();
    // Browsers hold sound until someone interacts; the first tap or key starts it.
    const wake = () => void loop.start();
    const visibility = () => (document.hidden ? loop.stop() : void loop.start());
    window.addEventListener("pointerdown", wake);
    window.addEventListener("keydown", wake);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      loop.stop();
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("keydown", wake);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [sounds, on]);

  if (!sounds) return null;
  const Icon = on ? Volume2 : VolumeX;
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label="Background sound"
      onClick={() => setAmbienceOn(!on)}
      className="pointer-events-auto flex size-9 items-center justify-center rounded-full bg-card/90 text-muted-foreground shadow-card backdrop-blur-sm outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Icon aria-hidden className="size-4" />
    </button>
  );
}

// One tile on the canvas, at its shape: a title page link, or a button that opens the film's pop-up.
function Tile({ item, x, y, w, h, onFilm }: { item: LibraryItem; x: number; y: number; w: number; h: number; onFilm: (filmId: string) => void }) {
  const className = cn(
    "group absolute overflow-hidden rounded-lg text-left text-foreground shadow-card outline-none transition-[scale,box-shadow] duration-lift ease-glide hover:z-[3] hover:scale-104 hover:shadow-card-hover focus-visible:z-[3] focus-visible:scale-104 focus-visible:shadow-card-hover focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:hover:scale-100 motion-reduce:focus-visible:scale-100",
    item.image ? "bg-muted" : item.grain,
  );
  const body = (
    <>
      {item.image ? (
        <Image src={item.image} alt="" fill sizes={`${w}px`} quality={90} draggable={false} className="pointer-events-none object-cover" />
      ) : (
        <span aria-hidden className="absolute inset-x-0 bottom-0 p-3 text-lead leading-tight font-bold">
          {item.title}
        </span>
      )}
      <span
        aria-hidden
        className="absolute inset-x-2 bottom-2 flex translate-y-1.5 flex-col rounded-md bg-card/95 px-2.5 py-1.75 opacity-0 transition-[opacity,translate] duration-base ease-glide group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
      >
        <span className="truncate text-caption font-semibold">{item.title}</span>
        <span className="truncate text-micro text-muted-foreground">{item.credit}</span>
      </span>
    </>
  );
  const style = { left: x, top: y, width: w, height: h };
  const label = `${item.title}, ${item.credit}`;
  return item.open.kind === "page" ? (
    <Link href={item.open.href} aria-label={label} draggable={false} style={style} className={className}>
      {body}
    </Link>
  ) : (
    <button type="button" aria-label={label} aria-haspopup="dialog" style={style} className={className} onClick={() => item.open.kind === "film" && onFilm(item.open.filmId)}>
      {body}
    </button>
  );
}
