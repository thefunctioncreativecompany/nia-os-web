"use client";

import { useState } from "react";
import { CalendarDays, Clock } from "lucide-react";

import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TimeWheel, formatTime, type TimeValue } from "@/components/nia/time-wheel";

const triggerClassName =
  "flex h-11 w-full items-center justify-between gap-3 rounded-lg border border-border bg-white px-3.5 text-left text-sm text-foreground outline-none transition-colors hover:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=open]:border-foreground";

// A date input that opens a calendar (design system Section 10.4).
export function DateField({
  id,
  value,
  onChange,
  placeholder = "MM / DD / YYYY",
  className,
}: {
  id?: string;
  value: Date | undefined;
  onChange: (next: Date | undefined) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const text = value
    ? `${String(value.getMonth() + 1).padStart(2, "0")} / ${String(value.getDate()).padStart(2, "0")} / ${value.getFullYear()}`
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger id={id} className={cn(triggerClassName, className)}>
        <span className={cn(!value && "text-nia-placeholder")}>{text}</span>
        <CalendarDays aria-hidden className="size-4 text-foreground" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-2">
        <Calendar
          mode="single"
          selected={value}
          defaultMonth={value}
          onSelect={(day) => {
            onChange(day);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

// A time input that opens the scrollable time picker.
export function TimeField({
  id,
  value,
  onChange,
  className,
}: {
  id?: string;
  value: TimeValue;
  onChange: (next: TimeValue) => void;
  className?: string;
}) {
  return (
    <Popover>
      <PopoverTrigger id={id} className={cn(triggerClassName, className)}>
        <span className="tabular-nums">{formatTime(value)}</span>
        <Clock aria-hidden className="size-4 text-foreground" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-2">
        <TimeWheel value={value} onChange={onChange} />
      </PopoverContent>
    </Popover>
  );
}
