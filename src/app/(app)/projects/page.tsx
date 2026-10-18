import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { listProjects } from "@/lib/projects-data";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { NewProjectDialog } from "@/components/projects/new-project-dialog";
import { ProjectGrid } from "@/components/projects/project-grid";

export const metadata: Metadata = {
  title: "Projects · Nia OS",
};

export default function Page({ searchParams }: PageProps<"/projects">) {
  return (
    <div className="flex flex-1 flex-col px-4 pt-12 pb-15 md:px-15">
      <Suspense fallback={<ProjectsSkeleton />}>
        <Projects searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Projects({ searchParams }: Pick<PageProps<"/projects">, "searchParams">) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q : "";
  const { projects, now } = await listProjects(query);

  if (!query && projects.length === 0) {
    // Figma "Screen 1 - Empty State".
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 py-15 text-center">
        <div className="flex max-w-[500px] flex-col gap-3">
          <h1 className="text-display font-bold text-foreground">No Projects</h1>
          <p className="text-base leading-normal text-muted-foreground">
            Start a film production from scratch. Your projects, covers and production details live here.
          </p>
        </div>
        <NewProjectDialog>
          <Button className="px-8 text-lead">
            <Plus aria-hidden />
            New Project
          </Button>
        </NewProjectDialog>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-h2 font-bold text-foreground">My Projects</h1>
        {query && (
          <p className="text-sm text-muted-foreground">
            {projects.length} {projects.length === 1 ? "project matches" : "projects match"} “{query}” ·{" "}
            <Link href="/projects" className="font-semibold text-foreground hover:underline">
              Clear search
            </Link>
          </p>
        )}
      </div>
      <ProjectGrid projects={projects} now={now} />
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
