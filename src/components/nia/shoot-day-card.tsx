import { Sun, Sunrise, Sunset } from "lucide-react";

import { cn } from "@/lib/utils";

// One shoot day at a glance: day number, date, weather, sunrise and sunset
// (design system Section 10.7, "Schedule Date Card").
export function ShootDayCard({
  day,
  date,
  scenes,
  sunrise,
  sunset,
  weather: Weather = Sun,
  weatherLabel = "Sunny",
  className,
}: {
  day: number;
  date: Date;
  scenes: number;
  sunrise: string;
  sunset: string;
  weather?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  weatherLabel?: string;
  className?: string;
}) {
  const label = date.toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric" });

  return (
    <article className={cn("flex flex-col gap-4 rounded-xl border border-border bg-white p-4", className)}>
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-md bg-status-on-hold px-2.5 py-1 text-micro font-bold text-status-on-hold-foreground">
          Shoot day {day}
        </span>
        <span className="text-small text-muted-foreground">
          {scenes} {scenes === 1 ? "scene" : "scenes"} scheduled
        </span>
      </div>
      <div className="flex items-center gap-2">
        <h4 className="text-h3 font-bold text-foreground">{label}</h4>
        <Weather aria-hidden className="size-5 text-status-pending-foreground" />
        <span className="sr-only">{weatherLabel}</span>
      </div>
      <div className="flex justify-between border-t border-border pt-3 text-caption text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Sunrise aria-hidden className="size-4" />
          Sunrise {sunrise}
        </span>
        <span className="flex items-center gap-1.5">
          <Sunset aria-hidden className="size-4" />
          Sunset {sunset}
        </span>
      </div>
    </article>
  );
}
