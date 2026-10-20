"use client";

import { CalendarCheck, FolderOpen, Sparkles, Users } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { OnboardingActions, OnboardingStep } from "@/components/onboarding/onboarding-primitives";
import { useStepSubmit } from "@/components/onboarding/use-step-submit";

const FEATURES = [
  {
    icon: CalendarCheck,
    title: "Project management",
    description: "Plan shoots, track timelines, and manage budgets",
  },
  {
    icon: Users,
    title: "Team collaboration",
    description: "Share scripts, storyboards, and notes with your crew",
  },
  {
    icon: FolderOpen,
    title: "Asset library",
    description: "Organize footage, photos, and production documents",
  },
  {
    icon: Sparkles,
    title: "AI Assistant",
    description: "Get intelligent suggestions for scheduling and resource allocation",
  },
];

// Last step before "You're all set": "Get started" marks onboarding complete.
export function FeaturesStep({ userId }: { userId: string }) {
  const { isPending, submit } = useStepSubmit("features");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit(async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({ onboarding_completed_at: new Date().toISOString() })
        .eq("id", userId);
      if (error) throw error;
      // The app checks this flag in the sign-in token; refresh it so the new token has it.
      const { error: userError } = await supabase.auth.updateUser({ data: { onboarded: true } });
      if (userError) throw userError;
      await supabase.auth.refreshSession();
    });
  };

  return (
    <OnboardingStep
      step="features"
      title="What you can do on Nia"
      description="Everything you need to manage productions from pre to post"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-7">
        <ul className="flex flex-col gap-4">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <li key={title} className="flex items-center gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
                <Icon aria-hidden className="size-[18px] text-foreground" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="text-sm leading-[1.4] font-bold text-foreground">{title}</p>
                <p className="text-small leading-normal text-muted-foreground">{description}</p>
              </div>
            </li>
          ))}
        </ul>

        <OnboardingActions submitLabel="Get started" pendingLabel="Finishing…" isPending={isPending} />
      </form>
    </OnboardingStep>
  );
}
