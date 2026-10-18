"use client";

import { useState } from "react";
import { X } from "lucide-react";

import { nextStepHref } from "@/lib/onboarding";
import type { OnboardingWorkspace } from "@/lib/onboarding-data";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OnboardingActions, OnboardingStep } from "@/components/onboarding/onboarding-primitives";
import { useStepSubmit } from "@/components/onboarding/use-step-submit";

const MAX_INVITES = 10;

const fieldClassName =
  "h-[46px] rounded-lg border-border bg-white px-4 text-sm leading-normal text-foreground placeholder:text-muted-foreground md:text-sm";

export function WorkspaceForm({ initial }: { initial: OnboardingWorkspace }) {
  const [name, setName] = useState(initial.name);
  const [role, setRole] = useState(initial.role);
  const [invites, setInvites] = useState(initial.invites.length ? initial.invites : [""]);
  const { isPending, submit } = useStepSubmit("workspace");

  const setInvite = (index: number, value: string) =>
    setInvites((list) => list.map((email, i) => (i === index ? value : email)));

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

      // Keep the stored invites in step with the list (emails go out in a later update).
      const emails = [...new Set(invites.map((email) => email.trim().toLowerCase()).filter(Boolean))];
      const removed = initial.invites.filter((email) => !emails.includes(email));
      if (removed.length) {
        const { error } = await supabase
          .from("workspace_invites")
          .delete()
          .eq("workspace_id", workspaceId)
          .in("email", removed);
        if (error) throw error;
      }
      if (emails.length) {
        const { error } = await supabase
          .from("workspace_invites")
          .upsert(
            emails.map((email) => ({ workspace_id: workspaceId, email })),
            { onConflict: "workspace_id,email", ignoreDuplicates: true },
          );
        if (error) throw error;
      }
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

        <fieldset aria-labelledby="invite-label" className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-small leading-normal">
            <span id="invite-label" className="font-medium text-foreground">
              Invite team members (optional)
            </span>
            {invites.length < MAX_INVITES && (
              <button
                type="button"
                onClick={() => setInvites((list) => [...list, ""])}
                className="rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                + Add another
              </button>
            )}
          </div>
          {invites.map((email, index) => (
            <div key={index} className="relative">
              <Label htmlFor={`invite-${index}`} className="sr-only">
                Team member email {index + 1}
              </Label>
              <Input
                id={`invite-${index}`}
                type="email"
                autoComplete="off"
                maxLength={254}
                value={email}
                onChange={(e) => setInvite(index, e.target.value)}
                placeholder="Enter email address"
                className={invites.length > 1 ? `${fieldClassName} pr-11` : fieldClassName}
              />
              {invites.length > 1 && (
                <button
                  type="button"
                  aria-label={`Remove email ${index + 1}`}
                  onClick={() => setInvites((list) => list.filter((_, i) => i !== index))}
                  className="absolute inset-y-0 right-3 my-auto flex size-7 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <X aria-hidden className="size-4" />
                </button>
              )}
            </div>
          ))}
        </fieldset>

        <OnboardingActions skipHref={nextStepHref("workspace")} isPending={isPending} className="gap-4" />
      </form>
    </OnboardingStep>
  );
}
