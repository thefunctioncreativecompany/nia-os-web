"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { currentUser } from "@/lib/supabase/current-user";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Dropzone } from "@/components/projects/project-files";

type Choice = { id: string; title: string; coverUrl: string | null };

// "Import files" on Home (audit #6): choose a project you can edit, then drop files into it.
export function ImportFilesDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<Choice[] | null>(null);
  const [project, setProject] = useState<Choice | null>(null);
  const [uploaded, setUploaded] = useState(false);

  useEffect(() => {
    if (!open || projects) return;
    let live = true;
    void (async () => {
      const supabase = createClient();
      const user = await currentUser(supabase);
      if (!user) return;
      const [{ data: own }, { data: shared }] = await Promise.all([
        supabase.from("projects").select("id, title, cover_url, updated_at").eq("owner_id", user.id).is("deleted_at", null),
        supabase.from("project_members").select("projects(id, title, cover_url, updated_at, deleted_at)").eq("user_id", user.id).eq("role", "editor"),
      ]);
      type Row = { id: string; title: string; cover_url: string | null; updated_at: string; deleted_at?: string | null };
      const rows: Row[] = [...((own ?? []) as Row[]), ...((shared ?? []) as unknown as { projects: Row | null }[]).map((m) => m.projects).filter((p): p is Row => !!p && !p.deleted_at)];
      if (live) setProjects(rows.sort((a, b) => b.updated_at.localeCompare(a.updated_at)).map((p) => ({ id: p.id, title: p.title || "Untitled project", coverUrl: p.cover_url })));
    })();
    return () => {
      live = false;
    };
  }, [open, projects]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setProject(null);
          setUploaded(false);
        }
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="flex max-h-[calc(100svh-2rem)] w-[calc(100%-2rem)] max-w-[480px] flex-col gap-5 overflow-y-auto rounded-2xl p-6 sm:max-w-[480px]">
        <DialogTitle className="text-subtitle font-bold">{project ? `Import to ${project.title}` : "Import files"}</DialogTitle>
        <DialogDescription className="-mt-3 text-small text-muted-foreground">
          {project ? "Stills, documents, voice memos and video, up to 50 MB each." : "Which project are they for?"}
        </DialogDescription>
        {!project ? (
          <ul className="flex max-h-[50svh] flex-col gap-1 overflow-y-auto">
            {projects === null && Array.from({ length: 3 }, (_, i) => <li key={i}><Skeleton className="h-14 rounded-lg" /></li>)}
            {projects?.length === 0 && <li className="px-2 py-4 text-small text-muted-foreground">No projects yet. Create one first, then import files into it.</li>}
            {projects?.map((p) => (
              <li key={p.id}>
                <button type="button" onClick={() => setProject(p)} className="flex w-full items-center gap-3 rounded-lg p-2 text-left outline-none transition-colors duration-fast hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50">
                  <span className="aspect-[19/10] w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element -- small cover thumbnails */}
                    {p.coverUrl && <img src={p.coverUrl} alt="" className="size-full object-cover" />}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{p.title}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <>
            <Dropzone projectId={project.id} onUploaded={() => setUploaded(true)} />
            <div className="flex items-center justify-between gap-3">
              <button type="button" onClick={() => setProject(null)} className="inline-flex items-center gap-1.5 rounded-sm text-sm font-semibold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50">
                <ArrowLeft aria-hidden className="size-4" /> Another project
              </button>
              {uploaded && (
                <Button asChild size="compact">
                  <Link href={`/projects/${project.id}#files`}>Open project</Link>
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
