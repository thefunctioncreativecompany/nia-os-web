import { cn } from "@/lib/utils";

export type TimeSlot = { value: string; label: string; booked?: boolean };

// Pick one free time slot; booked ones are struck through and can't be chosen
// (design system Section 16.3).
export function TimeSlots({
  slots,
  value,
  onChange,
  label,
  className,
}: {
  slots: TimeSlot[];
  value: string | null;
  onChange: (next: string) => void;
  label: string;
  className?: string;
}) {
  return (
    <div role="group" aria-label={label} className={cn("flex flex-wrap gap-2", className)}>
      {slots.map((slot) => {
        const selected = slot.value === value;
        return (
          <button
            key={slot.value}
            type="button"
            aria-pressed={selected}
            disabled={slot.booked}
            onClick={() => onChange(slot.value)}
            className={cn(
              "h-9 rounded-lg border px-2.5 text-sm outline-none transition-colors duration-fast focus-visible:ring-3 focus-visible:ring-ring/50",
              selected
                ? "border-foreground bg-foreground font-bold text-primary-foreground"
                : "border-border bg-white text-foreground hover:border-ring",
              slot.booked && "cursor-not-allowed bg-muted text-nia-placeholder line-through hover:border-border",
            )}
          >
            {slot.label}
            {slot.booked && <span className="sr-only"> (booked)</span>}
          </button>
        );
      })}
    </div>
  );
}
