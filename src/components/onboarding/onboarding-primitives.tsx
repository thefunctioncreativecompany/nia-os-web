import Link from "next/link";

import {
  ONBOARDING_TOTAL_STEPS,
  stepNumber,
  type OnboardingStepId,
} from "@/lib/onboarding";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { authButtonClassName } from "@/components/auth/auth-primitives";

// Shared column for every onboarding screen: "Step N of 8", heading, description,
// then the step's content.
export function OnboardingStep({
  step,
  title,
  description,
  centered = false,
  narrow = false,
  className,
  children,
}: {
  step?: OnboardingStepId;
  title: string;
  description: string;
  centered?: boolean;
  narrow?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex w-full flex-col gap-7",
        narrow ? "max-w-[380px]" : "max-w-[440px]",
        centered && "items-center text-center",
        className,
      )}
    >
      <header className="flex w-full flex-col gap-2">
        {step && (
          <p className="text-sm leading-normal font-medium text-muted-foreground">
            Step {stepNumber(step)} of {ONBOARDING_TOTAL_STEPS}
          </p>
        )}
        <h1 className="text-[32px] leading-[1.3] font-bold text-foreground">{title}</h1>
        <p className="text-sm leading-normal text-muted-foreground">{description}</p>
      </header>
      {children}
    </div>
  );
}

// Optional "Skip" link above the black Continue pill.
export function OnboardingActions({
  skipHref,
  skipLabel = "Skip for now",
  submitLabel = "Continue",
  pendingLabel = "Saving…",
  isPending = false,
  disabled = false,
  className,
}: {
  skipHref?: string;
  skipLabel?: string;
  submitLabel?: string;
  pendingLabel?: string;
  isPending?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex w-full flex-col items-center gap-5", className)}>
      {skipHref && <SkipLink href={skipHref}>{skipLabel}</SkipLink>}
      <Button type="submit" disabled={disabled || isPending} className={authButtonClassName}>
        {isPending ? pendingLabel : submitLabel}
      </Button>
    </div>
  );
}

export function SkipLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-sm text-[13px] leading-normal text-muted-foreground outline-none hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {children}
    </Link>
  );
}

export function OnboardingSkeleton() {
  return (
    <div className="flex w-full max-w-[440px] flex-col gap-7" aria-busy="true" aria-label="Loading">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-5 w-full" />
      </div>
      <Skeleton className="h-56 rounded-xl" />
      <Skeleton className="h-11 rounded-full" />
    </div>
  );
}
