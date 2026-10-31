"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

export type SwipeAction = {
  label: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  onClick: () => void;
  tone?: "info" | "warning" | "danger";
};

const TONES = {
  info: "bg-status-on-hold text-status-on-hold-foreground",
  warning: "bg-status-pending text-status-pending-foreground",
  danger: "bg-status-cancelled text-nia-danger",
};

// A row that slides sideways to reveal actions (design system Section 13.5). It scrolls
// horizontally, so touch swipes work natively; on desktop the actions are reachable by
// scrolling or Tab.
export function SwipeRow({
  children,
  actions,
  revealed = false,
  className,
}: {
  children: React.ReactNode;
  actions: SwipeAction[];
  // Start with the actions showing.
  revealed?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (revealed && ref.current) ref.current.scrollLeft = ref.current.scrollWidth;
  }, [revealed]);

  return (
    <div
      ref={ref}
      className={cn(
        "flex snap-x snap-mandatory overflow-x-auto rounded-xl border border-border bg-card [scrollbar-width:none]",
        className,
      )}
    >
      <div className="flex min-w-full shrink-0 snap-start items-center px-4 py-3.5 text-sm font-bold text-foreground">{children}</div>
      {actions.map(({ label, icon: Icon, onClick, tone = "info" }) => (
        <button
          key={label}
          type="button"
          aria-label={label}
          onClick={onClick}
          className={cn(
            "flex w-16 shrink-0 snap-end items-center justify-center outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset",
            TONES[tone],
          )}
        >
          <Icon aria-hidden className="size-4" />
        </button>
      ))}
    </div>
  );
}
