"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bookmark, FileText, FolderPlus, LoaderPinwheel, Plus, Video } from "lucide-react";

import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { currentUser } from "@/lib/supabase/current-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { ChipRow } from "@/components/nia/filter-bar";
import { NewProjectDialog } from "@/components/projects/new-project-dialog";
import { openUpgrade } from "@/components/nia/upgrade-dialog";
import { createProject } from "@/features/templates/engine/save-to-project";

// "Get started with" under the welcome on Home (Ika, 2026-11-19, after Notion's row): one tap to
// the things people start most. Grey pills (the screen's one blue button is elsewhere). One line
// to swipe on phones, wrapping on wide screens (ChipRow).
export function GetStarted({ googleReady }: { googleReady: boolean }) {
  return (
    <div className="flex w-full flex-col gap-3 lg:items-center">
      <p className="text-small font-medium text-muted-foreground">Get started with</p>
      <ChipRow aria-label="Get started with" className="w-full gap-2.5 lg:justify-center">
        <NewProjectDialog>
          <Button variant="secondary" className="shrink-0">
            <FolderPlus aria-hidden /> New project
          </Button>
        </NewProjectDialog>
        <MeetingPicker googleReady={googleReady} />
        <Button asChild variant="secondary" className="shrink-0">
          <Link href="/explore">
            <LoaderPinwheel aria-hidden /> Explore
          </Link>
        </Button>
        <Button asChild variant="secondary" className="shrink-0">
          <Link href="/projects/collections">
            <Bookmark aria-hidden /> Collection
          </Link>
        </Button>
        <Button asChild variant="secondary" className="shrink-0">
          <Link href="/templates">
            <FileText aria-hidden /> Templates
          </Link>
        </Button>
      </ChipRow>
    </div>
  );
}

type Choice = { id: string; title: string };

// A meeting belongs to a project, so Meeting asks which one: the person's recent active projects
// they can edit (meetings are for editors only; wrapped ones left out), loaded when the picker
// opens, and Start a new project under them, named here (Ika, 2026-11-19: "if there is no project
// open related to new meeting, user can start a new project under list of active projects").
// Picking or starting one opens its Google Meet booking, or adding notes until Google Calendar is set up.
function MeetingPicker({ googleReady }: { googleReady: boolean }) {
  const router = useRouter();
  const [projects, setProjects] = useState<Choice[] | null>(null);
  const [open, setOpen] = useState(false);
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (projects) return;
    const supabase = createClient();
    const user = await currentUser(supabase);
    if (!user) return setProjects([]);
    const [{ data: rows }, { data: shared }] = await Promise.all([
      supabase.from("projects").select("id, title, owner_id").is("deleted_at", null).or("stage.is.null,stage.neq.Wrapped").order("updated_at", { ascending: false }).limit(20),
      supabase.from("project_members").select("project_id").eq("user_id", user.id).eq("role", "editor"),
    ]);
    const editable = new Set((shared ?? []).map((m) => m.project_id));
    setProjects((rows ?? []).filter((p) => p.owner_id === user.id || editable.has(p.id)).slice(0, 6));
  };

  const next = googleReady ? "schedule=1" : "notes=1";
  const start = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = name.trim();
    if (!title) return;
    setBusy(true);
    const project = await createProject(title.slice(0, 120), "meeting");
    if (project === "limit") {
      setBusy(false);
      return openUpgrade("projects");
    }
    if (!project) {
      setBusy(false);
      return void toast.error("Couldn't start the project. Try again.");
    }
    setOpen(false);
    setNaming(false);
    setName("");
    setBusy(false);
    router.push(`/projects/${project.id}?${next}`);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) void load();
        else setNaming(false);
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="secondary" className="shrink-0">
          <Video aria-hidden /> Meeting
        </Button>
      </PopoverTrigger>
      <PopoverContent align="center" className="w-72 p-2">
        <p className="px-2 pt-1 pb-2 text-small font-semibold text-foreground">Which project?</p>
        {projects === null ? (
          <div className="flex flex-col gap-1.5 p-2">
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-5 w-3/5" />
          </div>
        ) : (
          <ul className="flex flex-col">
            {projects.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/projects/${p.id}?${next}`}
                  className="block truncate rounded-lg px-2 py-2 text-small text-foreground outline-none hover:bg-muted focus-visible:bg-muted"
                >
                  {p.title}
                </Link>
              </li>
            ))}
            <li className={projects.length ? "mt-1 border-t border-border pt-1" : undefined}>
              {naming ? (
                <form onSubmit={start} className="flex items-center gap-2 p-1">
                  <Input autoFocus aria-label="New project name" placeholder="Project name" value={name} maxLength={120} onChange={(e) => setName(e.target.value)} className="h-9 min-w-0 flex-1 rounded-full text-small" />
                  <Button type="submit" variant="secondary" size="compact" disabled={busy || !name.trim()}>
                    {busy ? "Starting…" : "Start"}
                  </Button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setNaming(true)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-small font-medium text-foreground outline-none hover:bg-muted focus-visible:bg-muted"
                >
                  <Plus aria-hidden className="size-4 text-muted-foreground" /> Start a new project
                </button>
              )}
            </li>
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
