import { Suspense } from "react";
import type { Metadata } from "next";

import { countProjectPeople, getProject, listActivity, listProjectDocuments, listProjectFiles } from "@/lib/projects-data";
import { timeAgo } from "@/lib/projects";
import { Skeleton } from "@/components/ui/skeleton";
import { ActivityList } from "@/components/projects/activity-list";
import { ProjectActions } from "@/components/projects/project-actions";
import { ProjectEditor } from "@/components/projects/project-editor";
import { ProjectLive } from "@/components/projects/project-live";
import { DocumentPills, ProjectDocuments } from "@/components/projects/project-documents";
import { ProjectFiles } from "@/components/projects/project-files";
import { catalog } from "@/features/templates/catalog";

// Each template's icon, for the documents list.
const ICONS = Object.fromEntries(catalog.map((t) => [t.code, t.icon]));

export const metadata: Metadata = {
  title: "Project · Nia OS",
};

// A project (Figma "Screen 3 - Project Selected" + "Screen 7 - Project Management View").
export default function Page({ params }: PageProps<"/projects/[id]">) {
  return (
    <Suspense fallback={<ProjectSkeleton />}>
      <ProjectPage params={params} />
    </Suspense>
  );
}

async function ProjectPage({ params }: Pick<PageProps<"/projects/[id]">, "params">) {
  const { id } = await params;
  const [{ project, role, now, userId }, activity, people, documents, files] = await Promise.all([
    getProject(id),
    listActivity({ projectId: id, limit: 8 }),
    countProjectPeople(id),
    listProjectDocuments(id),
    listProjectFiles(id),
  ]);
  const canEdit = role !== "viewer";

  return (
    <>
      <ProjectLive projectId={id} />
      <ProjectEditor
        project={project}
        canEdit={canEdit}
        behind={<DocumentPills projectId={id} documents={documents} icons={ICONS} canEdit={canEdit} />}
        files={<ProjectFiles projectId={id} files={files} canEdit={canEdit} now={now} />}
        manage={
          <div className="flex flex-col gap-6">
            <ProjectActions project={project} role={role} />

            <section className="flex flex-col gap-4 rounded-2xl border border-border bg-nia-surface p-6">
              <h2 className="text-base leading-normal font-bold text-foreground">Project Overview</h2>
              <dl className="flex flex-col gap-3 text-small leading-normal">
                <OverviewRow label="Stage" value={project.stage} />
                <OverviewRow label="Production type" value={project.productionType ?? "—"} />
                <OverviewRow label="Team Members" value={`${people} ${people === 1 ? "member" : "members"}`} />
                <OverviewRow
                  label="Created"
                  value={new Date(project.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                />
                <OverviewRow label="Last Edited" value={timeAgo(project.updatedAt, now)} />
                {role !== "owner" && <OverviewRow label="Your access" value={role === "editor" ? "Can edit" : "Can view"} />}
              </dl>
            </section>

            <ProjectDocuments projectId={id} documents={documents} icons={ICONS} canEdit={canEdit} isOwner={role === "owner"} userId={userId} now={now} />

            <section className="flex flex-col gap-5 rounded-2xl border border-border bg-nia-surface p-6">
              <h2 className="text-lg leading-[1.4] font-bold text-foreground">Recent Activity</h2>
              <ActivityList items={activity.items} now={activity.now} />
            </section>
          </div>
        }
      />
    </>
  );
}

function OverviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-bold text-foreground">{value}</dd>
    </div>
  );
}

function ProjectSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-12 px-4 pt-10 md:px-15" aria-busy="true" aria-label="Loading project">
      <Skeleton className="h-5 w-36" />
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] xl:gap-16">
        <div className="flex flex-col gap-6">
          <Skeleton className="aspect-[19/10] w-full rounded-3xl" />
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="h-16 w-full" />
        </div>
        <div className="flex flex-col gap-6">
          <Skeleton className="h-10 w-64 rounded-lg" />
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
