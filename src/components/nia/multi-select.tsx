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

export type MultiSelectOption = { value: string; label: string };

// Pick several options; chosen ones show as removable chips in the field
// (design system Section 5.3, "Multi-select Dropdown").
export function MultiSelect({
  options,
  value,
  onChange,
  label,
  placeholder = "Select…",
  maxChips = 2,
  searchable = true,
  className,
}: {
  options: MultiSelectOption[];
  value: string[];
  onChange: (next: string[]) => void;
  label: string;
  placeholder?: string;
  maxChips?: number;
  searchable?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.filter((option) => value.includes(option.value));
  const toggle = (optionValue: string) =>
    onChange(value.includes(optionValue) ? value.filter((v) => v !== optionValue) : [...value, optionValue]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className={cn(
            "flex min-h-11 w-full items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-left text-sm outline-none transition-colors hover:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
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
      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) p-1.5">
        <Command>
          {searchable && <CommandInput placeholder={`Search ${label.toLowerCase()}…`} />}
          <CommandList>
            <CommandEmpty>Nothing matches.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const checked = value.includes(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    value={option.label}
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
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
