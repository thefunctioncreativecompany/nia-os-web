"use client";

import dynamic from "next/dynamic";

import { cn } from "@/lib/utils";

// A form's long text box with formatting (rich text, 2026-11-15): the editor (rich-text-editor.tsx)
// loads when the form opens; until then an empty box of the same size holds its place.
const Editor = dynamic(() => import("@/components/nia/rich-text-editor").then((m) => m.RichTextEditor), {
  ssr: false,
  loading: () => <div aria-hidden className="h-28 rounded-lg border border-input" />,
});

export function RichTextField({ value, onChange, label, placeholder, className }: { value: string; onChange: (markdown: string) => void; label: string; placeholder?: string; className?: string }) {
  return <Editor variant="field" value={value} onChange={onChange} label={label} placeholder={placeholder} className={cn("min-h-28", className)} />;
}
