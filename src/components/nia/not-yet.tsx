import { Clock } from "lucide-react";

import { cn } from "@/lib/utils";

// The line beside a greyed-out control saying when it starts working (Ika, 2026-10-21: anything
// that doesn't work yet is greyed out, instead of looking active and then saying nothing
// happened). Remove the `disabled` and this line when the feature opens.
export function NotYet({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("flex items-center gap-1.5 text-caption text-muted-foreground", className)}>
      <Clock aria-hidden className="size-3.5 shrink-0" />
      {children}
    </p>
  );
}
