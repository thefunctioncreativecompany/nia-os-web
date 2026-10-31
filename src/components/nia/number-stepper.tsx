"use client";

import { Minus, Plus } from "lucide-react";

import { cn } from "@/lib/utils";

// Big − value + control for prices and quantities (design system Section 3.6).
export function NumberStepper({
  value,
  onChange,
  min = 0,
  max = Number.POSITIVE_INFINITY,
  step = 1,
  prefix,
  decimals = 0,
  label,
  showRange = false,
  className,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  decimals?: number;
  label: string;
  showRange?: boolean;
  className?: string;
}) {
  const clamp = (n: number) => Math.min(max, Math.max(min, Number(n.toFixed(decimals))));
  const format = (n: number) => `${prefix ?? ""}${n.toFixed(decimals)}`;
  const buttonClassName =
    "flex size-10 items-center justify-center rounded-md border border-border bg-card text-foreground outline-none transition-colors duration-fast hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div
        role="group"
        aria-label={label}
        className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-3"
      >
        <button
          type="button"
          aria-label={`Decrease ${label.toLowerCase()}`}
          disabled={value <= min}
          onClick={() => onChange(clamp(value - step))}
          className={buttonClassName}
        >
          <Minus aria-hidden className="size-4" />
        </button>
        <output aria-live="polite" className="flex items-baseline gap-1 font-bold text-foreground">
          {prefix && <span className="text-base text-muted-foreground">{prefix}</span>}
          <span className="text-h2 tabular-nums">{value.toFixed(decimals)}</span>
        </output>
        <button
          type="button"
          aria-label={`Increase ${label.toLowerCase()}`}
          disabled={value >= max}
          onClick={() => onChange(clamp(value + step))}
          className={buttonClassName}
        >
          <Plus aria-hidden className="size-4" />
        </button>
      </div>
      {showRange && Number.isFinite(max) && (
        <div className="flex justify-between px-1 text-micro text-muted-foreground">
          <span>{format(min)}</span>
          <span>{format(max)}</span>
        </div>
      )}
    </div>
  );
}
