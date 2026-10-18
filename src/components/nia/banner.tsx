"use client";

import { useState } from "react";
import { Info, X } from "lucide-react";

import { cn } from "@/lib/utils";

// Dark full-width notice for app-wide news (design system Section 8.6).
export function Banner({
  children,
  action,
  dismissible = true,
  className,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
  dismissible?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(true);
  if (!open) return null;

  return (
    <div
      role="status"
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-xl bg-primary px-5 py-3 text-sm text-primary-foreground",
        className,
      )}
    >
      <Info aria-hidden className="size-[18px] shrink-0" />
      <p className="min-w-0 flex-1">{children}</p>
      {action}
      {dismissible && (
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => setOpen(false)}
          className="flex size-8 items-center justify-center rounded-full text-primary-foreground/70 outline-none hover:text-primary-foreground focus-visible:ring-3 focus-visible:ring-white/40"
        >
          <X aria-hidden className="size-4" />
        </button>
      )}
    </div>
  );
}
