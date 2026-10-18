"use client";

import { useState } from "react";
import { Search } from "lucide-react";

import { cn, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";

export type Person = { id: string; name: string; role: string };

// Search the crew and tick who to assign (design system Section 16.6).
export function PeoplePicker({
  people,
  selected,
  onChange,
  label,
  className,
}: {
  people: Person[];
  selected: string[];
  onChange: (next: string[]) => void;
  label: string;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shown = q ? people.filter((p) => `${p.name} ${p.role}`.toLowerCase().includes(q)) : people;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex h-10 items-center gap-2 rounded-lg border border-border bg-white px-3 focus-within:border-foreground">
        <Search aria-hidden className="size-4 shrink-0 text-muted-foreground" />
        <input
          type="search"
          aria-label={`Search ${label.toLowerCase()}`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search crew names…"
          className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-nia-placeholder [&::-webkit-search-cancel-button]:hidden"
        />
      </div>
      <ul aria-label={label} className="flex flex-col">
        {shown.map((person) => {
          const id = `person-${person.id}`;
          const checked = selected.includes(person.id);
          return (
            <li key={person.id}>
              <label htmlFor={id} className="flex cursor-pointer items-center gap-2.5 rounded-lg py-2">
                <Avatar className="size-7">
                  <AvatarFallback className="bg-foreground text-tiny font-bold text-primary-foreground">
                    {getInitials(person.name, "")}
                  </AvatarFallback>
                </Avatar>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-bold text-foreground">{person.name}</span>
                  <span className="text-micro text-muted-foreground">{person.role}</span>
                </span>
                <Checkbox
                  id={id}
                  checked={checked}
                  onCheckedChange={(on) => onChange(on ? [...selected, person.id] : selected.filter((s) => s !== person.id))}
                />
              </label>
            </li>
          );
        })}
        {shown.length === 0 && <li className="py-3 text-sm text-muted-foreground">No one matches “{query.trim()}”.</li>}
      </ul>
    </div>
  );
}
