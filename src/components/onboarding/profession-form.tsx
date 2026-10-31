"use client";

import { useState } from "react";
import { Calendar, Camera, Check, Clipboard, Film, Search, Smartphone, Video, type LucideIcon } from "lucide-react";

import { COMMON_PROFESSIONS, PROFESSION_SECTORS } from "@/lib/onboarding";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { OnboardingActions, OnboardingStep } from "@/components/onboarding/onboarding-primitives";
import { useStepSubmit } from "@/components/onboarding/use-step-submit";

const ICONS: Record<(typeof COMMON_PROFESSIONS)[number], LucideIcon> = {
  Producer: Calendar,
  Director: Video,
  "Director of Photography": Camera,
  "Editor (Film / Video)": Film,
  "Content Creator / Influencer": Smartphone,
  "Production Assistant": Clipboard,
};

// Your profession (Fix 6): the most common roles as tiles, then every role by sector in a
// scrollable list with a filter. One choice across both; it also tells "Suggested for you"
// which templates to start with.
export function ProfessionForm({ userId, initial }: { userId: string; initial: string | null }) {
  const [profession, setProfession] = useState(initial);
  const [filter, setFilter] = useState("");
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

  const q = filter.trim().toLowerCase();
  const sectors = PROFESSION_SECTORS.map((s) => ({
    ...s,
    roles: q ? s.roles.filter((r) => r.toLowerCase().includes(q) || s.sector.toLowerCase().includes(q)) : s.roles,
  })).filter((s) => s.roles.length);

  return (
    <OnboardingStep step="profession" title="Your profession" description="What best describes your role?">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div role="radiogroup" aria-label="Your profession" className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3">
            {COMMON_PROFESSIONS.map((option) => {
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
                    "flex min-h-14 min-w-0 items-center gap-2 rounded-lg border p-2.5 text-left outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 sm:gap-3 sm:p-3",
                    selected ? "border-primary bg-muted ring-1 ring-primary" : "border-border bg-card hover:bg-muted",
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
                      "min-w-0 text-xs leading-normal text-foreground [overflow-wrap:anywhere] min-[380px]:text-small",
                      selected ? "font-bold" : "font-medium",
                    )}
                  >
                    {option}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="role-filter" className="text-small font-medium text-foreground">
              Or find your role
            </label>
            <div className="flex h-11 items-center gap-2 rounded-lg border border-border bg-card px-3 focus-within:border-foreground focus-within:ring-3 focus-within:ring-ring/50">
              <Search aria-hidden className="size-4 shrink-0 text-muted-foreground" />
              <input
                id="role-filter"
                type="search"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Gaffer, stylist, talent agent…"
                autoComplete="off"
                className="min-w-0 flex-1 bg-transparent text-small text-foreground outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
              />
            </div>
            <div className="max-h-72 overflow-y-auto rounded-lg border border-border bg-card">
              {sectors.map(({ sector, roles }) => (
                <div key={sector} role="group" aria-label={sector}>
                  <p className="sticky top-0 border-b border-border bg-muted px-3 py-1.5 text-caption font-semibold text-muted-foreground">{sector}</p>
                  {roles.map((role) => {
                    const selected = profession === role;
                    return (
                      <button
                        key={role}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setProfession(role)}
                        className={cn(
                          "flex min-h-11 w-full items-center justify-between gap-3 border-b border-border px-3 text-left text-small outline-none last:border-b-0 hover:bg-muted focus-visible:bg-muted",
                          selected ? "font-bold text-foreground" : "text-foreground",
                        )}
                      >
                        {role}
                        {selected && <Check aria-hidden className="size-4 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              ))}
              {sectors.length === 0 && <p className="px-3 py-4 text-small text-muted-foreground">No role matches. Try a shorter word.</p>}
            </div>
          </div>
        </div>

        <OnboardingActions isPending={isPending} disabled={!profession} />
      </form>
    </OnboardingStep>
  );
}
