"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";

import { cn } from "@/lib/utils";

// Type a filter and press Enter to add it as a removable tag (design system Section 15.5).
export function TagInput({
  tags,
  onChange,
  label,
  placeholder = "Add a filter…",
  className,
}: {
  tags: string[];
  onChange: (next: string[]) => void;
  label: string;
  placeholder?: string;
  className?: string;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const tag = draft.trim();
    if (tag && !tags.includes(tag)) onChange([...tags, tag]);
    setDraft("");
  };

  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      <div className="flex h-11 items-center gap-2 rounded-full border border-border bg-card px-3.5 focus-within:border-foreground">
        <Search aria-hidden className="size-4 shrink-0 text-muted-foreground" />
        <input
          aria-label={label}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
            if (e.key === "Backspace" && !draft && tags.length) onChange(tags.slice(0, -1));
          }}
          placeholder={placeholder}
          className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-nia-placeholder"
        />
      </div>
      {tags.length > 0 && (
        <ul aria-label={`${label} filters`} className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li key={tag} className="inline-flex items-center gap-1 rounded-full border border-border bg-card py-1 pr-1.5 pl-3 text-small font-medium">
              {tag}
              <button
                type="button"
                aria-label={`Remove ${tag}`}
                onClick={() => onChange(tags.filter((t) => t !== tag))}
                className="flex size-5 items-center justify-center rounded-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <X aria-hidden className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
