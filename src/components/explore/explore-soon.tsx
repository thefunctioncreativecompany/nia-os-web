"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Check } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { HERO_SET } from "@/components/auth/hero-images";
import { DURATION, EASE_OUT } from "@/lib/motion";
import { createClient } from "@/lib/supabase/client";

const CARDS = 14;

// Explore, coming soon (Ika's Claude Design "ExploreSoon", 2026-10-19): a ring of stills around a
// frosted panel. Adapted to the rules: Geist, sentence case, a still gold dot, and the ring turns
// only while the pointer moves across it (or a finger drags), never on its own. Stills are Ika's
// set from the sign-in screens.
export function ExploreSoon() {
  const reduce = useReducedMotion();
  const [angle, setAngle] = useState(0);
  const [tilt, setTilt] = useState(0.5);
  const last = useRef<number | null>(null);
  const [waiting, setWaiting] = useState<boolean | null>(null);
  // Phones: the panel fills the middle, so the ring stands taller to show above and below it.
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 40rem)");
    const update = () => setNarrow(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

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
    if (reduce) return;
    const box = e.currentTarget.getBoundingClientRect();
    if (last.current !== null) setAngle((a) => (a + (e.clientX - last.current!) * 0.18) % 360);
    last.current = e.clientX;
    setTilt((e.clientY - box.top) / box.height);
  };
  const onLeave = () => {
    last.current = null;
    setTilt(0.5);
  };

  const radiusY = narrow ? 29 + tilt * 6 : 16 + tilt * 16;
  const cards = Array.from({ length: CARDS }, (_, i) => {
    const theta = ((angle + (i * 360) / CARDS) * Math.PI) / 180;
    const depth = (Math.sin(theta) + 1) / 2;
    return {
      still: HERO_SET[i % HERO_SET.length],
      style: {
        left: `${50 + Math.cos(theta) * 41}%`,
        top: `${50 + Math.sin(theta) * radiusY}%`,
        transform: `translate(-50%, -50%) scale(${0.55 + 0.6 * depth})`,
        zIndex: Math.round(depth * 100),
        opacity: 0.35 + 0.65 * depth,
        filter: `blur(${2 * (1 - depth)}px) saturate(${0.5 + 0.5 * depth})`,
      },
    };
  });

  return (
    <div
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="relative isolate h-[calc(100svh-5rem)] min-h-140 touch-pan-y overflow-hidden bg-white"
    >
      {cards.map(({ still, style }, i) => (
        <div
          key={i}
          aria-hidden
          style={style}
          className="absolute aspect-[268/373] w-[clamp(5.5rem,13vw,10.625rem)] overflow-hidden rounded-lg bg-muted shadow-card"
        >
          <Image src={still.src} alt="" fill sizes="170px" className="object-cover" style={{ objectPosition: still.position }} />
        </div>
      ))}

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DURATION.slow, ease: EASE_OUT }}
        className="absolute inset-0 z-[200] m-auto flex h-fit w-[calc(100%-2.5rem)] max-w-118 flex-col items-center gap-4 rounded-2xl border border-border bg-white/85 px-6 pt-7 pb-6 sm:px-9 sm:pt-9 sm:pb-8 text-center shadow-card backdrop-blur-lg"
      >
        <span className="inline-flex h-7 items-center gap-2 rounded-full border border-border px-3 text-caption font-medium text-muted-foreground">
          <span aria-hidden className="size-1.75 rounded-full bg-gold" />
          Coming soon
        </span>
        <h1 className="text-h1 leading-tight font-semibold tracking-tight text-foreground">Explore</h1>
        <p className="max-w-90 text-lead leading-relaxed text-muted-foreground">
          Browse films, director&rsquo;s notes and electronic press kits from across Nia, then compare any two side by side. Opens February 2027.
        </p>
        <div className="mt-1.5 flex flex-wrap justify-center gap-2.5">
          {waiting ? (
            <Button variant="outline" onClick={() => void toggle()} aria-pressed>
              <Check aria-hidden /> We&rsquo;ll let you know
            </Button>
          ) : (
            <Button onClick={() => void toggle()} disabled={waiting === null}>
              Notify me
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
