"use client";

import type { ComponentProps, ReactNode } from "react";
import { ChevronDown, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// The platform's search and filter look (Ika, 2026-10-20: Marketplace's, used everywhere a page
// is searched or filtered: Marketplace, Templates, Explore, Activity). A wide pill search field,
// pill chips that toggle a filter, chips that open a menu ("Category: All ▾"), and a quiet count
// of what matches. A chip that narrows the list has a dark border on a grey fill.

/** The outer pill of a search field, for searches that build their own input (suggestions). */
export const searchFieldShell =
  "flex h-14 items-center gap-3 rounded-full border border-border bg-white px-5 text-lead text-muted-foreground transition-[border-color,box-shadow] duration-fast focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50";

/** The input inside it. */
export const searchFieldInput =
  "min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-nia-placeholder [&::-webkit-search-cancel-button]:hidden";

/** A pill search field: icon, input, and an optional part on the right (a location, a clear button). */
export function SearchField({
  label,
  suffix,
  className,
  ...input
}: { label: string; suffix?: ReactNode; className?: string } & Omit<ComponentProps<"input">, "className" | "type">) {
  return (
    <label className={cn(searchFieldShell, className)}>
      <Search aria-hidden className="size-4.5 shrink-0" />
      <input type="search" aria-label={label} {...input} className={searchFieldInput} />
      {suffix}
    </label>
  );
}

/** A chip's look: `on` when it narrows what's shown. */
export const chipClass = (on: boolean) =>
  cn(
    "inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-small font-semibold text-foreground outline-none transition-colors duration-fast focus-visible:ring-3 focus-visible:ring-ring/50",
    on ? "border-foreground bg-secondary" : "border-border bg-white hover:border-ring",
  );

/** A chip that switches a filter on and off. `count` shows how many it would show. */
export function FilterChip({
  on,
  count,
  children,
  className,
  ...button
}: { on: boolean; count?: number; className?: string } & Omit<ComponentProps<"button">, "className" | "type">) {
  return (
    <button type="button" aria-pressed={on} {...button} className={cn(chipClass(on), className)}>
      {children}
      {count !== undefined && <span className={cn("text-meta", on ? "text-foreground" : "text-muted-foreground")}>{count}</span>}
    </button>
  );
}

/** A chip that opens a menu of choices: "Category: All ▾". Reads as narrowing unless the default is chosen. */
export function ChipMenu<T extends string>({
  label,
  value,
  options,
  onChange,
  defaultValue,
  columns = 1,
  align = "start",
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (next: T) => void;
  /** The choice that doesn't narrow anything ("All", "Any"); the chip stays plain while it's chosen. */
  defaultValue?: T;
  columns?: 1 | 2;
  align?: "start" | "end";
}) {
  const current = options.find((o) => o.value === value)?.label ?? value;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className={chipClass(defaultValue !== undefined && value !== defaultValue)}>
          <span className="font-medium text-muted-foreground">{label}</span>
          {current}
          <ChevronDown aria-hidden className="size-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className={cn("rounded-2xl p-2", columns === 2 ? "w-[min(32.5rem,calc(100vw-2rem))]" : "min-w-44")}>
        <DropdownMenuRadioGroup value={value} onValueChange={(v) => onChange(v as T)} className={cn(columns === 2 && "grid grid-cols-2 gap-x-2 gap-y-0.5")}>
          {options.map((o) => (
            <DropdownMenuRadioItem key={o.value} value={o.value} className="h-10 rounded-lg text-sm data-[state=checked]:bg-accent data-[state=checked]:font-semibold">
              {o.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** How many match, at the end of a filter bar; read out when it changes. */
export function ResultCount({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span aria-live="polite" className={cn("text-small text-muted-foreground", className)}>
      {children}
    </span>
  );
}
