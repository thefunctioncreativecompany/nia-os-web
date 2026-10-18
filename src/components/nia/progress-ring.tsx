import { cn } from "@/lib/utils";

// Circular progress for uploads and renders (design system Section 14.2).
export function ProgressRing({
  value,
  size = 40,
  stroke = 4,
  label,
  className,
}: {
  // 0–100.
  value: number;
  size?: number;
  stroke?: number;
  label: string;
  className?: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <svg
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn("-rotate-90 shrink-0", className)}
    >
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className="stroke-border" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - clamped / 100)}
        className="stroke-primary transition-[stroke-dashoffset] duration-base ease-out"
      />
    </svg>
  );
}
