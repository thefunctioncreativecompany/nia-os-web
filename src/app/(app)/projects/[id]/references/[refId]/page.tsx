import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getProject } from "@/lib/projects-data";
import { loadInstagramReference } from "@/lib/instagram-references";
import { getSession } from "@/lib/supabase/session";
import { Skeleton } from "@/components/ui/skeleton";
import { InstagramReferenceView } from "@/components/projects/instagram-reference-view";

export const metadata: Metadata = {
  title: "Reference · Nia OS",
  robots: { index: false, follow: false },
};

// An Instagram post in a project's references (Ika, 2026-10-22). Only people on the project can
// open it: the project's access rules decide, as for its files.
export default function Page({ params }: PageProps<"/projects/[id]/references/[refId]">) {
  return (
    <Suspense fallback={<ReferenceSkeleton />}>
      <ReferencePage params={params} />
    </Suspense>
  );
}

async function ReferencePage({ params }: Pick<PageProps<"/projects/[id]/references/[refId]">, "params">) {
  const { id, refId } = await params;
  const [{ project, role }, { supabase }] = await Promise.all([getProject(id), getSession()]);
  const reference = await loadInstagramReference(supabase, id, refId);
  if (!reference) notFound();
  return <InstagramReferenceView projectId={id} projectTitle={project.title} reference={reference} canEdit={role !== "viewer"} />;
}

function ReferenceSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-12 px-4 pt-10 md:px-15" aria-busy="true" aria-label="Loading reference">
      <Skeleton className="h-5 w-36" />
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] xl:gap-16">
        <div className="flex flex-col gap-6">
          <Skeleton className="aspect-[4/5] w-full max-w-md rounded-3xl" />
          <Skeleton className="h-9 w-2/3" />
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
