import { Suspense } from "react";
import type { Metadata } from "next";

import { countProjectPeople, countProjectTabExtras, getProject, listActivity, listProjectDocuments, listProjectFiles } from "@/lib/projects-data";
import { timeAgo } from "@/lib/projects";
import { Skeleton } from "@/components/ui/skeleton";
import { ActivityList } from "@/components/projects/activity-list";
import { Button } from "@/components/ui/button";
import { DeleteProjectDialog } from "@/components/projects/delete-project-dialog";
import { ProjectEditor } from "@/components/projects/project-editor";
import { ProjectLive } from "@/components/projects/project-live";
import { ProjectDocuments } from "@/components/projects/project-documents";
import { ProjectFiles, ProjectFinalAssets } from "@/components/projects/project-files";
import { ProjectInspiration } from "@/components/projects/project-inspiration-lazy";
import { Comments } from "@/components/nia/comments";
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
  const [{ project, role, now, userId }, activity, people, documents, files, extras] = await Promise.all([
    getProject(id),
    listActivity({ projectId: id, limit: 8 }),
    countProjectPeople(id),
    listProjectDocuments(id),
    listProjectFiles(id),
    countProjectTabExtras(id),
  ]);
  const canEdit = role !== "viewer";
  // Stills tagged Reference (newest first, as listed): Overview shows three, the tab counts them all.
  const stills = files.flatMap((f) => (f.kind === "image" && f.tag === "reference" && (f.thumbUrl ?? f.url) ? [{ id: f.id, name: f.name, url: (f.thumbUrl ?? f.url)! }] : []));

  return (
    <>
      <ProjectLive projectId={id} />
      <ProjectEditor
        project={project}
        role={role}
        canEdit={canEdit}
        counts={{ crew: project.crew.length, documents: documents.length, references: stills.length + extras.references, comments: extras.comments }}
        referencePreview={stills}
        documents={<ProjectDocuments projectId={id} documents={documents} icons={ICONS} canEdit={canEdit} isOwner={role === "owner"} userId={userId} now={now} />}
        finals={<ProjectFinalAssets files={files} canEdit={canEdit} now={now} />}
        files={<ProjectFiles projectId={id} files={files} canEdit={canEdit} now={now} />}
        inspiration={<ProjectInspiration projectId={id} signals={inspirationSignals(project)} canEdit={canEdit} />}
        comments={<Comments subject={{ projectId: id }} />}
        activity={
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <section aria-labelledby="recent-activity" className="flex flex-col gap-5">
              <h2 id="recent-activity" className="text-subtitle font-semibold text-foreground">
                Recent activity
              </h2>
              <ActivityList items={activity.items} now={activity.now} />
            </section>

            <section aria-labelledby="project-overview" className="flex flex-col gap-4 rounded-3xl border border-border p-5">
              <h2 id="project-overview" className="text-subtitle font-semibold text-foreground">
                Project overview
              </h2>
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
              {role === "owner" && (
                <DeleteProjectDialog projectId={project.id} title={project.title}>
                  <Button type="button" variant="outline" className="w-fit text-nia-danger hover:text-nia-danger">
                    Delete project
                  </Button>
                </DeleteProjectDialog>
              )}
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
    // Shaped like the page: the cover across it, the tabs, then Overview's two columns.
    <div className="flex flex-1 flex-col gap-8 px-4 md:px-page" aria-busy="true" aria-label="Loading project">
      <Skeleton className="-mx-4 min-h-104 rounded-none sm:aspect-[16/9] sm:min-h-0 md:-mx-page lg:aspect-auto lg:h-130" />
      <Skeleton className="h-8 w-full max-w-xl" />
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] xl:gap-14">
        <div className="flex min-w-0 flex-col gap-4">
          <Skeleton className="h-24 w-full max-w-3xl" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-16 w-full max-w-3xl" />
        </div>
        <Skeleton className="h-80 rounded-3xl" />
      </div>
    </div>
  );
}
