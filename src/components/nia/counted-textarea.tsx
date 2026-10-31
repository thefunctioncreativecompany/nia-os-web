"use client";

import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

// Multi-line field that shows how much room is left (design system Section 11.2).
export function CountedTextarea({
  value,
  onChange,
  maxLength,
  className,
  ...props
}: Omit<React.ComponentProps<"textarea">, "value" | "onChange"> & {
  value: string;
  onChange: (next: string) => void;
  maxLength: number;
}) {
  const countId = props.id ? `${props.id}-count` : undefined;
  return (
    <div className={cn("flex flex-col rounded-lg border border-border bg-card focus-within:border-foreground", className)}>
      <Textarea
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={countId}
        className="min-h-24 resize-none border-0 bg-transparent px-3.5 pt-3 text-sm shadow-none focus-visible:ring-0 md:text-sm"
        {...props}
      />
      <span id={countId} className="px-3.5 pb-2.5 text-micro text-muted-foreground">
        {value.length} / {maxLength} characters
      </span>
    </div>
  );
}
