"use client";

import { use, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";
import { isMouse, pointerIn, useFrame } from "@/hooks/use-pointer";
import { exploreItem } from "@/features/explore/items";

// Top 10 on Explore (Ika, 2026-10-31; src/features/explore/top.ts): what people on Nia open, save
// and add to projects most, ranked again on every visit. Each row is the rank, the title, and
// its production type and year (Ika: titles only, the cover on hover as before). Pointing at a
// row shows its cover beside the pointer, leaning with the pointer's speed; keyboard focus (and
// reduced motion) shows it standing still beside the row.

// Where the cover sits from the pointer, and its greatest tilt (as the director's notes had).
const OFFSET_X = 40;
const OFFSET_Y = -150;
const MAX_TILT = 8;

export function TopTen({ top }: { top: Promise<string[]> }) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState<string | null>(null);
  const preview = useRef<HTMLDivElement>(null);
  const lastX = useRef<number | null>(null);
  const frame = useFrame();
  const items = use(top).flatMap((slug) => {
    const item = exploreItem(slug);
    return item ? [item] : [];
  });
  const shown = items.find((i) => i.slug === active) ?? null;

  const place = (x: number, y: number, tilt = 0) => {
    if (preview.current) preview.current.style.transform = `translate(${x}px, ${y}px) rotate(${tilt}deg)`;
  };
  const onMove = (e: React.PointerEvent<HTMLElement>) => {
    if (reduce || !isMouse(e)) return;
    const { x, y } = pointerIn(e);
    const speed = lastX.current === null ? 0 : x - lastX.current;
    lastX.current = x;
    frame.next(() => place(x + OFFSET_X, y + OFFSET_Y, Math.max(-MAX_TILT, Math.min(MAX_TILT, speed * 0.4))));
  };
  const placeBeside = (row: HTMLElement) => place(row.offsetWidth * 0.55, row.offsetTop + row.offsetHeight / 2 + OFFSET_Y);

  return (
    <div
      className="relative"
      onPointerMove={onMove}
      onPointerLeave={() => {
        lastX.current = null;
        setActive(null);
      }}
    >
      <ol
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setActive(null);
        }}
      >
        {items.map((item, i) => (
          <li key={item.slug}>
            <Link
              href={item.href()}
              onPointerEnter={(e) => {
                if (!isMouse(e)) return;
                setActive(item.slug);
                if (reduce) placeBeside(e.currentTarget);
              }}
              onFocus={(e) => {
                if (!e.currentTarget.matches(":focus-visible")) return;
                setActive(item.slug);
                placeBeside(e.currentTarget);
              }}
              className="group/row flex min-h-18 items-center gap-4 border-b border-secondary px-2 py-3 text-foreground outline-none transition-colors duration-base ease-out hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
            >
              <span className="w-10 shrink-0 text-h3 leading-none font-bold tabular-nums md:w-16 md:text-h1">{i + 1}</span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-lead font-semibold tracking-tight transition-transform duration-glide ease-glide group-hover/row:translate-x-3.5 group-focus-visible/row:translate-x-3.5 motion-reduce:translate-x-0! md:text-h3">
                  {item.title}
                </span>
                {/* Its production type and year only ("Commercial · 2026"). */}
                <span className="text-small text-muted-foreground">{item.meta.split(" · ").slice(0, 2).join(" · ")}</span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-1.5 text-small font-semibold opacity-0 transition-opacity duration-base ease-out group-hover/row:opacity-100 group-focus-visible/row:opacity-100 max-md:hidden">
                Open
                <ArrowRight aria-hidden className="size-3.25" strokeWidth={2} />
              </span>
            </Link>
          </li>
        ))}
      </ol>

      {/* The cover beside the pointer (wide screens): a poster, or a film at its own shape. */}
      <div
        ref={preview}
        aria-hidden
        className={cn(
          "pointer-events-none absolute top-0 left-0 z-10 w-50 overflow-hidden rounded-lg shadow-card-hover transition-[transform,opacity] duration-glide ease-glide max-lg:hidden",
          shown ? "opacity-100" : "opacity-0",
          shown && !shown.image && shown.grain,
        )}
        style={{ aspectRatio: shown?.aspect ?? 268 / 373 }}
      >
        {shown?.image && <Image src={shown.image} alt="" fill sizes="200px" className="object-cover" />}
      </div>
    </div>
  );
}
