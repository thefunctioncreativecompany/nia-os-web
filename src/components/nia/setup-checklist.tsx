import Link from "next/link";
import { Check, ChevronRight, X } from "lucide-react";

import { cn } from "@/lib/utils";

export type SetupStep = { id: string; title: string; description: string; href: string; done: boolean };

// "Welcome to Nia" first-steps card with a segmented progress bar (Figma "32 — Welcome
// Setup Card"). Hide it once every step is done or the person closes it.
export function SetupChecklist({
  steps,
  onDismiss,
  className,
}: {
  steps: SetupStep[];
  onDismiss: () => void;
  className?: string;
}) {
  const done = steps.filter((s) => s.done).length;

  return (
    <section aria-labelledby="setup-title" className={cn("overflow-hidden rounded-2xl border border-border bg-card", className)}>
      <header className="flex flex-col gap-4 bg-nia-panel p-6 md:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 id="setup-title" className="text-h3 font-bold text-foreground">Welcome to Nia</h3>
            <p className="mt-1 text-sm text-muted-foreground">A few steps to get set up.</p>
          </div>
          <button
            type="button"
            aria-label="Hide setup steps"
            onClick={onDismiss}
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <X aria-hidden className="size-4" />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div aria-hidden className="flex flex-1 gap-1.5">
            {steps.map((s, i) => (
              <span key={s.id} className={cn("h-1.5 flex-1 rounded-full", i < done ? "bg-gold" : "bg-border")} />
            ))}
          </div>
          <span className="text-micro font-bold text-muted-foreground">
            {done}/{steps.length}
            <span className="sr-only"> steps done</span>
          </span>
        </div>
      </header>
      <ol className="divide-y divide-border">
        {steps.map((step) => (
          <li key={step.id}>
            <Link
              href={step.href}
              className="flex items-center gap-4 px-6 py-5 outline-none hover:bg-nia-panel focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset md:px-7"
            >
              <span
                aria-hidden
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border-2",
                  step.done ? "border-nia-success bg-nia-success text-background" : "border-border",
                )}
              >
                {step.done && <Check className="size-3.5" strokeWidth={3} />}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className={cn("text-sm font-bold text-foreground", step.done && "text-muted-foreground line-through")}>
                  {step.title}
                  {step.done && <span className="sr-only"> (done)</span>}
                </span>
                <span className="text-small text-muted-foreground">{step.description}</span>
              </span>
              <ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
