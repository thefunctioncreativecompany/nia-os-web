import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";

import { getProject } from "@/lib/projects-data";
import { createClient } from "@/lib/supabase/server";
import { listCastCrew } from "@/features/crew/data";
import { Skeleton } from "@/components/ui/skeleton";
import { CastCrewDirectory } from "@/components/projects/cast-crew-directory";

export const metadata: Metadata = {
  title: "Cast & crew · Nia OS",
};

// A project's cast and crew (Milestone 4, step 1; Figma frame 18), from the people and cast_crew
// tables (20261109000000_people.sql); people with edit access add and change them.
export default function Page({ params }: PageProps<"/projects/[id]/crew">) {
  return (
    <Suspense fallback={<Skeleton className="mx-4 mt-10 h-96 rounded-2xl md:mx-page" />}>
      <Directory params={params} />
    </Suspense>
  );
}

async function Directory({ params }: Pick<PageProps<"/projects/[id]/crew">, "params">) {
  const { id } = await params;
  await connection();
  const [{ project, role }, supabase] = await Promise.all([getProject(id), createClient()]);
  const entries = await listCastCrew(supabase, id);
  return <CastCrewDirectory projectId={id} projectTitle={project.title || "Untitled project"} projectHref={`/projects/${id}`} entries={entries} editable={role !== "viewer"} />;
}
