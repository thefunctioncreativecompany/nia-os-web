import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Inbox } from "lucide-react";

import { getCurrentUser } from "@/lib/auth";
import { catalog, getSchema } from "@/features/templates/catalog";
import { canEdit } from "@/features/templates/engine/sections";
import { toGallery } from "@/features/templates/gallery";
import { listActivity, listProjects } from "@/lib/projects-data";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/nia/empty-state";
import { NewProjectDialog } from "@/components/projects/new-project-dialog";
import { ActivityFeed } from "@/components/home/activity-feed";
import { HomeTemplates } from "@/components/home/home-templates";
import { ImportFilesDialog } from "@/components/home/import-files-dialog";
import { ProjectGrid } from "@/components/projects/project-grid";

export const metadata: Metadata = {
  title: "Home · Nia OS",
};

// "Start from a template" (H4): the live catalogue with `ready` for the ones that open in the
// editor; the row offers only those, ordered in the browser by what the person viewed last.
const TEMPLATES = catalog.filter((t) => t.status === "live").map((t) => ({ ...toGallery(t), ready: canEdit(getSchema(t.code)) }));

// Home (Figma 872:42636 empty, 872:42800 active), without the old stat cards.
export default function Page() {
  return (
    <div className="flex flex-col gap-12 px-4 pt-12 pb-15 md:px-15">
      <header className="flex flex-col items-center gap-2 text-center">
        <Suspense fallback={<Skeleton className="h-10 w-72" />}>
          <Welcome />
        </Suspense>
        <p className="text-lead text-muted-foreground">What would you like to create today?</p>
      </header>

      <HomeTemplates templates={TEMPLATES} />

      <section aria-labelledby="recent-projects" className="flex flex-col gap-5">
        <h2 id="recent-projects" className="text-xl leading-[1.4] font-bold text-foreground">
          Recent Projects
        </h2>
        <Suspense fallback={<Skeleton className="h-48 rounded-xl" />}>
          <RecentProjects />
        </Suspense>
      </section>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.62fr)]">
        <Suspense fallback={<Skeleton className="h-60 rounded-xl" />}>
          <RecentActivity />
        </Suspense>

        <div className="flex flex-col gap-10">
          <section aria-labelledby="schedule" className="flex flex-col gap-5">
            <h2 id="schedule" className="text-xl leading-[1.4] font-bold text-foreground">
              Upcoming Schedule
            </h2>
            <EmptyState
              message="No upcoming events. Add events from your project calendar."
              className="min-h-[180px]"
            />
          </section>

          <section aria-labelledby="quick-actions" className="flex flex-col gap-5">
            <h2 id="quick-actions" className="text-xl leading-[1.4] font-bold text-foreground">
              Quick Actions
            </h2>
            <div className="flex flex-wrap gap-3">
              <NewProjectDialog>
                <Button>+ New Project</Button>
              </NewProjectDialog>
              <Button asChild variant="outline">
                <Link href="/templates">Browse templates</Link>
              </Button>
              <ImportFilesDialog>
                <Button variant="outline">Import files</Button>
              </ImportFilesDialog>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

async function Welcome() {
  const user = await getCurrentUser();
  const first = user.name.split(" ")[0];
  return (
    <h1 className="text-h2 font-bold text-foreground">Welcome back{first ? `, ${first}` : ""}</h1>
  );
}

async function RecentProjects() {
  const { projects, now } = await listProjects(undefined, 4);
  if (projects.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        message="No projects yet. Create your first project to start organizing your shoot files."
        className="border-[1.5px] border-dashed"
        action={
          <NewProjectDialog>
            <Button className="mt-2">Create Your First Project</Button>
          </NewProjectDialog>
        }
      />
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <ProjectGrid projects={projects} now={now} compact />
      <Link href="/projects" className="w-fit text-sm font-semibold text-muted-foreground hover:text-foreground">
        View all projects →
      </Link>
    </div>
  );
}

async function RecentActivity() {
  const { items, now } = await listActivity({ limit: 12 });
  return <ActivityFeed items={items} now={now} />;
}
