import { cn } from "@/lib/utils";
import type { Ticks } from "@/features/explore/timeline/scale";

// The Timeline's date axis (EXPLORE_TIMELINE_SPEC.md §2, §6): a 1px line, short minor ticks,
// labelled major ticks, and under them the next unit up (the year under months, the month under
// days, the date under hours), the current one pinned to the left edge as the axis moves.

const PINNED = 168; // room for the pinned label before the next one pushes it out

export function TimeAxis({ ticks, width, className }: { ticks: Ticks; width: number; className?: string }) {
  const inView = (x: number) => x >= -40 && x <= width + 40;
  const [first, next] = [ticks.context[0], ticks.context[1]];
  const pinnedX = first ? Math.min(Math.max(first.x, 12), next ? next.x - PINNED : Infinity) : 12;
  return (
    <div aria-hidden className={cn("relative h-14 border-t border-border select-none", className)}>
      {ticks.minor.filter((t) => inView(t.x)).map((t) => (
        <span key={`n${t.at}`} className="absolute top-0 h-1.5 w-px bg-border" style={{ left: t.x }} />
      ))}
      {ticks.major.filter((t) => inView(t.x)).map((t) => (
        <span key={`m${t.at}`} className="absolute top-0 flex flex-col items-start" style={{ left: t.x }}>
          <span className="h-2.5 w-px bg-muted-foreground/60" />
          <span className="-translate-x-1/2 pt-1 text-caption font-semibold whitespace-nowrap text-foreground tabular-nums">{t.label}</span>
        </span>
      ))}
      {first && (
        <span className="absolute bottom-1 text-micro whitespace-nowrap text-muted-foreground" style={{ left: pinnedX }}>
          {first.label}
        </span>
      )}
      {ticks.context.slice(1).filter((t) => inView(t.x)).map((t) => (
        <span key={`c${t.at}`} className="absolute bottom-1 border-l border-border pl-1.5 text-micro whitespace-nowrap text-muted-foreground" style={{ left: t.x }}>
          {t.label}
        </span>
      ))}
    </div>
  );
}
