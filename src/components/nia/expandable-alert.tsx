"use client";

import { useState } from "react";
import { ChevronDown, TriangleAlert, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";

// An alert with a summary that opens to show detail, and can be dismissed
// (design system Section 9.6).
export function ExpandableAlert({
  title,
  summary,
  children,
  variant = "warning",
  icon: Icon = TriangleAlert,
  defaultOpen = false,
  className,
}: {
  title: string;
  summary: string;
  children: React.ReactNode;
  variant?: "default" | "info" | "success" | "warning" | "destructive";
  icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  defaultOpen?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <Alert variant={variant} className={className}>
      <Icon aria-hidden />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex flex-col gap-3">
        <span>{summary}</span>
        {open && <div className="rounded-lg bg-card/60 p-3 text-caption">{children}</div>}
      </AlertDescription>
      <AlertAction>
        <button
          type="button"
          aria-expanded={open}
          aria-label={open ? "Show less" : "Show more"}
          onClick={() => setOpen((o) => !o)}
          className="flex size-7 items-center justify-center rounded-full outline-none hover:bg-black/5 focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ChevronDown aria-hidden className={cn("size-4 transition-transform duration-fast", open && "rotate-180")} />
        </button>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => setDismissed(true)}
          className="flex size-7 items-center justify-center rounded-full outline-none hover:bg-black/5 focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <X aria-hidden className="size-4" />
        </button>
      </AlertAction>
    </Alert>
  );
}
