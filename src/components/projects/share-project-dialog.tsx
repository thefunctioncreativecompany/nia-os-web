"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { toast } from "sonner";

import { sendProjectInvite } from "@/lib/project-invite";
import type { ProjectRole } from "@/lib/projects";
import { createClient } from "@/lib/supabase/client";
import { recordEvent } from "@/lib/product-events";
import { projectLimited } from "@/lib/plan-client";
import { FREE_LIMITS } from "@/lib/plans";
import { getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { openUpgrade } from "@/components/nia/upgrade-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

type Person = {
  kind: "owner" | "member" | "invite";
  user_id: string | null;
  name: string;
  email: string;
  avatar_url: string | null;
  role: "owner" | "editor" | "viewer";
};

const ROLE_LABELS = { editor: "Can edit", viewer: "Can view" } as const;

const roleTriggerClassName =
  "h-auto w-auto gap-1.5 border-0 bg-transparent px-2 py-1 text-small text-muted-foreground shadow-none data-[size=default]:h-auto";

// "Share Project" (Figma 798:876): invite people by email, change or remove their
// access, and turn the view-only link on or off. Only the owner can change anything.
export function ShareProjectDialog({
  projectId,
  role,
  shareToken: initialToken,
  children,
}: {
  projectId: string;
  role: ProjectRole;
  shareToken: string | null;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const isOwner = role === "owner";
  const [open, setOpen] = useState(false);
  const [people, setPeople] = useState<Person[] | null>(null);
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"editor" | "viewer">("viewer");
  const [token, setToken] = useState(initialToken);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await createClient().rpc("project_people", { pid: projectId });
    if (error) toast.error(`Couldn't load who has access: ${error.message}`);
    else setPeople(data as Person[]);
  }, [projectId]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setToken(initialToken);
      load();
    }
  };

  const run = async (work: () => PromiseLike<{ error: { message: string } | null }>, success?: string) => {
    setBusy(true);
    const { error } = await work();
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return false;
    }
    if (success) toast.success(success);
    await load();
    router.refresh();
    return true;
  };

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    const address = email.trim();
    if (!address) return;
    setBusy(true);
    // Free projects are shared with one person (live site only); a new person needs an upgrade.
    const others = (people ?? []).filter((p) => p.kind !== "owner");
    const isNew = !others.some((p) => p.email.toLowerCase() === address.toLowerCase());
    if (isNew && others.length >= FREE_LIMITS.collaboratorsPerProject && (await projectLimited(createClient(), projectId))) {
      setBusy(false);
      openUpgrade("collaborators");
      return;
    }
    const { data, error } = await createClient().rpc("share_project", {
      pid: projectId,
      invitee_email: address,
      invitee_role: inviteRole,
    });
    if (error) {
      setBusy(false);
      toast.error(error.message);
      return;
    }
    recordEvent("crew_invited", { projectId, props: { role: inviteRole } });
    const { sent } = await sendProjectInvite(projectId, address).catch(() => ({ sent: false }));
    setBusy(false);
    toast.success(
      data === "member"
        ? `${address} can now open this project${sent ? ". We've emailed them." : ""}`
        : `Invited ${address}. ${sent ? "We've emailed them a link to join." : "They'll get access when they sign up with that email."}`,
    );
    setEmail("");
    await load();
    router.refresh();
  };

  const toggleLink = async (enabled: boolean) => {
    setBusy(true);
    const { data, error } = await createClient().rpc("set_project_link", { pid: projectId, enabled });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setToken(data as string | null);
    toast.success(enabled ? "Link ready. Anyone with it can view." : "Link turned off. It no longer works.");
    router.refresh();
  };

  const link = token && typeof window !== "undefined" ? `${window.location.origin}/share/${token}` : "";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="flex max-h-[calc(100svh-2rem)] w-[calc(100%-2rem)] max-w-[520px] flex-col gap-6 overflow-y-auto rounded-2xl p-6 sm:max-w-[520px] sm:p-8">
        <DialogTitle className="text-subtitle font-bold">Share project</DialogTitle>
        <DialogDescription className="sr-only">
          Choose who can open this project, and whether a view-only link works.
        </DialogDescription>

        {isOwner && (
          <form onSubmit={invite} className="flex flex-col gap-3 sm:flex-row">
            <Label htmlFor="share-email" className="sr-only">
              Email address
            </Label>
            <Input
              id="share-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Invite by email..."
              className="h-auto flex-1 rounded-lg border-border px-4 py-3 text-sm md:text-sm"
            />
            <div className="flex gap-3">
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "editor" | "viewer")}>
                <SelectTrigger aria-label="Access for this person" className="h-auto rounded-lg px-3 py-3 text-sm data-[size=default]:h-auto">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" align="end">
                  <SelectItem value="viewer">Can view</SelectItem>
                  <SelectItem value="editor">Can edit</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" disabled={busy || !email.trim()} className="h-auto rounded-lg px-4 py-3 text-small font-bold">
                Invite
              </Button>
            </div>
          </form>
        )}

        <section className="flex flex-col gap-4">
          <h3 className="text-small leading-normal font-bold text-muted-foreground">Project members</h3>
          {people === null ? (
            <p className="text-small text-muted-foreground">Loading…</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {people.map((person) => (
                <li key={person.user_id ?? person.email} className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="size-9">
                      {person.avatar_url && <AvatarImage src={person.avatar_url} alt="" />}
                      <AvatarFallback className="bg-accent text-small font-bold text-foreground">
                        {getInitials(person.kind === "invite" ? "" : person.name, person.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <p className="truncate text-sm leading-normal font-semibold text-foreground">
                        {person.kind === "invite" ? "Invited" : person.name}
                      </p>
                      <p className="truncate text-micro text-muted-foreground">{person.email}</p>
                    </div>
                  </div>
                  {person.role === "owner" ? (
                    <span className="px-2 text-small text-muted-foreground">Owner</span>
                  ) : isOwner ? (
                    <div className="flex shrink-0 items-center">
                      <Select
                        value={person.role}
                        onValueChange={(next) =>
                          run(
                            () =>
                              createClient().rpc("set_project_role", {
                                pid: projectId,
                                target_user: person.user_id,
                                target_email: person.email,
                                new_role: next,
                              }),
                            "Access updated",
                          )
                        }
                      >
                        <SelectTrigger aria-label={`Access for ${person.email}`} className={roleTriggerClassName}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent position="popper" align="end">
                          <SelectItem value="viewer">Can view</SelectItem>
                          <SelectItem value="editor">Can edit</SelectItem>
                        </SelectContent>
                      </Select>
                      <button
                        type="button"
                        disabled={busy}
                        aria-label={`Remove ${person.email}`}
                        onClick={() =>
                          run(
                            () =>
                              createClient().rpc("remove_project_access", {
                                pid: projectId,
                                target_user: person.user_id,
                                target_email: person.email,
                              }),
                            `Removed ${person.email}`,
                          )
                        }
                        className="flex size-8 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        <X aria-hidden className="size-4" />
                      </button>
                    </div>
                  ) : (
                    <span className="px-2 text-small text-muted-foreground">{ROLE_LABELS[person.role]}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="h-px w-full bg-border" />

        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-small leading-normal font-bold text-muted-foreground">Invite link</h3>
            <label className="flex items-center gap-2 text-caption text-muted-foreground">
              Anyone with the link can view
              <Switch
                checked={Boolean(token)}
                disabled={!isOwner || busy}
                onCheckedChange={toggleLink}
                aria-label="Anyone with the link can view"
              />
            </label>
          </div>
          {token && (
            <div className="flex gap-3">
              <p className="min-w-0 flex-1 truncate rounded-lg border border-border bg-nia-surface p-3 text-small text-muted-foreground">
                {link}
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  await navigator.clipboard.writeText(link);
                  toast.success("Link copied");
                }}
                className="h-auto rounded-lg px-4 py-3 text-small font-bold"
              >
                Copy
              </Button>
            </div>
          )}
        </section>

        <Button type="button" onClick={() => setOpen(false)} className="h-auto w-full rounded-lg p-3.5">
          Done
        </Button>
      </DialogContent>
    </Dialog>
  );
}
