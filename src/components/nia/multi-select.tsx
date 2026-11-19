"use client";

import { useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type MultiSelectOption = {
  value: string;
  label: string;
  /** A heading the option sits under. */
  group?: string;
};

// Pick several options; chosen ones show as removable chips in the field
// (design system Section 5.3, "Multi-select Dropdown"). Options with a `group` are listed under
// their headings; `max` stops more being picked (the rest are unavailable until one is removed).
// `variant="inline"`: no box until hovered, for a value in a details list (a project's genres).
export function MultiSelect({
  options,
  value,
  onChange,
  label,
  placeholder = "Select…",
  maxChips = 2,
  searchable = true,
  max,
  variant = "field",
  className,
}: {
  options: MultiSelectOption[];
  value: string[];
  onChange: (next: string[]) => void;
  label: string;
  placeholder?: string;
  maxChips?: number;
  searchable?: boolean;
  max?: number;
  variant?: "field" | "inline";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.filter((option) => value.includes(option.value));
  const full = max !== undefined && value.length >= max;
  const toggle = (optionValue: string) => {
    if (value.includes(optionValue)) onChange(value.filter((v) => v !== optionValue));
    else if (!full) onChange([...value, optionValue]);
  };
  // Options under their headings, in the order the headings first appear.
  const groups = [...new Set(options.map((o) => o.group ?? ""))].map((group) => ({ group, items: options.filter((o) => (o.group ?? "") === group) }));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className={cn(
            "flex w-full items-center gap-2 text-left text-sm outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
            variant === "field"
              ? "min-h-11 rounded-lg border border-border bg-card px-3 py-2 hover:border-ring"
              : "min-h-8 rounded-md px-1.5 py-1 font-medium text-foreground hover:bg-muted/70 data-[state=open]:bg-muted/70",
            className,
          )}
        >
          <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
            {selected.length === 0 && <span className="text-nia-placeholder">{placeholder}</span>}
            {selected.slice(0, maxChips).map((option) => (
              <span
                key={option.value}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-nia-surface py-0.5 pr-1 pl-2 text-small font-medium text-foreground"
              >
                {option.label}
                <span
                  role="button"
                  tabIndex={-1}
                  aria-label={`Remove ${option.label}`}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggle(option.value);
                  }}
                  className="rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
                >
                  <X aria-hidden className="size-3" />
                </span>
              </span>
            ))}
            {selected.length > maxChips && (
              <span className="text-small text-muted-foreground">+{selected.length - maxChips} selected</span>
            )}
          </span>
          <ChevronDown aria-hidden className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) min-w-64 p-1.5">
        <Command>
          {searchable && <CommandInput placeholder={`Search ${label.toLowerCase()}…`} />}
          <CommandList>
            <CommandEmpty>Nothing matches.</CommandEmpty>
            {max !== undefined && (
              <p className="px-2 pt-1.5 pb-1 text-caption text-muted-foreground" aria-live="polite">
                {full ? `${max} chosen: remove one to pick another` : `Up to ${max}`}
              </p>
            )}
            {groups.map(({ group, items }) => (
              <CommandGroup key={group || "options"} heading={group || undefined}>
                {items.map((option) => {
                  const checked = value.includes(option.value);
                  return (
                    <CommandItem
                      key={option.value}
                      value={option.label}
                      disabled={full && !checked}
                      onSelect={() => toggle(option.value)}
                      className={cn("gap-2.5 py-2", checked && "font-bold")}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "flex size-4 shrink-0 items-center justify-center rounded-[4px] border",
                          checked ? "border-primary bg-primary text-primary-foreground" : "border-ring",
                        )}
                      >
                        {checked && <Check className="size-3" strokeWidth={3} />}
                      </span>
                      {option.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
