"use client";

import { useState } from "react";
import {
  Calendar,
  Camera,
  Clipboard,
  Cpu,
  FileText,
  Film,
  Layers,
  Music,
  SlidersVertical,
  Video,
  type LucideIcon,
} from "lucide-react";

import { PROFESSIONS } from "@/lib/onboarding";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { OnboardingActions, OnboardingStep } from "@/components/onboarding/onboarding-primitives";
import { useStepSubmit } from "@/components/onboarding/use-step-submit";

const ICONS: Record<(typeof PROFESSIONS)[number], LucideIcon> = {
  Director: Video,
  Producer: Calendar,
  Cinematographer: Camera,
  Editor: Film,
  "Production Designer": Layers,
  "Sound Designer": Music,
  "VFX Supervisor": Cpu,
  Screenwriter: FileText,
  "Production Assistant": Clipboard,
  Colorist: SlidersVertical,
};

export function ProfessionForm({ userId, initial }: { userId: string; initial: string | null }) {
  const [profession, setProfession] = useState(initial);
  const { isPending, submit } = useStepSubmit("profession");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit(async () => {
      const { error } = await createClient()
        .from("profiles")
        .update({ profession })
        .eq("id", userId);
      if (error) throw error;
    });
  };

  return (
    <OnboardingStep step="profession" title="Your profession" description="What best describes your role?">
      <form onSubmit={handleSubmit} className="flex flex-col gap-7">
        <div role="radiogroup" aria-label="Your profession" className="grid grid-cols-2 gap-3">
          {PROFESSIONS.map((option) => {
            const Icon = ICONS[option];
            const selected = profession === option;
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setProfession(option)}
                className={cn(
                  "flex min-h-14 min-w-0 items-center gap-2 rounded-lg border p-2.5 text-left sm:gap-3 sm:p-3 outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
                  selected
                    ? "border-primary bg-muted ring-1 ring-primary"
                    : "border-border bg-white hover:bg-muted",
                )}
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full sm:size-8",
                    selected ? "bg-primary text-primary-foreground" : "bg-border text-foreground",
                  )}
                >
                  <Icon aria-hidden className="size-3.5 sm:size-4" />
                </span>
                <span
                  className={cn(
                    "min-w-0 text-xs leading-normal text-foreground [overflow-wrap:anywhere] min-[380px]:text-[13px]",
                    selected ? "font-bold" : "font-medium",
                  )}
                >
                  {option}
                </span>
              </button>
            );
          })}
        </div>

        <OnboardingActions isPending={isPending} disabled={!profession} />
      </form>
    </OnboardingStep>
  );
}
