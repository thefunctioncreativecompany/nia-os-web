import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FileText, Inbox } from "lucide-react";

import { getCurrentUser } from "@/lib/auth";
import { getTemplate } from "@/features/templates/catalog";
import { FlatIcon } from "@/features/templates/components/flat-icon";
import { listActivity, listProjects } from "@/lib/projects-data";
import { Card } from "@/components/arc/card/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/nia/empty-state";
import { NewProjectDialog } from "@/components/projects/new-project-dialog";
import { ActivityFeed } from "@/components/home/activity-feed";
import { ProjectGrid } from "@/components/projects/project-grid";

export const metadata: Metadata = {
  title: "Home · Nia OS",
};

// The template row (H2): the "Suggested for you" cards; Preview opens that template's preview
// on the Templates page.
const TEMPLATE_CODES = ["D01", "D13", "D07", "D24", "D08", "D14", "D05", "D03", "D09", "D10"];
const TEMPLATES = TEMPLATE_CODES.map(getTemplate).filter((t) => t !== null);

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

      <section aria-labelledby="templates" className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <FileText aria-hidden className="size-[18px] text-muted-foreground" />
          <h2 id="templates" className="text-base leading-normal font-bold text-foreground">
            Start from a Template
          </h2>
        </div>
        <div className="-mx-4 flex snap-x scroll-px-4 gap-3.5 overflow-x-auto px-4 pb-2 md:mx-0 md:scroll-px-0 md:px-0">
          {TEMPLATES.map((template) => (
            <Card
              key={template.code}
              title={template.name}
              className="w-60 shrink-0 snap-start"
              media={
                <div className="flex aspect-[16/10] w-full items-center justify-center bg-white">
                  <FlatIcon name={template.icon} size="md" className="size-11" />
                </div>
              }
              avatar={<Image src="/icon.png" alt="" width={24} height={24} className="size-6 rounded-full" />}
              meta={template.stage}
              action={
                <Button asChild variant="outline" size="compact">
                  <Link href={`/templates?preview=${template.code}`} aria-label={`Preview ${template.name}`}>
                    Preview
                  </Link>
                </Button>
              }
            />
          ))}
        </div>
      </section>

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
              <Button variant="outline" disabled title="Coming soon">
                Browse Templates
              </Button>
              <Button variant="outline" disabled title="Coming soon">
                Import Files
              </Button>
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
