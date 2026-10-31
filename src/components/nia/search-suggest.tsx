"use client";

import { useState } from "react";
import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";

export type Suggestion = { value: string; label: string; hint?: string };

// Search with a suggestions list under it (design system Section 15.3). Arrow keys move
// through suggestions; Enter picks one.
export function SearchSuggest({
  suggestions,
  onSelect,
  label,
  placeholder = "Search…",
  className,
}: {
  suggestions: Suggestion[];
  onSelect: (suggestion: Suggestion) => void;
  label: string;
  placeholder?: string;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const open = focused && query.trim().length > 0;

  return (
    <Command
      shouldFilter
      className={cn("relative overflow-visible bg-transparent p-0", className)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <div className="flex h-11 items-center gap-2 rounded-full border border-border bg-card px-3.5 focus-within:border-foreground">
        <Search aria-hidden className="size-4 shrink-0" />
        {/* The bare cmdk input: shadcn's CommandInput brings its own boxed frame. */}
        <CommandPrimitive.Input
          aria-label={label}
          value={query}
          onValueChange={setQuery}
          placeholder={placeholder}
          className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-nia-placeholder"
        />
      </div>
      {open && (
        <CommandList className="absolute top-full right-0 left-0 z-20 mt-1.5 rounded-xl border border-border bg-popover p-1.5 shadow-menu">
          <CommandGroup>
            {suggestions.map((suggestion) => (
              <CommandItem
                key={suggestion.value}
                value={suggestion.label}
                onMouseDown={(e) => e.preventDefault()}
                onSelect={() => {
                  setQuery(suggestion.label);
                  onSelect(suggestion);
                }}
                className="group rounded-lg px-3 py-2"
              >
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-sm group-data-selected:font-bold">{suggestion.label}</span>
                  {suggestion.hint && <span className="text-caption text-muted-foreground">{suggestion.hint}</span>}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      )}
    </Command>
  );
}
