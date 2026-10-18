import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

// Wizard progress: done steps get a green tick, the current one is filled, the rest
// are outlined (design system Section 4.5, "Stepper / Wizard Checklist").
export function Steps({
  steps,
  current,
  className,
}: {
  steps: string[];
  // Index of the step in progress.
  current: number;
  className?: string;
}) {
  return (
    <ol className={cn("flex flex-wrap items-center gap-x-3 gap-y-2", className)}>
      {steps.map((step, index) => {
        const state = index < current ? "done" : index === current ? "current" : "upcoming";
        return (
          <li
            key={step}
            aria-current={state === "current" ? "step" : undefined}
            className="flex items-center gap-2"
          >
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full border text-micro font-bold",
                state === "done" && "border-nia-success bg-nia-success-bg text-nia-success",
                state === "current" && "border-primary bg-primary text-primary-foreground",
                state === "upcoming" && "border-border bg-white text-muted-foreground",
              )}
            >
              {state === "done" ? <Check aria-hidden className="size-3.5" strokeWidth={3} /> : index + 1}
            </span>
            <span
              className={cn(
                "text-small whitespace-nowrap",
                state === "done" && "font-semibold text-nia-success",
                state === "current" && "font-bold text-foreground",
                state === "upcoming" && "text-muted-foreground",
              )}
            >
              {step}
              {state === "done" && <span className="sr-only"> (done)</span>}
            </span>
            {index < steps.length - 1 && <span aria-hidden className="h-px w-8 bg-border" />}
          </li>
        );
      })}
    </ol>
  );
}
