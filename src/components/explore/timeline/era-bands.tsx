import { cn } from "@/lib/utils";
import { ERAS, eraEnd, eraStart, eraYears, type Era } from "@/features/explore/timeline/eras";
import type { View } from "@/features/explore/timeline/scale";

// Film history behind the Timeline: each era a faint band through the lane, the one under the
// playhead in Nia Blue, and a row of names with their years just above the dates. A name stays
// in view while its era does, pinned to the left edge.

type Band = { era: Era; left: number; right: number };

function bands(view: View, width: number, now: number): Band[] {
  const x = (t: number) => ((t - view.start) / (view.end - view.start)) * width;
  return ERAS.map((era) => ({ era, left: x(eraStart(era)), right: x(eraEnd(era, now)) })).filter((b) => b.right > 0 && b.left < width);
}

export function EraBackground({ view, width, now, active }: { view: View; width: number; now: number; active: string | null }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {bands(view, width, now).map((b, i) => (
        <span
          key={b.era.id}
          className={cn(
            "absolute inset-y-0 border-x transition-colors duration-base",
            b.era.id === active ? "border-nia-blue/30 bg-nia-blue/[0.07]" : cn("border-border/60", i % 2 ? "bg-foreground/[0.025]" : "bg-foreground/[0.045]"),
          )}
          style={{ left: Math.max(0, b.left), width: Math.min(width, b.right) - Math.max(0, b.left) }}
        />
      ))}
    </div>
  );
}

export function EraNames({ view, width, now, active }: { view: View; width: number; now: number; active: string | null }) {
  return (
    <div className="relative h-6 shrink-0 overflow-hidden">
      {bands(view, width, now).map((b) => {
        const left = Math.max(b.left, 0) + 8;
        const room = Math.min(b.right, width) - left - 8;
        if (room < 60) return null;
        return (
          <span
            key={b.era.id}
            title={b.era.note}
            className={cn("absolute top-1 truncate text-caption font-semibold whitespace-nowrap", b.era.id === active ? "text-nia-blue" : "text-muted-foreground")}
            style={{ left, maxWidth: room }}
          >
            {b.era.label} <span className="font-normal tabular-nums">{eraYears(b.era)}</span>
          </span>
        );
      })}
    </div>
  );
}
