import { Minus, Plus } from "lucide-react";

import { cn } from "@/lib/utils";

function Unit({
  label,
  value,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  step: number;
  onChange: (next: number) => void;
}) {
  const buttonClassName =
    "flex size-7 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-30";
  return (
    <div role="group" aria-label={label} className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="text-micro font-bold tracking-wide text-muted-foreground uppercase">{label}</span>
      <div className="flex h-10 items-center justify-between rounded-lg border border-border bg-white pr-1 pl-3">
        <output aria-live="polite" className="text-base font-bold text-foreground">{value}</output>
        <div className="flex">
          <button type="button" aria-label={`Fewer ${label.toLowerCase()}`} disabled={value <= 0} onClick={() => onChange(Math.max(0, value - step))} className={buttonClassName}>
            <Minus aria-hidden className="size-3.5" />
          </button>
          <button type="button" aria-label={`More ${label.toLowerCase()}`} disabled={value >= max} onClick={() => onChange(Math.min(max, value + step))} className={buttonClassName}>
            <Plus aria-hidden className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Hours and minutes for how long a scene or setup takes (design system Section 16.5).
// The value is in minutes.
export function DurationPicker({
  value,
  onChange,
  minuteStep = 5,
  className,
}: {
  value: number;
  onChange: (minutes: number) => void;
  minuteStep?: number;
  className?: string;
}) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return (
    <div className={cn("flex gap-3", className)}>
      <Unit label="Hours" value={hours} max={23} step={1} onChange={(h) => onChange(h * 60 + minutes)} />
      <Unit label="Minutes" value={minutes} max={60 - minuteStep} step={minuteStep} onChange={(m) => onChange(hours * 60 + m)} />
    </div>
  );
}
