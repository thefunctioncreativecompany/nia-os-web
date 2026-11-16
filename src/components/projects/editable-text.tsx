"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { RichText } from "@/lib/rich-text";

// The formatting editor loads only when someone starts editing (rich text, 2026-11-15).
const RichTextEditor = dynamic(() => import("@/components/nia/rich-text-editor").then((m) => m.RichTextEditor), { ssr: false });

// Text that turns into an input when clicked and saves when you leave it (or press
// Enter; Escape cancels). Read-only viewers just see the text.
// `heading` makes it the page's main heading (<h1>) in every state; screen readers then hear
// the text itself ("Behind the Lens, edit title"), not only "Edit title".
// `rich` (long text, Ika 2026-11-15): shown formatted (rich-text.tsx), edited with bold, italic,
// lists and links as you type (rich-text-editor.tsx); stored as Markdown.
export function EditableText({
  heading = false,
  ...props
}: Omit<Parameters<typeof EditableField>[0], "named"> & { heading?: boolean }) {
  if (!heading) return <EditableField {...props} />;
  return (
    <h1 className="min-w-0">
      <EditableField {...props} named />
    </h1>
  );
}

function EditableField({
  named = false,
  value,
  label,
  placeholder,
  emptyText,
  onSave,
  multiline = false,
  rich = false,
  maxLength,
  readOnly = false,
  className,
  inputClassName,
  buttonClassName,
}: {
  // Inside a heading: the button is named by its text plus a hidden "edit" hint.
  named?: boolean;
  value: string;
  label: string;
  placeholder: string;
  // Shown instead of the placeholder when there's nothing to show (e.g. "—").
  emptyText?: string;
  onSave: (next: string) => Promise<void>;
  multiline?: boolean;
  /** Formatting: bold, italic, lists and links (implies multiline). */
  rich?: boolean;
  maxLength?: number;
  readOnly?: boolean;
  className?: string;
  inputClassName?: string;
  /** Last word on the clickable text's look (e.g. a lighter hover on a photo). */
  buttonClassName?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const finish = async (save: boolean, text = draft) => {
    const next = text.trim();
    // Formatting marks count towards the stored length; too long keeps the editor open.
    if (save && rich && maxLength && next.length > maxLength) {
      toast.error(`That's too long to save (${next.length} of ${maxLength} characters, formatting included).`);
      return;
    }
    setEditing(false);
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

  if (rich) {
    if (readOnly) return value ? <RichText value={value} className={cn(className, "px-0")} /> : <p className={cn(className, "px-0 text-muted-foreground")}>{emptyText || placeholder}</p>;
    if (editing)
      return (
        <RichTextEditor
          value={draft}
          label={label}
          placeholder={placeholder}
          onChange={setDraft}
          onDone={(save) => void finish(save)}
          className={cn(className, inputClassName)}
        />
      );
    // The text formatted; a button over it starts editing, and its links sit above the button.
    return (
      <div className={cn(className, "group/edit relative w-full rounded-md transition-colors duration-fast hover:bg-muted/70", !value && "text-nia-placeholder", buttonClassName)}>
        <button
          type="button"
          aria-label={`Edit ${label.toLowerCase()}`}
          onClick={() => {
            setDraft(value);
            setEditing(true);
          }}
          className="absolute inset-0 cursor-text rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <div className="pointer-events-none relative [&_a]:pointer-events-auto [&_a]:relative [&_a]:z-10">
          {value ? <RichText value={value} /> : <p>{emptyText || placeholder}</p>}
        </div>
      </div>
    );
  }

  // Read-only: no side padding (it only makes room for the hover), so values line up.
  if (readOnly) {
    const Text = named ? "span" : "p";
    return (
      <Text className={cn(named && "block", className, "px-0", !value && "text-muted-foreground")}>{value || emptyText || placeholder}</Text>
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
      aria-label={named ? undefined : `Edit ${label.toLowerCase()}`}
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      className={cn(
        className,
        "w-full cursor-text rounded-md text-left outline-none transition-colors duration-fast hover:bg-muted/70 focus-visible:ring-3 focus-visible:ring-ring/50",
        !value && "text-nia-placeholder",
        buttonClassName,
      )}
    >
      {value || emptyText || placeholder}
      {named && <span className="sr-only">, edit {label.toLowerCase()}</span>}
    </button>
  );
}
