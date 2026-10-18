"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function slots(stepMinutes: number) {
  const list: string[] = [];
  for (let m = 0; m < 24 * 60; m += stepMinutes) {
    list.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  }
  return list;
}

// Move someone's call time: the day, a 24-hour time list and a note (Figma cast & crew
// "call-time-popup"). Put it in a <Popover> or <Dialog>.
export function CallTimePicker({
  title,
  subtitle,
  date,
  value,
  onSave,
  onCancel,
  stepMinutes = 30,
  className,
}: {
  title: string;
  subtitle?: string;
  // Already formatted, e.g. "Aug 29, 2026".
  date: string;
  value: string;
  onSave: (time: string, note: string) => void;
  onCancel: () => void;
  stepMinutes?: number;
  className?: string;
}) {
  const [time, setTime] = useState(value);
  const [note, setNote] = useState("");
  const list = useRef<HTMLDivElement>(null);
  const times = slots(stepMinutes);

  // Start with the current time in the middle of the list.
  useEffect(() => {
    const el = list.current?.querySelector<HTMLElement>("[aria-checked=true]");
    if (el && list.current) list.current.scrollTop = el.offsetTop - list.current.clientHeight / 2 + el.clientHeight / 2;
  }, []);

  return (
    <div className={cn("flex w-80 flex-col gap-4", className)}>
      <div>
        <h4 className="text-lg font-bold text-foreground">{title}</h4>
        {subtitle && <p className="text-small text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex h-10 items-center gap-2 rounded-lg border border-border bg-nia-panel px-3 text-sm">
        <CalendarDays aria-hidden className="size-4" />
        {date}
      </div>
      <div className="flex flex-col gap-1.5">
        <span id="call-time-label" className="text-micro font-bold text-muted-foreground">Time (24h)</span>
        <div ref={list} role="radiogroup" aria-labelledby="call-time-label" className="relative h-44 overflow-y-auto rounded-lg border border-border">
          {times.map((t) => {
            const selected = t === time;
            return (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setTime(t)}
                className={cn(
                  "flex h-9 w-full items-center justify-between px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset",
                  selected ? "bg-foreground font-bold text-primary-foreground" : "text-muted-foreground hover:bg-muted",
                )}
              >
                {t}
                {selected && <Check aria-hidden className="size-4" />}
              </button>
            );
          })}
        </div>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-micro font-bold text-muted-foreground">Note</span>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note about this change…"
          className="h-10 rounded-lg border border-border bg-nia-panel px-3 text-sm outline-none placeholder:text-nia-placeholder focus-visible:border-foreground"
        />
      </label>
      <div className="grid grid-cols-2 gap-2.5">
        <Button variant="outline" size="md" onClick={onCancel}>Cancel</Button>
        <Button size="md" onClick={() => onSave(time, note.trim())}>Update</Button>
      </div>
    </div>
  );
}
