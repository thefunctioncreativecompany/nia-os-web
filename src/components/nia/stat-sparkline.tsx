import { cn } from "@/lib/utils";

// A number with a tiny bar trend beside it (design system Section 20.5). The last bar
// is coloured so the latest value stands out.
export function StatSparkline({
  label,
  value,
  trend,
  tone = "teal",
  className,
}: {
  label: string;
  value: string;
  // Recent values, oldest first.
  trend: number[];
  tone?: "teal" | "rust" | "ink";
  className?: string;
}) {
  const max = Math.max(...trend, 1);
  const last = { teal: "bg-chart-2", rust: "bg-chart-3", ink: "bg-chart-1" }[tone];

  return (
    <div className={cn("flex flex-col gap-2 rounded-xl border border-border bg-card p-3.5", className)}>
      <span className="text-small font-bold text-muted-foreground">{label}</span>
      <div className="flex items-end justify-between gap-3">
        <span className="text-h2 leading-none font-bold text-foreground">{value}</span>
        <span aria-hidden className="flex h-6 items-end gap-0.5">
          {trend.map((n, i) => (
            <span
              key={i}
              className={cn("w-1.5 rounded-[1px]", i === trend.length - 1 ? last : "bg-chart-1")}
              style={{ height: `${Math.max(15, (n / max) * 100)}%` }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}
