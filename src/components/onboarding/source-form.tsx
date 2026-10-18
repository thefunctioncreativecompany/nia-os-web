"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { HEARD_ABOUT_OPTIONS } from "@/lib/onboarding";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { OnboardingActions, OnboardingStep } from "@/components/onboarding/onboarding-primitives";
import { useStepSubmit } from "@/components/onboarding/use-step-submit";

export function SourceForm({
  userId,
  email,
  initial,
}: {
  userId: string;
  email: string;
  initial: string | null;
}) {
  const router = useRouter();
  const [source, setSource] = useState(initial);
  const { isPending, submit } = useStepSubmit("source");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit(async () => {
      const { error } = await createClient()
        .from("profiles")
        .update({ heard_about: source })
        .eq("id", userId);
      if (error) throw error;
    });
  };

  const logout = async () => {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <OnboardingStep
      narrow
      title="How did you hear about us?"
      description="Help us tailor your production experience"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-7">
        <div role="radiogroup" aria-label="How did you hear about us?" className="flex flex-wrap gap-2">
          {HEARD_ABOUT_OPTIONS.map((option) => {
            const selected = source === option;
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setSource(option)}
                className={cn(
                  "rounded-full border px-[18px] py-2.5 text-sm outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
                  selected
                    ? "border-primary bg-primary leading-[1.4] font-bold text-primary-foreground"
                    : "border-border bg-white leading-normal font-medium text-foreground hover:bg-muted",
                )}
              >
                {option}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-5">
          <OnboardingActions isPending={isPending} disabled={!source} />
          <div className="flex flex-col items-center gap-1 text-center text-small leading-normal text-muted-foreground">
            <p className="w-full truncate">
              Signed in as <span className="font-bold text-foreground">{email}</span>
            </p>
            <p>
              Not you?{" "}
              <button
                type="button"
                onClick={logout}
                className="rounded-sm font-bold text-foreground outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                Log out
              </button>
            </p>
          </div>
        </div>
      </form>
    </OnboardingStep>
  );
}
