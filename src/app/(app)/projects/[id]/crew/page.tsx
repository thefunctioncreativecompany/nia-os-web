import { Suspense } from "react";
import type { Metadata } from "next";

import { getProject } from "@/lib/projects-data";
import { createClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";
import { CastCrewDirectory } from "@/components/projects/cast-crew-directory";
import { fromCrewList } from "@/features/crew/directory";

export const metadata: Metadata = {
  title: "Cast & crew · Nia OS",
};

// A project's cast and crew (Milestone 4, step 1; Figma frame 18). Reads the project's Crew &
// talent list, with the Nia profile photo of anyone who has an account; contacts, statuses and
// availability come with the people tables (20261109000000_people.sql).
export default function Page({ params }: PageProps<"/projects/[id]/crew">) {
  return (
    <Suspense fallback={<Skeleton className="mx-4 mt-10 h-96 rounded-2xl md:mx-15" />}>
      <Directory params={params} />
    </Suspense>
  );
}

async function Directory({ params }: Pick<PageProps<"/projects/[id]/crew">, "params">) {
  const { id } = await params;
  const { project } = await getProject(id);
  const ids = project.crew.flatMap((m) => (m.userId ? [m.userId] : []));
  const photos = new Map<string, string | null>();
  if (ids.length) {
    const supabase = await createClient();
    const { data } = await supabase.from("profiles").select("id, avatar_url").in("id", ids);
    for (const p of data ?? []) photos.set(p.id, p.avatar_url);
  }
  return <CastCrewDirectory projectTitle={project.title || "Untitled project"} projectHref={`/projects/${id}`} entries={fromCrewList(project.crew, photos)} editable={false} />;
}
