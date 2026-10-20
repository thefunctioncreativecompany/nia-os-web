"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { getFilm } from "./explore-data";
import { PosterArt } from "./poster-art";

// The design's ring, in its order.
const RING = [
  "sinners", "hamnet", "the-odyssey", "heart-of-the-hunter", "the-woman-king", "the-polygamist",
  "avatar-the-way-of-water", "the-dink", "blonde", "scream", "the-queens-gambit", "phantom",
  "michael", "500-days-of-summer",
].map(getFilm);

// Degrees per frame: the steady turn, and how much the pointer's side speeds it up or reverses it.
const SPIN = 0.07;
const STEER = 1.2;

// Explore, coming soon: Ika's Claude Design "ExploreSoon" as designed (2026-10-20). Fourteen
// posters on a ring that turns on its own; moving the pointer left or right steers it, up and down
// tilts it. A frosted card rises in over it. Platform font, colours, buttons and sentence case.
// Reduced motion stops the ring and the pulse.
export function ExploreComingSoon() {
  const reduce = useReducedMotion();
  const [angle, setAngle] = useState(0);
  const pointer = useRef({ x: 0.5, y: 0.5 });
  const [tilt, setTilt] = useState(0.5);
  const [waiting, setWaiting] = useState<boolean | null>(null);
  // Phones: the card fills the middle, so the ring stands taller to show above and below it.
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 40rem)");
    const update = () => setNarrow(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (reduce) return;
    let frame = 0;
    const tick = () => {
      setAngle((a) => (a + SPIN + (pointer.current.x - 0.5) * STEER) % 360);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reduce]);

  useEffect(() => {
    createClient()
      .from("feature_waitlist")
      .select("feature")
      .eq("feature", "explore")
      .then(({ data, error }) => setWaiting(error ? false : (data ?? []).length > 0));
  }, []);

  const toggle = async () => {
    const supabase = createClient();
    const next = !waiting;
    setWaiting(next);
    const { error } = next
      ? await supabase.from("feature_waitlist").insert({ feature: "explore" })
      : await supabase.from("feature_waitlist").delete().eq("feature", "explore");
    if (error && error.code !== "23505") {
      setWaiting(!next);
      toast.error("Couldn't save that. Try again.");
      return;
    }
    toast.success(next ? "We'll let you know when Explore opens." : "You won't get a note when Explore opens.");
  };

  const onMove = (e: React.PointerEvent) => {
    if (reduce || e.pointerType !== "mouse") return;
    const box = e.currentTarget.getBoundingClientRect();
    pointer.current = { x: (e.clientX - box.left) / box.width, y: (e.clientY - box.top) / box.height };
    setTilt(pointer.current.y);
  };
  const onLeave = () => {
    pointer.current = { x: 0.5, y: 0.5 };
    setTilt(0.5);
  };

  const radiusY = narrow ? 29 + tilt * 6 : 16 + tilt * 16;
  const cards = RING.map((film, i) => {
    const theta = ((angle + (i * 360) / RING.length) * Math.PI) / 180;
    const depth = (Math.sin(theta) + 1) / 2;
    return {
      film,
      style: {
        left: `${(50 + Math.cos(theta) * 41).toFixed(2)}%`,
        top: `${(50 + Math.sin(theta) * radiusY).toFixed(2)}%`,
        transform: `translate(-50%, -50%) scale(${(0.55 + 0.6 * depth).toFixed(3)})`,
        zIndex: Math.round(depth * 100),
        opacity: Number((0.35 + 0.65 * depth).toFixed(2)),
        filter: `blur(${(2 * (1 - depth)).toFixed(1)}px) saturate(${(0.5 + 0.5 * depth).toFixed(2)})`,
      },
    };
  });

  return (
    <div
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="relative isolate h-[calc(100svh-5rem)] min-h-140 touch-pan-y overflow-hidden bg-white"
    >
      {cards.map(({ film, style }) => (
        <div
          key={film.id}
          aria-hidden
          style={style}
          className="absolute aspect-[268/373] w-[clamp(7.5rem,13vw,10.625rem)] overflow-hidden rounded-lg bg-muted shadow-card"
        >
          <PosterArt film={film} sizes="170px" />
        </div>
      ))}

      <div className="absolute inset-0 z-[200] m-auto flex h-fit w-[calc(100%-5rem)] max-w-118 animate-explore-rise flex-col items-center gap-2.5 rounded-2xl border border-border bg-white/85 px-4 pt-4 pb-4 text-center sm:w-[calc(100%-2.5rem)] sm:gap-4 shadow-card-hover backdrop-blur-lg sm:px-9 sm:pt-9 sm:pb-8">
        <span className="inline-flex h-7 items-center gap-2 rounded-full border border-border px-3 text-caption font-medium text-muted-foreground">
          <span aria-hidden className="size-1.75 animate-explore-pulse rounded-full bg-status-confirmed-foreground" />
          Coming soon
        </span>
        <h1 className="text-h2 font-semibold sm:text-hero tracking-tight text-foreground">Explore</h1>
        <p className="max-w-90 text-small leading-relaxed text-muted-foreground sm:text-lead">
          Browse films, director&rsquo;s notes and electronic press kits from across Nia, then compare any two side by side. Opens February 2027.
        </p>
        <div className="mt-1 flex flex-wrap justify-center gap-2 sm:mt-1.5 sm:gap-2.5">
          {waiting ? (
            <Button variant="outline" onClick={() => void toggle()} aria-pressed className="max-sm:h-9 max-sm:px-4 max-sm:text-small">
              <Check aria-hidden /> We&rsquo;ll let you know
            </Button>
          ) : (
            <Button onClick={() => void toggle()} disabled={waiting === null} className="max-sm:h-9 max-sm:px-4 max-sm:text-small">
              Notify me
            </Button>
          )}
          <Button variant="outline" asChild className="max-sm:h-9 max-sm:px-4 max-sm:text-small">
            <Link href="/explore/preview">
              Preview Explore
              <ArrowRight aria-hidden data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
