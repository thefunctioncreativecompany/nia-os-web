"use client";

import type { Project, ProjectRole } from "@/lib/projects";
import { cn } from "@/lib/utils";
import { DeleteProjectDialog } from "@/components/projects/delete-project-dialog";
import { EditDetailsDialog } from "@/components/projects/edit-details-dialog";
import { ShareProjectDialog } from "@/components/projects/share-project-dialog";

const rowClassName =
  "flex h-12 w-full items-center rounded-md border border-border bg-white px-4 text-left text-small leading-[1.4] font-semibold text-foreground outline-none transition-colors duration-fast hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-white";

// "Project Actions" card (Figma 798:720).
export function ProjectActions({ project, role }: { project: Project; role: ProjectRole }) {
  const canEdit = role !== "viewer";

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-nia-surface p-6">
      <h2 className="text-base leading-normal font-bold text-foreground">Project Actions</h2>
      <div className="flex flex-col gap-1">
        {canEdit && (
          <EditDetailsDialog project={project}>
            <button type="button" className={rowClassName}>
              Edit Project Details
            </button>
          </EditDetailsDialog>
        )}
        <ShareProjectDialog projectId={project.id} role={role} shareToken={project.shareToken}>
          <button type="button" className={rowClassName}>
            {role === "owner" ? "Share Project" : "People with access"}
          </button>
        </ShareProjectDialog>
        <button type="button" disabled title="Export arrives with documents" className={rowClassName}>
          Export Reports · Coming soon
        </button>
        {role === "owner" && (
          <DeleteProjectDialog projectId={project.id} title={project.title}>
            <button type="button" className={cn(rowClassName, "text-nia-danger")}>
              Delete Project
            </button>
          </DeleteProjectDialog>
        )}
      </div>
    </section>
  );
}
