"use client";

import { Search, X } from "lucide-react";

import { cn } from "@/lib/utils";

// Search field with a clear button (design system Sections 11.3 and 15).
export function SearchInput({
  value,
  onChange,
  label,
  placeholder = "Search…",
  className,
  ...props
}: Omit<React.ComponentProps<"input">, "value" | "onChange"> & {
  value: string;
  onChange: (next: string) => void;
  label: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-foreground" />
      <input
        type="search"
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-full border border-border bg-white pr-10 pl-10 text-sm text-foreground outline-none transition-colors placeholder:text-nia-placeholder hover:border-ring focus-visible:border-foreground focus-visible:ring-3 focus-visible:ring-ring/30 [&::-webkit-search-cancel-button]:hidden"
        {...props}
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange("")}
          className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <X aria-hidden className="size-4" />
        </button>
      )}
    </div>
  );
}
