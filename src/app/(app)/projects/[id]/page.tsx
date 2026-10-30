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
import { ProjectFiles, ProjectFinalAssets } from "@/components/projects/project-files";
import { ProjectInspiration } from "@/components/projects/project-inspiration-lazy";
import { ProjectLikeThis, type Compared } from "@/components/projects/project-like-this";
import { hasExploreAccess } from "@/lib/explore-access";
import { parseDay } from "@/lib/dates";
import { comparablesFor, projectGap } from "@/features/explore/gap";
import { exploreItem } from "@/features/explore/items";
import { everyTemplate } from "@/features/templates/catalog";
import type { ProjectSignals } from "@/features/explore/match";
import type { Project } from "@/lib/projects";

// Each template's icon, for the documents list.
const ICONS = Object.fromEntries(everyTemplate.map((t) => [t.code, t.icon]));

// What Explore's suggestions match on (match.ts): the project's type, genres, deliverables'
// frames and its own words.
const inspirationSignals = (p: Project): ProjectSignals => ({
  title: p.title,
  description: p.description,
  logline: p.logline,
  usage: p.usage,
  notes: p.notes,
  publication: p.publication,
  genres: p.genres,
  productionType: p.productionType,
  frames: p.deliverables.map((d) => d.frame),
});

// Where the project is, for the line under "Projects like this had".
function phaseLine(p: Project, now: number): string | null {
  const start = p.shootStart ? parseDay(p.shootStart) : undefined;
  const days = start ? Math.ceil((start.getTime() - now) / 864e5) : null;
  if (p.stage === "Post-Production" || p.stage === "Wrapped") return "After the shoot, what's left is handing over.";
  if (p.stage === "In Production") return "In production, so the day's paperwork comes first.";
  if (days !== null && days > 1) return `Shooting in ${days} days, so prep comes first.`;
  if (days !== null && days >= 0) return "Shooting very soon, so the day's paperwork comes first.";
  return null;
}

// The Explore work it was compared with, as small pictures at their own shape.
function comparedCards(slugs: string[]): Compared[] {
  return slugs.flatMap((slug) => {
    const item = exploreItem(slug);
    return item ? [{ slug, title: item.title, image: item.image, aspect: item.aspect ?? 2 / 3, href: item.href() }] : [];
  });
}

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
  const [{ project, role, now, userId }, activity, people, documents, files, explore] = await Promise.all([
    getProject(id),
    listActivity({ projectId: id, limit: 8 }),
    countProjectPeople(id),
    listProjectDocuments(id),
    listProjectFiles(id),
    hasExploreAccess(),
  ]);
  const canEdit = role !== "viewer";
  // What finished work like it had that this project doesn't yet (editors only: it's a to-do list).
  const gap = canEdit ? projectGap(project, documents, comparablesFor(project)) : null;

  return (
    <>
      <ProjectLive projectId={id} />
      <ProjectEditor
        project={project}
        canEdit={canEdit}
        likeThis={
          gap && (
            <ProjectLikeThis
              projectId={id}
              items={gap.items}
              compared={explore ? comparedCards(gap.comparedWith) : null}
              comparedCount={gap.comparedWith.length}
              phase={phaseLine(project, now)}
            />
          )
        }
        behind={<DocumentPills projectId={id} documents={documents} icons={ICONS} canEdit={canEdit} />}
        finals={<ProjectFinalAssets files={files} canEdit={canEdit} now={now} />}
        files={<ProjectFiles projectId={id} files={files} canEdit={canEdit} now={now} />}
        inspiration={<ProjectInspiration projectId={id} signals={inspirationSignals(project)} canEdit={canEdit} />}
        manage={
          <div className="flex flex-col gap-6">
            <ProjectActions project={project} role={role} />

            <section className="flex flex-col gap-4 rounded-2xl border border-border bg-nia-surface p-6">
              <h2 className="text-base leading-normal font-bold text-foreground">Project overview</h2>
              <dl className="flex flex-col gap-3 text-small leading-normal">
                <OverviewRow label="Stage" value={project.stage} />
                <OverviewRow label="Production type" value={project.productionType ?? "—"} />
                <OverviewRow label="Team members" value={`${people} ${people === 1 ? "member" : "members"}`} />
                <OverviewRow
                  label="Created"
                  value={new Date(project.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                />
                <OverviewRow label="Last edited" value={timeAgo(project.updatedAt, now)} />
                {role !== "owner" && <OverviewRow label="Your access" value={role === "editor" ? "Can edit" : "Can view"} />}
              </dl>
            </section>

            <ProjectDocuments projectId={id} documents={documents} icons={ICONS} canEdit={canEdit} isOwner={role === "owner"} userId={userId} now={now} />

            <section className="flex flex-col gap-5 rounded-2xl border border-border bg-nia-surface p-6">
              <h2 className="text-lg leading-[1.4] font-bold text-foreground">Recent activity</h2>
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
