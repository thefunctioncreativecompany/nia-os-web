import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  Camera,
  Clapperboard,
  ClipboardList,
  Columns3,
  FileSearch,
  FileText,
  Inbox,
  LayoutGrid,
  Megaphone,
  RotateCcw,
  Users,
} from "lucide-react";

import { getCurrentUser } from "@/lib/auth";
import { listActivity, listProjects } from "@/lib/projects-data";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/nia/empty-state";
import { TemplateCard } from "@/components/nia/template-card";
import { ActivityList } from "@/components/projects/activity-list";
import { NewProjectDialog } from "@/components/projects/new-project-dialog";
import { ProjectGrid } from "@/components/projects/project-grid";

export const metadata: Metadata = {
  title: "Home · Nia OS",
};

// Shown as "coming soon" until the template library (BUILD_PLAN Milestone 3).
const TEMPLATES = [
  { name: "Call Sheet", icon: FileText },
  { name: "Continuity Log", icon: RotateCcw },
  { name: "Filming Notice", icon: Megaphone },
  { name: "Call Sheet - Detailed", icon: ClipboardList },
  { name: "Equipment Log", icon: Camera },
  { name: "Shot Logging", icon: Clapperboard },
  { name: "Script Breakdown", icon: FileSearch },
  { name: "Crew Contact List", icon: Users },
  { name: "Storyboard", icon: LayoutGrid },
  { name: "3-Column AV Script", icon: Columns3 },
];

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
          <span className="rounded-full bg-muted px-2 py-0.5 text-micro font-bold text-muted-foreground">
            Coming soon
          </span>
        </div>
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
          {TEMPLATES.map((template) => (
            <TemplateCard
              key={template.name}
              size="compact"
              name={template.name}
              icon={template.icon}
              className="h-[78px] w-[126px] shrink-0"
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
        <section aria-labelledby="recent-activity" className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 id="recent-activity" className="text-xl leading-[1.4] font-bold text-foreground">
              Recent Activity
            </h2>
          </div>
          <Suspense fallback={<Skeleton className="h-60 rounded-xl" />}>
            <RecentActivity />
          </Suspense>
        </section>

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
  const { items, now } = await listActivity({ limit: 5 });
  return <ActivityList items={items} now={now} bordered linkProjects />;
}
