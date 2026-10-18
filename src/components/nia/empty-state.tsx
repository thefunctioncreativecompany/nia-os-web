import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

// Placeholder for a list or section with nothing in it yet (Figma: Home "Activity List
// (Empty)" and "Cards Stack (Empty)"). Say what will appear and how to get it there.
export function EmptyState({
  message,
  icon: Icon,
  illustration,
  action,
  className,
}: {
  message: string;
  icon?: LucideIcon;
  // Slot for a custom illustration, once one exists in Figma.
  illustration?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card p-8 text-center md:p-10",
        className,
      )}
    >
      {illustration}
      {Icon && <Icon aria-hidden className="size-6 text-muted-foreground" strokeWidth={1.5} />}
      <p className="text-sm leading-normal text-muted-foreground">{message}</p>
      {action}
    </div>
  );
}
