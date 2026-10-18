"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Pick a month and year (design system Section 10.5). `month` is 0–11.
export function MonthPicker({
  year,
  month,
  onChange,
  className,
}: {
  year: number;
  month: number;
  onChange: (next: { year: number; month: number }) => void;
  className?: string;
}) {
  const navClassName =
    "flex size-8 items-center justify-center rounded-md border border-border bg-white outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50";

  return (
    <div className={cn("flex flex-col gap-4 rounded-xl border border-border bg-white p-4", className)}>
      <div className="flex items-center justify-between">
        <span className="text-base font-bold text-foreground" aria-live="polite">{year}</span>
        <div className="flex gap-2">
          <button type="button" aria-label="Previous year" className={navClassName} onClick={() => onChange({ year: year - 1, month })}>
            <ChevronLeft aria-hidden className="size-4" />
          </button>
          <button type="button" aria-label="Next year" className={navClassName} onClick={() => onChange({ year: year + 1, month })}>
            <ChevronRight aria-hidden className="size-4" />
          </button>
        </div>
      </div>
      <div role="grid" aria-label={`Months of ${year}`} className="grid grid-cols-4 gap-2">
        {MONTHS.map((label, index) => {
          const selected = index === month;
          return (
            <button
              key={label}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange({ year, month: index })}
              className={cn(
                "h-9 rounded-md text-small outline-none transition-colors duration-fast focus-visible:ring-3 focus-visible:ring-ring/50",
                selected ? "bg-primary font-bold text-primary-foreground" : "text-foreground hover:bg-muted",
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
