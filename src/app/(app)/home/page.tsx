import { Suspense, cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Inbox } from "lucide-react";

import { getCurrentUser } from "@/lib/auth";
import { getSession } from "@/lib/supabase/session";
import { workingGallery } from "@/features/templates/working";
import { listActivity, listProjects } from "@/lib/projects-data";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/nia/empty-state";
import { NewProjectDialog } from "@/components/projects/new-project-dialog";
import { ActivityFeed } from "@/components/home/activity-feed";
import { NewTemplatesNotice } from "@/components/home/new-templates-notice";
import { WelcomeTourLoader } from "@/components/home/welcome-tour-loader";
import { GROUP_LABEL, groupFor, whatsNew } from "@/features/whats-new/updates";
import { hasExploreAccess } from "@/lib/explore-access";
import { ProjectGrid } from "@/components/projects/project-grid";
import { WorkflowCards } from "@/features/workflows/workflow-cards";

export const metadata: Metadata = {
  title: "Home · Nia OS",
};

// Home (Figma 872:42636 empty, 872:42800 active), without the old stat cards.
export default function Page() {
  return (
    <div className="flex flex-col gap-12 px-4 pt-12 pb-15 md:px-15">
      <Suspense fallback={null}>
        <Tour />
      </Suspense>
      <header className="flex flex-col items-center gap-2 text-center">
        <Suspense fallback={<Skeleton className="h-10 w-72" />}>
          <Welcome />
        </Suspense>
        <p className="text-lead text-muted-foreground">What would you like to create today?</p>
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

// New templates, announced once (launches.ts): until the person uses one or closes the card, or
// it stops being new. Not while the welcome tour is about to open. Then Start from a goal, Recent
// projects and Activity: Home was cut to these on 2026-11-10 (Ika: "too much on the home page");
// Start from a template, Upcoming schedule and Quick actions are in git tag parked-2026-11-10-home.
async function HomeBody() {
  const [{ user }, templates, current] = await Promise.all([getSession(), workingGallery(), getCurrentUser()]);
  const announced = user?.metadata.templates_announced ?? [];
  const fresh = user && !user.metadata.tour_pending ? templates.filter((t) => t.fresh && !announced.includes(t.code)) : [];
  return (
    <>
      {fresh.length > 0 && <NewTemplatesNotice templates={fresh} announced={announced} />}
      {/* Start from a goal (Ika, 2026-11-10): workflows for the person's kind of work first. */}
      <WorkflowCards templates={templates.map(({ code, name }) => ({ code, name }))} profession={current.profession} />

      <section aria-labelledby="recent-projects" className="flex flex-col gap-5">
        <h2 id="recent-projects" className="text-subtitle font-semibold text-foreground">
          Recent projects
        </h2>
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
  return <ActivityFeed items={items} now={now} />;
}
