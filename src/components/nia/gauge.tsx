import { cn } from "@/lib/utils";

// Half-ring showing how far along something is, e.g. scenes wrapped (design system
// Section 20.4). Teal on the grey track.
export function Gauge({
  value,
  label,
  caption = "Complete",
  className,
}: {
  // 0–100.
  value: number;
  label: string;
  caption?: string;
  className?: string;
}) {
  const clamped = Math.min(100, Math.max(0, value));
  const radius = 80;
  const length = Math.PI * radius;
  const arc = `M 10 90 A ${radius} ${radius} 0 0 1 170 90`;

  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      className={cn("relative mx-auto w-full max-w-[200px]", className)}
    >
      <svg viewBox="0 0 180 100" className="w-full">
        <path d={arc} fill="none" strokeWidth={20} className="stroke-chart-4" />
        <path
          d={arc}
          fill="none"
          strokeWidth={20}
          strokeDasharray={length}
          strokeDashoffset={length * (1 - clamped / 100)}
          className="stroke-chart-2 transition-[stroke-dashoffset] duration-slow ease-out"
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
        <span className="text-h2 leading-none font-bold text-foreground">{Math.round(clamped)}%</span>
        <span className="mt-1 text-micro font-bold tracking-wide text-muted-foreground uppercase">{caption}</span>
      </div>
    </div>
  );
}
