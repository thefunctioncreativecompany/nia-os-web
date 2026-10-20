"use client";

import { useSyncExternalStore } from "react";
import { CalendarDays } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const DAY_MS = 86_400_000;

export const shortDate = (d: Date) => d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
export const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const fromIso = (s: string | null | undefined) => {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const noSubscribe = () => () => {};

/** Today, once the page is in the browser (pages are drawn without a clock). */
export function useToday() {
  const key = useSyncExternalStore(noSubscribe, () => isoDay(new Date()), () => null);
  return key ? fromIso(key)! : undefined;
}

/** Tomorrow, and the default booking: from tomorrow for `nights` days. */
export function defaultRange(today: Date | undefined, nights: number): { tomorrow?: Date; range?: DateRange } {
  if (!today) return {};
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  return { tomorrow, range: { from: tomorrow, to: new Date(tomorrow.getTime() + nights * DAY_MS) } };
}

// Pickup and return (or start and end) side by side; choosing opens a range calendar from tomorrow
// onwards (Ika's Claude Design "Marketplace", listing and fleet booking).
export function RentalDates({
  range,
  onChange,
  today,
  earliest,
  labels = ["Pick up", "Return"],
}: {
  range: DateRange | undefined;
  onChange: (next: DateRange | undefined) => void;
  today: Date | undefined;
  earliest: Date | undefined;
  labels?: [string, string];
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Choose ${labels[0].toLowerCase()} and ${labels[1].toLowerCase()} dates`}
          className="grid w-full grid-cols-2 overflow-hidden rounded-xl border border-border text-left outline-none transition-colors duration-fast hover:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span className="border-r border-border px-3.5 py-3">
            <span className="block text-micro font-semibold text-muted-foreground">{labels[0]}</span>
            <span className="text-sm font-semibold">{range?.from ? shortDate(range.from) : "Choose a day"}</span>
          </span>
          <span className="flex items-center justify-between gap-2 px-3.5 py-3">
            <span>
              <span className="block text-micro font-semibold text-muted-foreground">{labels[1]}</span>
              <span className="text-sm font-semibold">{range?.to ? shortDate(range.to) : "Choose a day"}</span>
            </span>
            <CalendarDays aria-hidden className="size-4 text-muted-foreground" />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto rounded-2xl p-3">
        <Calendar
          mode="range"
          selected={range}
          onSelect={onChange}
          today={today}
          defaultMonth={range?.from}
          disabled={earliest ? { before: earliest } : undefined}
          className="[--cell-size:2.5rem]"
        />
      </PopoverContent>
    </Popover>
  );
}
