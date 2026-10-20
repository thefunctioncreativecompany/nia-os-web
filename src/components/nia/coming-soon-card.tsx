import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

// The frosted card on coming-soon screens (Ika's Claude Designs "ExploreSoon" and
// "MarketplaceSoon"): a status pill with a breathing dot, the heading, a line or two, then the
// buttons. It rises in when the page opens and sits in the middle of the nearest positioned
// parent, above whatever moves behind it. Reduced motion stops the rise and the dot.
export function ComingSoonCard({
  status,
  tone = "success",
  title,
  titleClassName,
  bodyClassName,
  children,
  actions,
  className,
}: {
  status: string;
  /** The dot's colour: green for a date that's set, amber while it's still to be announced. */
  tone?: "success" | "pending";
  title: string;
  titleClassName?: string;
  bodyClassName?: string;
  /** The body copy. */
  children: ReactNode;
  actions: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-[200] m-auto flex h-fit w-[calc(100%-5rem)] max-w-118 animate-explore-rise flex-col items-center gap-2.5 rounded-2xl border border-border bg-white/85 px-4 pt-4 pb-4 text-center shadow-card-hover backdrop-blur-lg sm:w-[calc(100%-2.5rem)] sm:gap-4 sm:px-9 sm:pt-9 sm:pb-8",
        className,
      )}
    >
      <span className="inline-flex h-7 items-center gap-2 rounded-full border border-border px-3 text-caption font-medium text-muted-foreground">
        <span
          aria-hidden
          className={cn(
            "size-1.75 rounded-full",
            tone === "success" ? "animate-explore-pulse bg-status-confirmed-foreground" : "animate-pending-pulse bg-status-pending-foreground",
          )}
        />
        {status}
      </span>
      <h1 className={cn("text-h2 font-semibold tracking-tight text-foreground sm:text-hero", titleClassName)}>{title}</h1>
      <p className={cn("max-w-90 text-small leading-relaxed text-muted-foreground sm:text-lead", bodyClassName)}>{children}</p>
      <div className="mt-1 flex flex-wrap justify-center gap-2 sm:mt-1.5 sm:gap-2.5">{actions}</div>
    </div>
  );
}

/** Buttons on the card shrink a little on phones. */
export const comingSoonButton = "max-sm:h-9 max-sm:px-4 max-sm:text-small";
