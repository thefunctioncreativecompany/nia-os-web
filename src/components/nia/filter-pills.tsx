import { Check, Plus } from "lucide-react";

import { cn } from "@/lib/utils";

// Pills that show "+" when off and "✓" when on (Figma project filter and save modals).
// `multiple` lets several be on at once; otherwise it's a single choice.
export function FilterPills({
  options,
  value,
  onChange,
  label,
  multiple = false,
  className,
}: {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  label: string;
  multiple?: boolean;
  className?: string;
}) {
  const toggle = (option: string) => {
    if (!multiple) return onChange([option]);
    onChange(value.includes(option) ? value.filter((v) => v !== option) : [...value, option]);
  };

  return (
    <div role="group" aria-label={label} className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => {
        const on = value.includes(option);
        return (
          <button
            key={option}
            type="button"
            aria-pressed={on}
            onClick={() => toggle(option)}
            className={cn(
              "inline-flex h-8 items-center gap-1 rounded-full border px-3 text-small outline-none transition-colors duration-fast focus-visible:ring-3 focus-visible:ring-ring/50",
              on ? "border-foreground bg-foreground text-primary-foreground" : "border-border bg-white text-foreground hover:border-ring",
            )}
          >
            {on ? <Check aria-hidden className="size-3.5" /> : <Plus aria-hidden className="size-3.5" />}
            {option}
          </button>
        );
      })}
    </div>
  );
}
