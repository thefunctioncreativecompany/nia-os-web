"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";
import type { HeroSlide } from "@/components/auth/hero-slides";

const FADE_MS = 1200;

// Full-bleed images that crossfade every `interval` ms. The incoming image fades in
// on top of the outgoing one (which stays opaque underneath), so there's no dip to
// a blank frame. Only the previous, current and next images are mounted, and it
// only advances once the next image has loaded.
export function HeroSlideshow({
  slides,
  interval = 3000,
}: {
  slides: HeroSlide[];
  interval?: number;
}) {
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState<ReadonlySet<number>>(() => new Set());
  const reduceMotion = usePrefersReducedMotion();

  const count = slides.length;
  const next = (index + 1) % count;
  const previous = (index - 1 + count) % count;
  const nextReady = loaded.has(next);

  useEffect(() => {
    if (reduceMotion || count < 2 || !nextReady) return;
    const timer = setTimeout(() => setIndex(next), interval);
    return () => clearTimeout(timer);
  }, [index, next, nextReady, interval, count, reduceMotion]);

  const markLoaded = (i: number) =>
    setLoaded((current) => (current.has(i) ? current : new Set(current).add(i)));

  const caption = slides[index]?.caption;

  return (
    <>
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden bg-nia-footer">
        {slides.map((slide, i) => {
          const role = i === index ? "current" : i === previous ? "previous" : i === next ? "next" : null;
          if (!role) return null;
          return (
            <Image
              key={i}
              src={slide.src}
              alt=""
              fill
              quality={90}
              preload={i === 0}
              sizes="(min-width: 768px) 100vw, 1px"
              placeholder="blur"
              onLoad={() => markLoaded(i)}
              style={{ objectPosition: slide.position ?? "50% 50%", transitionDuration: `${FADE_MS}ms` }}
              className={cn(
                "object-cover transition-opacity ease-in-out",
                role === "current" && "z-20 opacity-100",
                role === "previous" && "z-10 opacity-100",
                role === "next" && "z-0 opacity-0",
              )}
            />
          );
        })}
        <div className="absolute inset-0 z-30 bg-black/15" />
      </div>
      {caption ? (
        <p
          key={index}
          aria-hidden
          className="relative z-40 text-sm leading-normal text-white opacity-90 duration-700 animate-in fade-in"
        >
          {caption}
        </p>
      ) : (
        <span />
      )}
    </>
  );
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia("(prefers-reduced-motion: reduce)");
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}
