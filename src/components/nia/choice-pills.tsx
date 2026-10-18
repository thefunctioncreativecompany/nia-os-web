"use client";

import { cn } from "@/lib/utils";

// A row of pills where one is chosen (design system Section 10.6 quick dates; also the
// onboarding "How did you hear" chips).
export function ChoicePills<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (next: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm outline-none transition-colors duration-fast focus-visible:ring-3 focus-visible:ring-ring/50",
              selected
                ? "border-primary bg-primary font-bold text-primary-foreground"
                : "border-border bg-white font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
