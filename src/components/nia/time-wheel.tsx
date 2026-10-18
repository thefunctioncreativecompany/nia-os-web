"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

export type TimeValue = { hour: number; minute: number; period: "AM" | "PM" };

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);

function Column<T extends string | number>({
  label,
  options,
  value,
  onChange,
  format = (v) => String(v),
}: {
  label: string;
  options: T[];
  value: T;
  onChange: (next: T) => void;
  format?: (value: T) => string;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  // Keep the chosen value centred in its column.
  useEffect(() => {
    const list = listRef.current;
    const selected = list?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (list && selected) {
      list.scrollTo({ top: selected.offsetTop - list.clientHeight / 2 + selected.clientHeight / 2, behavior: "smooth" });
    }
  }, [value]);

  return (
    <div
      ref={listRef}
      role="listbox"
      aria-label={label}
      className="relative flex h-44 snap-y snap-mandatory flex-col items-center overflow-y-auto py-16 [scrollbar-width:none]"
    >
      {options.map((option) => {
        const selected = option === value;
        return (
          <button
            key={option}
            type="button"
            role="option"
            aria-selected={selected}
            onClick={() => onChange(option)}
            className={cn(
              "flex h-10 w-14 shrink-0 snap-center items-center justify-center rounded-md text-base tabular-nums outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              selected ? "font-bold text-foreground" : "text-nia-placeholder hover:text-muted-foreground",
            )}
          >
            {format(option)}
          </button>
        );
      })}
    </div>
  );
}

// Scrollable hour / minute / AM-PM columns for call times (design system Section 10.3).
export function TimeWheel({
  value,
  onChange,
  minuteStep = 5,
  className,
}: {
  value: TimeValue;
  onChange: (next: TimeValue) => void;
  minuteStep?: number;
  className?: string;
}) {
  const minutes = Array.from({ length: 60 / minuteStep }, (_, i) => i * minuteStep);
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <Column label="Hour" options={HOURS} value={value.hour} format={pad} onChange={(hour) => onChange({ ...value, hour })} />
      <span aria-hidden className="text-base font-bold text-muted-foreground">:</span>
      <Column label="Minute" options={minutes} value={value.minute} format={pad} onChange={(minute) => onChange({ ...value, minute })} />
      <Column
        label="AM or PM"
        options={["AM", "PM"] as ("AM" | "PM")[]}
        value={value.period}
        onChange={(period) => onChange({ ...value, period })}
      />
    </div>
  );
}

export function formatTime(value: TimeValue) {
  return `${String(value.hour).padStart(2, "0")}:${String(value.minute).padStart(2, "0")} ${value.period}`;
}
