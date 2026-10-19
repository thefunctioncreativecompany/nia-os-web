import { Suspense } from "react";
import type { Metadata } from "next";

import { countProjectPeople, getProject, listActivity } from "@/lib/projects-data";
import { timeAgo } from "@/lib/projects";
import { Skeleton } from "@/components/ui/skeleton";
import { ActivityList } from "@/components/projects/activity-list";
import { ProjectActions } from "@/components/projects/project-actions";
import { ProjectEditor } from "@/components/projects/project-editor";
import { ProjectLive } from "@/components/projects/project-live";

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
  const [{ project, role, now }, activity, people] = await Promise.all([
    getProject(id),
    listActivity({ projectId: id, limit: 8 }),
    countProjectPeople(id),
  ]);

  return (
    <div className="flex flex-1 flex-wrap">
      <ProjectLive projectId={id} />
      <div className="min-w-0 flex-[999_1_560px] px-4 pt-10 pb-15 md:pr-10 md:pl-15">
        <ProjectEditor project={project} canEdit={role !== "viewer"} />
      </div>
      <aside className="flex flex-[1_1_360px] flex-col gap-6 border-border bg-nia-panel px-4 pt-10 pb-15 md:border-l md:pr-15 md:pl-10 lg:max-w-[540px]">
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

        <section className="flex flex-col gap-5 rounded-2xl border border-border bg-nia-surface p-6">
          <h2 className="text-lg leading-[1.4] font-bold text-foreground">Recent Activity</h2>
          <ActivityList items={activity.items} now={activity.now} />
        </section>
      </aside>
    </div>
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
    <div className="flex flex-1 flex-wrap" aria-busy="true" aria-label="Loading project">
      <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-6 px-4 pt-10 md:pr-10 md:pl-15">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="aspect-[16/7] w-full rounded-[20px]" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-16 w-full" />
      </div>
      <div className="flex flex-[1_1_360px] flex-col gap-6 bg-nia-panel px-4 pt-10 md:pr-15 md:pl-10 lg:max-w-[540px]">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    </div>
  );
}
