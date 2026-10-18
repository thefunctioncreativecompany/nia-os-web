"use client";

import { useRef } from "react";
import Image, { type StaticImageData } from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type FilmstripFrame = { id: string; src: StaticImageData | string; label: string };

// A row of frames in shooting order that scrolls sideways (design system Section 17.2).
export function Filmstrip({
  frames,
  selected,
  onSelect,
  label,
  className,
}: {
  frames: FilmstripFrame[];
  selected: string | null;
  onSelect: (id: string) => void;
  label: string;
  className?: string;
}) {
  const track = useRef<HTMLUListElement>(null);
  const scroll = (direction: 1 | -1) =>
    track.current?.scrollBy({ left: direction * track.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button variant="outline" size="icon-xs" aria-label="Scroll back" onClick={() => scroll(-1)} className="shrink-0">
        <ChevronLeft />
      </Button>
      <ul ref={track} aria-label={label} className="flex min-w-0 flex-1 snap-x gap-2.5 overflow-x-auto py-1 [scrollbar-width:none]">
        {frames.map((frame) => {
          const active = frame.id === selected;
          return (
            <li key={frame.id} className="w-28 shrink-0 snap-start">
              <button
                type="button"
                aria-pressed={active}
                onClick={() => onSelect(frame.id)}
                className="flex w-full flex-col gap-1.5 text-left outline-none focus-visible:[&>span:first-child]:ring-3 focus-visible:[&>span:first-child]:ring-ring/50"
              >
                <span
                  className={cn(
                    "relative block aspect-[3/2] overflow-hidden rounded-md border-2 transition-colors duration-fast",
                    active ? "border-foreground" : "border-transparent",
                  )}
                >
                  <Image src={frame.src} alt="" fill sizes="112px" className="object-cover" />
                </span>
                <span className={cn("text-micro", active ? "font-bold text-foreground" : "text-muted-foreground")}>{frame.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <Button variant="outline" size="icon-xs" aria-label="Scroll forward" onClick={() => scroll(1)} className="shrink-0">
        <ChevronRight />
      </Button>
    </div>
  );
}
