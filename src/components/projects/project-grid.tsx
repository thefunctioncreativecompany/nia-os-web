import { Plus } from "lucide-react";

import { projectMeta, type Project } from "@/lib/projects";
import { cn } from "@/lib/utils";
import { ProjectCard } from "@/components/nia/project-card";
import { NewProjectDialog } from "@/components/projects/new-project-dialog";

// "My Projects" grid (Figma 778:2458): a dashed New project tile, then project cards.
export function ProjectGrid({
  projects,
  now,
  compact = false,
  className,
}: {
  projects: Project[];
  now: number;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-6",
        compact
          ? "grid-cols-[repeat(auto-fill,minmax(200px,1fr))]"
          : "grid-cols-[repeat(auto-fill,minmax(260px,1fr))]",
        className,
      )}
    >
      <NewProjectDialog>
        <button
          type="button"
          className={cn(
            "flex aspect-[19/10] flex-col items-center justify-center gap-2 border-[1.5px] border-dashed border-border text-nia-placeholder outline-none transition-colors duration-fast hover:bg-muted hover:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
            compact ? "rounded-lg" : "rounded-xl",
          )}
        >
          <Plus aria-hidden className={compact ? "size-6" : "size-9"} strokeWidth={1} />
          <span className={cn("leading-normal font-semibold", compact ? "text-meta" : "text-sm")}>New project</span>
        </button>
      </NewProjectDialog>
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          href={`/projects/${project.id}`}
          title={project.title || "Untitled project"}
          meta={projectMeta(project, now)}
          cover={project.coverUrl}
          size={compact ? "compact" : "default"}
        />
      ))}
    </div>
  );
}
