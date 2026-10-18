"use client";

import { useState } from "react";
import Image from "next/image";

import { nextStepHref } from "@/lib/onboarding";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { OnboardingActions, OnboardingStep } from "@/components/onboarding/onboarding-primitives";
import { SAMPLE_CREATORS } from "@/components/onboarding/sample-creators";
import { useStepSubmit } from "@/components/onboarding/use-step-submit";

export function FollowForm({ userId, initial }: { userId: string; initial: string[] }) {
  const [following, setFollowing] = useState<ReadonlySet<string>>(() => new Set(initial));
  const { isPending, submit } = useStepSubmit("follow");

  const toggle = (id: string) =>
    setFollowing((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit(async () => {
      const { error } = await createClient()
        .from("profiles")
        .update({ followed_creators: [...following] })
        .eq("id", userId);
      if (error) throw error;
    });
  };

  return (
    <OnboardingStep
      step="follow"
      title="Follow creators & studios"
      description="Personalize your feed with people and studios related to your craft"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-7">
        <ul className="flex flex-col gap-0.5">
          {SAMPLE_CREATORS.map((creator) => {
            const isFollowing = following.has(creator.id);
            return (
              <li
                key={creator.id}
                className="flex items-center justify-between gap-3 border-b border-accent py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Image
                    src={creator.avatar}
                    alt=""
                    width={44}
                    height={44}
                    className="size-11 shrink-0 rounded-full object-cover"
                  />
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <p className="text-sm leading-[1.4] font-bold text-foreground">{creator.name}</p>
                    <p className="text-small leading-normal text-muted-foreground">
                      {creator.description}
                    </p>
                    <p className="text-xs leading-normal text-ring">{creator.followers}</p>
                  </div>
                </div>
                <button
                  type="button"
                  aria-pressed={isFollowing}
                  aria-label={`${isFollowing ? "Unfollow" : "Follow"} ${creator.name}`}
                  onClick={() => toggle(creator.id)}
                  className={cn(
                    "shrink-0 rounded-full border px-4 py-1.5 text-xs leading-normal font-bold outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
                    isFollowing
                      ? "border-primary bg-primary text-primary-foreground hover:bg-primary/85"
                      : "border-border bg-white text-foreground hover:bg-muted",
                  )}
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>
              </li>
            );
          })}
        </ul>

        <OnboardingActions skipHref={nextStepHref("follow")} skipLabel="Skip this step" isPending={isPending} />
      </form>
    </OnboardingStep>
  );
}
