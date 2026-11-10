"use client";

import { useState } from "react";

import type { OnboardingWorkspace } from "@/lib/onboarding-data";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OnboardingActions, OnboardingStep } from "@/components/onboarding/onboarding-primitives";
import { completeOnboarding } from "@/components/onboarding/complete";
import { useStepSubmit } from "@/components/onboarding/use-step-submit";

const fieldClassName =
  "h-[46px] rounded-lg border-border bg-card px-4 text-sm leading-normal text-foreground placeholder:text-muted-foreground md:text-sm";

// The last onboarding step: saving it (or skipping it) marks onboarding complete.
export function WorkspaceForm({ initial }: { initial: OnboardingWorkspace }) {
  const [name, setName] = useState(initial.name);
  const [role, setRole] = useState(initial.role);
  const { isPending, submit } = useStepSubmit("workspace");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit(async () => {
      const supabase = createClient();
      const { userId } = initial;
      let workspaceId = initial.workspaceId;

      if (workspaceId) {
        const { error } = await supabase
          .from("workspaces")
          .update({ name: name.trim() })
          .eq("id", workspaceId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("workspaces")
          .insert({ name: name.trim(), owner_id: userId })
          .select("id")
          .single();
        if (error) throw error;
        workspaceId = data.id;
      }

      const { error: memberError } = await supabase
        .from("workspace_members")
        .upsert({ workspace_id: workspaceId, user_id: userId, role: role.trim() });
      if (memberError) throw memberError;
      await completeOnboarding(supabase, userId);
    });
  };

  return (
    <OnboardingStep
      step="workspace"
      title="Set up your workspace"
      description="Your workspace is where your team collaborates on productions"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-7">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="workspace-name" className="text-small leading-normal font-medium">
              Workspace name
            </Label>
            <Input
              id="workspace-name"
              required
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Summit Productions"
              className={fieldClassName}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="workspace-role" className="text-small leading-normal font-medium">
              Your role in this workspace
            </Label>
            <Input
              id="workspace-role"
              maxLength={80}
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Lead Director"
              className={fieldClassName}
            />
          </div>
        </div>

        <OnboardingActions onSkip={() => submit(() => completeOnboarding(createClient(), initial.userId))} isPending={isPending} className="gap-4" />
      </form>
    </OnboardingStep>
  );
}
