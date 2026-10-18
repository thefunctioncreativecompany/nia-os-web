"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, GripVertical } from "lucide-react";

import { cn } from "@/lib/utils";

// A list you can put in order by dragging the handle, or with the move buttons from the
// keyboard (design system Section 13.6). Cards settle with the `base` motion token.
export function ReorderableList<T extends { id: string; label: string }>({
  items,
  onChange,
  label,
  className,
}: {
  items: T[];
  onChange: (next: T[]) => void;
  label: string;
  className?: string;
}) {
  const [dragging, setDragging] = useState<string | null>(null);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return;
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  return (
    <ol aria-label={label} className={cn("flex flex-col gap-2", className)}>
      {items.map((item, index) => (
        <li
          key={item.id}
          draggable
          onDragStart={(e) => {
            setDragging(item.id);
            e.dataTransfer.effectAllowed = "move";
          }}
          onDragOver={(e) => {
            e.preventDefault();
            const from = items.findIndex((i) => i.id === dragging);
            if (from !== -1 && from !== index) move(from, index);
          }}
          onDragEnd={() => setDragging(null)}
          className={cn(
            "flex items-center gap-2 rounded-xl border bg-white py-2.5 pr-2 pl-3 text-sm transition-[border-color,box-shadow] duration-base ease-out",
            dragging === item.id ? "border-foreground font-bold shadow-menu" : "border-border",
          )}
        >
          <GripVertical aria-hidden className="size-4 shrink-0 cursor-grab text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate">
            {index + 1}. {item.label}
          </span>
          <button
            type="button"
            aria-label={`Move ${item.label} up`}
            disabled={index === 0}
            onClick={() => move(index, index - 1)}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-30"
          >
            <ChevronUp aria-hidden className="size-4" />
          </button>
          <button
            type="button"
            aria-label={`Move ${item.label} down`}
            disabled={index === items.length - 1}
            onClick={() => move(index, index + 1)}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-30"
          >
            <ChevronDown aria-hidden className="size-4" />
          </button>
        </li>
      ))}
    </ol>
  );
}
