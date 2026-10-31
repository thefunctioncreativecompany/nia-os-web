"use client";

import { useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// A row of pill filters that scrolls sideways when there are too many to fit
// (design system Section 22.3).
export function ScrollTabs({
  items,
  value,
  onChange,
  label,
  className,
}: {
  items: { value: string; label: string; disabled?: boolean }[];
  value: string;
  onChange: (next: string) => void;
  label: string;
  className?: string;
}) {
  const track = useRef<HTMLDivElement>(null);
  const scroll = (direction: 1 | -1) =>
    track.current?.scrollBy({ left: direction * track.current.clientWidth * 0.6, behavior: "smooth" });

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button variant="outline" size="icon-xs" aria-label="Scroll back" onClick={() => scroll(-1)} className="shrink-0 rounded-md">
        <ArrowLeft />
      </Button>
      <div ref={track} role="group" aria-label={label} className="flex min-w-0 flex-1 gap-2 overflow-x-auto py-0.5 [scrollbar-width:none]">
        {items.map((item) => {
          const active = item.value === value;
          return (
            <button
              key={item.value}
              type="button"
              aria-pressed={active}
              disabled={item.disabled}
              onClick={() => onChange(item.value)}
              className={cn(
                "h-8 shrink-0 rounded-full border px-3.5 text-small whitespace-nowrap outline-none transition-colors duration-fast focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-40",
                active ? "border-foreground bg-foreground font-bold text-primary-foreground" : "border-border bg-card text-foreground hover:border-ring",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <Button variant="outline" size="icon-xs" aria-label="Scroll forward" onClick={() => scroll(1)} className="shrink-0 rounded-md">
        <ArrowRight />
      </Button>
    </div>
  );
}
