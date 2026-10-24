"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";

import { formatDay, parseDay, toDay } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/nia/lazy-calendar";

// A date shown like the other Production Info rows; click it to pick a day from the
// calendar (component library Section 10). Saves as soon as a day is picked.
export function EditableDate({
  value,
  label,
  emptyText = "—",
  readOnly = false,
  onSave,
  className,
}: {
  value: string;
  label: string;
  emptyText?: string;
  readOnly?: boolean;
  onSave: (next: string) => Promise<void>;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = parseDay(value);
  const shown = value ? formatDay(value) : emptyText;

  if (readOnly) return <span className={className}>{shown}</span>;

  const pick = async (next: string) => {
    setOpen(false);
    if (next !== value) await onSave(next).catch(() => {});
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={`${label}: ${value ? shown : "not set"}. Change`}
        className={cn(
          "group flex w-full items-center justify-between gap-2 rounded-md text-left outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=open]:bg-muted",
          !value && "text-muted-foreground",
          className,
        )}
      >
        {shown}
        <CalendarDays aria-hidden className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity duration-fast group-hover:opacity-100 group-data-[state=open]:opacity-100" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-2">
        <Calendar mode="single" selected={selected} defaultMonth={selected} onSelect={(day) => day && pick(toDay(day))} />
        {value && (
          <div className="flex justify-end border-t border-border px-1 pt-2">
            <Button variant="ghost" size="sm" onClick={() => pick("")}>Clear date</Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
