import { Suspense, cache } from "react";
import type { Metadata } from "next";
import { Inbox } from "lucide-react";

import { getCurrentUser } from "@/lib/auth";
import { getSession } from "@/lib/supabase/session";
import { listActivity, listProjects } from "@/lib/projects-data";
import { Button } from "@/components/ui/button";
import { ViewAll } from "@/components/nia/view-all";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/nia/empty-state";
import { NewProjectDialog } from "@/components/projects/new-project-dialog";
import { ActivityFeed } from "@/components/home/activity-feed";
import { WelcomeTourLoader } from "@/components/home/welcome-tour-loader";
import { GROUP_LABEL, groupFor, whatsNew } from "@/features/whats-new/updates";
import { hasExploreAccess } from "@/lib/explore-access";
import { ProjectGrid } from "@/components/projects/project-grid";

export const metadata: Metadata = {
  title: "Home · Nia OS",
};

// Home (Figma 872:42636 empty, 872:42800 active), without the old stat cards.
export default function Page() {
  return (
    <div className="flex flex-col gap-12 px-4 pt-12 pb-15 md:px-page">
      <Suspense fallback={null}>
        <Tour />
      </Suspense>
      <header className="flex flex-col items-center gap-2 text-center">
        <Suspense fallback={<Skeleton className="h-10 w-72" />}>
          <Welcome />
        </Suspense>
      </header>

      {/* The announcement and everything under it arrive together, so nothing below jumps down
          when the announcement appears (it moved Recent projects by its full height). */}
      <Suspense fallback={<BodySkeleton />}>
        <HomeBody />
      </Suspense>
    </div>
  );
}

// The welcome tour opens by itself once, for a new account just out of onboarding.
// Taken before: "Take the tour" shows what's new since then, most relevant to their work first.
async function Tour() {
  const [{ user }, current, explore] = await Promise.all([getSession(), getCurrentUser(), hasExploreAccess()]);
  const seenAt = user?.metadata.tour_seen_at;
  const group = groupFor(current.profession);
  const news = seenAt ? { since: seenAt, forWhom: GROUP_LABEL[group], updates: whatsNew(seenAt, group, { explore }) } : null;
  return <WelcomeTourLoader firstName={current.firstName} firstVisit={user?.metadata.tour_pending === true} news={news} />;
}

// Recent projects and Activity (the new-templates card is off Home since 2026-11-11, Ika; git tag
// parked-2026-11-11-new-templates-notice; new templates keep their "New" tag on Templates) (Workflows live on the Templates page; off Home for now, Ika 2026-11-10): Home was cut to these on 2026-11-10 (Ika: "too much on the home page");
// Start from a template, Upcoming schedule and Quick actions are in git tag parked-2026-11-10-home.
async function HomeBody() {
  return (
    <>
      <section aria-labelledby="recent-projects" className="flex flex-col gap-5">
        {/* View all beside the heading, as on Activity, Explore and the project page (Ika, 2026-11-12). */}
        <div className="flex items-center gap-2">
          <h2 id="recent-projects" className="text-subtitle font-semibold text-foreground">
            Recent projects
          </h2>
          <ViewAll href="/projects" className="ml-auto" />
        </div>
        <Suspense fallback={<Skeleton className="h-48 rounded-xl" />}>
          <RecentProjects />
        </Suspense>
      </section>

      <Suspense fallback={<Skeleton className="h-60 rounded-xl" />}>
        <RecentActivity />
      </Suspense>
    </>
  );
}

function BodySkeleton() {
  return (
    <>
      <Skeleton className="h-24 rounded-xl" />
      <Skeleton className="h-60 rounded-xl" />
    </>
  );
}

// The four most recent projects, read once per visit by the greeting and Recent projects.
const recentProjects = cache(() => listProjects(undefined, 4));

// "Welcome back" once someone has a project; before that they're new (beta walkthrough,
// 2026-10-31: a brand-new account was greeted "Welcome back").
async function Welcome() {
  const [user, { projects }] = await Promise.all([getCurrentUser(), recentProjects()]);
  const first = user.firstName;
  return (
    <h1 className="text-h2 font-semibold tracking-tight text-foreground">
      {projects.length ? "Welcome back" : "Welcome"}
      {first ? `, ${first}` : ""}
    </h1>
  );
}

async function RecentProjects() {
  const { projects, now } = await recentProjects();
  if (projects.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        message="No projects yet. Create your first project to start organizing your shoot files."
        className="border-[1.5px] border-dashed"
        action={
          <NewProjectDialog>
            <Button className="mt-2">Create your first project</Button>
          </NewProjectDialog>
        }
      />
    );
  }
  return <ProjectGrid projects={projects} now={now} compact />;
}

async function RecentActivity() {
  const { items, now } = await listActivity({ limit: 5 });
  return <ActivityFeed items={items} now={now} />;
}
