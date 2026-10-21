import { Suspense } from "react";
import type { Metadata } from "next";
import { Plus } from "lucide-react";

import { listLinkSharedProjects, listProjects } from "@/lib/projects-data";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { NewProjectDialog } from "@/components/projects/new-project-dialog";
import { ProjectsBrowser } from "@/components/projects/projects-browser";
import { ProjectsTabs } from "@/components/projects/projects-tabs";

export const metadata: Metadata = {
  title: "Projects · Nia OS",
};

export default function Page({ searchParams }: PageProps<"/projects">) {
  return (
    <div className="flex flex-1 flex-col gap-8 px-4 pt-8 pb-15 md:px-15">
      <ProjectsTabs />
      <Suspense fallback={<ProjectsSkeleton />}>
        <Projects searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Projects({ searchParams }: Pick<PageProps<"/projects">, "searchParams">) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q : "";
  const [{ projects: all, now, userId }, linked] = await Promise.all([listProjects(), listLinkSharedProjects()]);
  // My Projects are the ones this person owns; the rest were shared with them.
  const projects = all.filter((p) => p.ownerId === userId);
  const shared = all.filter((p) => p.ownerId !== userId);

  if (all.length === 0 && linked.length === 0) {
    // Figma "Screen 1 - Empty State".
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 py-15 text-center">
        <div className="flex max-w-[500px] flex-col gap-3">
          <h1 className="text-display font-bold text-foreground">No projects</h1>
          <p className="text-base leading-normal text-muted-foreground">
            Start a film production from scratch. Your projects, covers and production details live here.
          </p>
        </div>
        <NewProjectDialog>
          <Button className="px-8 text-lead">
            <Plus aria-hidden />
            New project
          </Button>
        </NewProjectDialog>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-h2 font-bold text-foreground">My projects</h1>
      <ProjectsBrowser projects={projects} shared={shared} linked={linked} now={now} initialQuery={query} />
    </div>
  );
}

function ProjectsSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading projects">
      <Skeleton className="h-9 w-48" />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-6">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="aspect-[19/10] rounded-xl" />
        ))}
      </div>
    </div>
  );
}
