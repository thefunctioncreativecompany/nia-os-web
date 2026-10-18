"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { nextStepHref, type OnboardingStepId } from "@/lib/onboarding";

// Runs a step's save, then moves on to the next step. Stays pending while the
// next page loads; shows the error and lets them retry if the save fails.
export function useStepSubmit(step: OnboardingStepId) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const submit = async (save?: () => Promise<void>) => {
    setIsPending(true);
    try {
      await save?.();
      router.push(nextStepHref(step));
    } catch (error: unknown) {
      toast.error(errorMessage(error));
      setIsPending(false);
    }
  };

  return { isPending, submit };
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) return String(error.message);
  return "Something went wrong. Please try again.";
}
