"use client";

import { cn } from "@/lib/utils";

// Carousel position dots; the current one stretches into a bar (design system Section 4.6).
export function Dots({
  count,
  current,
  onSelect,
  label = "Slide",
  className,
}: {
  count: number;
  current: number;
  onSelect?: (index: number) => void;
  label?: string;
  className?: string;
}) {
  return (
    <div role="group" aria-label={`${label} ${current + 1} of ${count}`} className={cn("flex items-center gap-1.5", className)}>
      {Array.from({ length: count }, (_, index) => {
        const active = index === current;
        const dotClassName = cn(
          "h-2 rounded-full transition-all duration-base ease-out",
          active ? "w-5 bg-primary" : "w-2 bg-border",
        );
        return onSelect ? (
          <button
            key={index}
            type="button"
            aria-label={`${label} ${index + 1}`}
            aria-current={active ? "true" : undefined}
            onClick={() => onSelect(index)}
            className={cn(dotClassName, "outline-none focus-visible:ring-3 focus-visible:ring-ring/50", !active && "hover:bg-muted-foreground/50")}
          />
        ) : (
          <span key={index} aria-hidden className={dotClassName} />
        );
      })}
    </div>
  );
}
