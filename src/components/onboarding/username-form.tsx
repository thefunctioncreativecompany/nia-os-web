"use client";

import { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";

import { USERNAME_PATTERN, suggestUsernames } from "@/lib/onboarding";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OnboardingActions, OnboardingStep } from "@/components/onboarding/onboarding-primitives";
import { useStepSubmit } from "@/components/onboarding/use-step-submit";

type Status = "checking" | "available" | "taken" | "invalid";

// Which of these names are free (the user's own current name counts as free).
async function availableUsernames(candidates: string[]) {
  const { data, error } = await createClient().rpc("available_usernames", { candidates });
  if (error) throw error;
  return new Set<string>(data ?? []);
}

export function UsernameForm({
  userId,
  fullName,
  email,
  initial,
}: {
  userId: string;
  fullName: string;
  email: string;
  initial: string | null;
}) {
  const ideas = useMemo(() => suggestUsernames(fullName, email), [fullName, email]);
  const [username, setUsername] = useState(initial ?? "");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [checked, setChecked] = useState<{ name: string; available: boolean } | null>(null);
  const { isPending, submit } = useStepSubmit("username");

  // Fill in the first free idea (unless they already have a username) and list the rest.
  useEffect(() => {
    let cancelled = false;
    availableUsernames(ideas)
      .then((free) => {
        if (cancelled) return;
        const freeIdeas = ideas.filter((idea) => free.has(idea));
        setUsername((current) => current || freeIdeas[0] || "");
        setSuggestions(freeIdeas);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [ideas]);

  // Check the typed name once they pause.
  useEffect(() => {
    if (!USERNAME_PATTERN.test(username)) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      availableUsernames([username])
        .then((free) => {
          if (!cancelled) setChecked({ name: username, available: free.has(username) });
        })
        .catch(() => {});
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [username]);

  const status: Status | null = !username
    ? null
    : !USERNAME_PATTERN.test(username)
      ? "invalid"
      : checked?.name !== username
        ? "checking"
        : checked.available
          ? "available"
          : "taken";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit(async () => {
      const { error } = await createClient()
        .from("profiles")
        .update({ username })
        .eq("id", userId);
      if (error?.code === "23505") throw new Error("That username was just taken. Try another.");
      if (error) throw error;
    });
  };

  const otherSuggestions = suggestions.filter((s) => s !== username).slice(0, 3);

  return (
    <OnboardingStep
      step="username"
      title="Choose your username"
      description="We've suggested a username based on your name. You can change it anytime."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-7">
        <div className="flex flex-col items-start gap-3">
          <Label htmlFor="username" className="sr-only">
            Username
          </Label>
          <div className="relative w-full">
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm leading-normal font-medium text-muted-foreground">
              @
            </span>
            <Input
              id="username"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={30}
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
              aria-describedby="username-status"
              aria-invalid={status === "invalid" || status === "taken"}
              className="h-auto rounded-lg border-border bg-white py-3 pr-4 pl-9 text-sm leading-normal text-foreground md:text-sm"
            />
          </div>
          <UsernameStatus status={status} />
        </div>

        {otherSuggestions.length > 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-micro leading-[1.4] font-bold text-muted-foreground">
              OTHER SUGGESTIONS
            </p>
            <ul className="flex flex-col gap-2">
              {otherSuggestions.map((suggestion) => (
                <li key={suggestion}>
                  <button
                    type="button"
                    onClick={() => setUsername(suggestion)}
                    className="w-full rounded-md border border-border bg-muted px-3 py-2 text-left text-sm leading-normal text-foreground outline-none transition-colors hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    @{suggestion}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <OnboardingActions isPending={isPending} disabled={status !== "available"} />
      </form>
    </OnboardingStep>
  );
}

function UsernameStatus({ status }: { status: Status | null }) {
  const content = {
    checking: { label: "Checking…", className: "bg-muted text-muted-foreground" },
    available: { label: "Available", className: "bg-nia-positive/10 text-nia-positive" },
    taken: { label: "Already taken", className: "bg-destructive/10 text-destructive" },
    invalid: {
      label: "3–30 characters: lowercase letters, numbers, dots and underscores",
      className: "bg-destructive/10 text-destructive",
    },
  };
  const current = status ? content[status] : null;

  return (
    <p
      id="username-status"
      aria-live="polite"
      className={cn(
        "flex items-center gap-1.5 rounded-sm px-3 py-1 text-xs leading-normal font-bold",
        current?.className,
        !current && "sr-only",
      )}
    >
      {status === "available" && <Check aria-hidden className="size-3" strokeWidth={3} />}
      {current?.label}
    </p>
  );
}
