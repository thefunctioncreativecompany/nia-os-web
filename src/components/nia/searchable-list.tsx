"use client";

import { cn } from "@/lib/utils";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

// A long single-choice list with a search box on top, e.g. production type (Figma
// "Dropdown Panel"). Put it in a <Popover> under the field that opens it.
export function SearchableList({
  options,
  value,
  onChange,
  placeholder = "Search…",
  label,
  className,
}: {
  options: readonly string[];
  value: string | null;
  onChange: (next: string) => void;
  placeholder?: string;
  label: string;
  className?: string;
}) {
  return (
    <Command label={label} className={cn("rounded-xl bg-popover p-1.5", className)}>
      <CommandInput placeholder={placeholder} />
      <CommandList className="max-h-80">
        <CommandEmpty className="py-4 text-center text-small text-muted-foreground">No matches.</CommandEmpty>
        {options.map((option) => (
          <CommandItem
            key={option}
            value={option}
            onSelect={() => onChange(option)}
            className="rounded-lg px-3 py-2.5 text-sm data-[checked=true]:font-bold"
            data-checked={option === value}
          >
            {option}
          </CommandItem>
        ))}
      </CommandList>
    </Command>
  );
}
