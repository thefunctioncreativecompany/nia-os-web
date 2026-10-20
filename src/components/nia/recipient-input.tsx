"use client";

import { useState } from "react";
import { X } from "lucide-react";

import { cn, getInitials } from "@/lib/utils";

// Add people by email or name as removable chips (design system Section 24.3). Enter
// or comma adds; Backspace on an empty field removes the last one.
export function RecipientInput({
  value,
  onChange,
  label,
  placeholder = "Add a name or email…",
  className,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  label: string;
  placeholder?: string;
  className?: string;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const next = draft.trim().replace(/,$/, "");
    if (next && !value.includes(next)) onChange([...value, next]);
    setDraft("");
  };

  return (
    <div className={cn("flex min-h-11 flex-wrap items-center gap-1.5 rounded-lg border border-border bg-white px-2 py-1.5 focus-within:border-foreground", className)}>
      {value.map((person) => (
        <span key={person} className="inline-flex items-center gap-1.5 rounded-full bg-muted py-0.5 pr-1 pl-0.5 text-small">
          <span aria-hidden className="flex size-5 items-center justify-center rounded-full bg-foreground text-tiny font-bold text-primary-foreground">
            {getInitials(person, person)}
          </span>
          {person}
          <button
            type="button"
            aria-label={`Remove ${person}`}
            onClick={() => onChange(value.filter((p) => p !== person))}
            className="flex size-5 items-center justify-center rounded-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <X aria-hidden className="size-3.5" />
          </button>
        </span>
      ))}
      <input
        aria-label={label}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add();
          }
          if (e.key === "Backspace" && !draft && value.length) onChange(value.slice(0, -1));
        }}
        onBlur={add}
        placeholder={value.length ? "" : placeholder}
        className="h-7 min-w-24 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-nia-placeholder"
      />
    </div>
  );
}
