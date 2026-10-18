import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

// An export in progress: file, percent, time left, cancel (design system Section 24.4).
export function ExportProgress({
  name,
  percent,
  remaining,
  onCancel,
  className,
}: {
  name: string;
  percent: number;
  remaining?: string;
  onCancel?: () => void;
  className?: string;
}) {
  const done = percent >= 100;
  return (
    <div className={cn("flex flex-col gap-2.5 rounded-xl border border-border bg-white p-4", className)}>
      <div className="flex items-center justify-between gap-3">
        <span className="min-w-0 truncate text-sm font-bold text-foreground">{name}</span>
        <span aria-live="polite" className="shrink-0 text-small font-bold text-chart-2">
          {done ? "Done" : `${Math.round(percent)}% done`}
        </span>
      </div>
      <Progress value={percent} aria-label={`Exporting ${name}`} className="[&>[data-slot=progress-indicator]]:bg-chart-2" />
      <div className="flex items-center justify-between gap-3 text-micro">
        <span className="text-muted-foreground">{done ? "Ready to download" : remaining && `About ${remaining} left`}</span>
        {onCancel && !done && (
          <button type="button" onClick={onCancel} className="rounded-sm font-bold text-nia-danger underline underline-offset-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
