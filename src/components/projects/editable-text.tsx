"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

// Text that turns into an input when clicked and saves when you leave it (or press
// Enter; Escape cancels). Read-only viewers just see the text.
export function EditableText({
  value,
  label,
  placeholder,
  emptyText,
  onSave,
  multiline = false,
  maxLength,
  readOnly = false,
  className,
  inputClassName,
}: {
  value: string;
  label: string;
  placeholder: string;
  // Shown instead of the placeholder when there's nothing to show (e.g. "—").
  emptyText?: string;
  onSave: (next: string) => Promise<void>;
  multiline?: boolean;
  maxLength?: number;
  readOnly?: boolean;
  className?: string;
  inputClassName?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const finish = async (save: boolean) => {
    setEditing(false);
    const next = draft.trim();
    if (!save || next === value) {
      setDraft(value);
      return;
    }
    try {
      await onSave(next);
    } catch {
      setDraft(value);
    }
  };

  if (readOnly) {
    return (
      <p className={cn(className, !value && "text-muted-foreground")}>{value || emptyText || placeholder}</p>
    );
  }

  if (editing) {
    const shared = {
      autoFocus: true,
      "aria-label": label,
      value: draft,
      maxLength,
      placeholder,
      onChange: (e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => setDraft(e.target.value),
      onBlur: () => finish(true),
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === "Escape") finish(false);
        if (e.key === "Enter" && (!multiline || e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          (e.target as HTMLElement).blur();
        }
      },
      className: cn(
        className,
        "w-full rounded-md bg-transparent outline-none ring-2 ring-ring/40 ring-offset-4 ring-offset-background placeholder:text-nia-placeholder",
        inputClassName,
      ),
    };
    return multiline ? (
      <textarea rows={3} {...shared} className={cn(shared.className, "field-sizing-content resize-none")} />
    ) : (
      <input {...shared} />
    );
  }

  return (
    <button
      type="button"
      aria-label={`Edit ${label.toLowerCase()}`}
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      className={cn(
        className,
        "w-full cursor-text rounded-md text-left outline-none transition-colors duration-fast hover:bg-muted/70 focus-visible:ring-3 focus-visible:ring-ring/50",
        !value && "text-nia-placeholder",
      )}
    >
      {value || emptyText || placeholder}
    </button>
  );
}
