"use client";

import { cn } from "@/lib/utils";

export type MapPin = {
  id: string;
  label: string;
  // Position on the plan, 0–100 from the left and top.
  x: number;
  y: number;
};

// A schematic location plan with pins (design system Section 21). It isn't a street
// map: it shows where setups sit relative to each other. Click a pin to select it;
// `children` renders beside the selected pin (e.g. its details card).
export function LocationMap({
  pins,
  selected,
  activeId,
  onSelect,
  label,
  children,
  className,
}: {
  pins: MapPin[];
  selected: string | null;
  // The live location, drawn in teal.
  activeId?: string | null;
  onSelect: (id: string) => void;
  label: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const current = pins.find((p) => p.id === selected);

  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "relative min-h-60 overflow-hidden rounded-xl border border-border bg-white",
        "bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:33.33%_33.33%]",
        className,
      )}
    >
      {pins.map((pin) => {
        const active = pin.id === activeId;
        const isSelected = pin.id === selected;
        return (
          <button
            key={pin.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelect(pin.id)}
            className={cn(
              "absolute flex -translate-y-1/2 items-center gap-1.5 rounded-full py-0.5 text-micro font-bold whitespace-nowrap outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              // Pins on the right half label to the left so names aren't cut off.
              pin.x > 55 ? "-translate-x-full flex-row-reverse pr-0.5 pl-2" : "pr-2 pl-0.5",
              active ? "text-chart-2" : "text-foreground",
              isSelected && "bg-white shadow-menu",
            )}
            style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
          >
            <span aria-hidden className={cn("size-2 shrink-0 rounded-full", active ? "bg-chart-2" : "bg-foreground")} />
            {pin.label}
            {active && <span className="sr-only">(active)</span>}
          </button>
        );
      })}
      {current && children && (
        <div
          className="absolute z-10 w-64 max-w-[calc(100%-1.5rem)]"
          style={{
            top: `calc(${current.y}% + 16px)`,
            left: `clamp(0.75rem, ${current.x}%, calc(100% - 16.75rem))`,
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// A two-leg route between waypoints with the travel time (design system Section 21.3).
export function RouteMap({ from, to, eta, className }: { from: string; to: string; eta: string; className?: string }) {
  return (
    <figure className={cn("relative h-48 rounded-xl border border-border bg-white", className)}>
      <svg viewBox="0 0 400 180" preserveAspectRatio="none" aria-hidden className="absolute inset-0 size-full">
        <path d="M 30 110 H 370 M 110 20 V 170" fill="none" strokeWidth={8} className="stroke-chart-4" />
        <path d="M 30 110 H 240 M 110 110 V 26" fill="none" strokeWidth={4} className="stroke-chart-2" />
      </svg>
      <span aria-hidden className="absolute top-[61%] left-[7.5%] size-2.5 -translate-1/2 rounded-full border-2 border-white bg-foreground" />
      <span aria-hidden className="absolute top-[14%] left-[27.5%] size-2.5 -translate-1/2 rounded-full border-2 border-white bg-chart-3" />
      <span className="absolute top-[22%] left-[36%] rounded-md bg-foreground px-2.5 py-1.5 text-micro font-bold text-primary-foreground">
        Travel time: {eta}
      </span>
      <figcaption className="sr-only">
        Route from {from} to {to}, {eta}.
      </figcaption>
    </figure>
  );
}
