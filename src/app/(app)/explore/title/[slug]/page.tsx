import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Skeleton } from "@/components/ui/skeleton";
import { TitleView } from "@/components/explore/title-view";
import { allSlugs, findEntry } from "@/features/explore/made-in-africa";

// The titles are known ahead of time, so each page is drawn once at build.
export function generateStaticParams() {
  return allSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/explore/title/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const entry = findEntry(slug);
  return { title: entry ? `${entry.title.title} · Explore · Nia OS` : "Explore · Nia OS" };
}

// A title's full page, from Made in Africa (`?season=` picks a season, `?from=all` sends the back
// link to View all).
export default function Page({ params }: PageProps<"/explore/title/[slug]">) {
  return (
    <Suspense fallback={<TitleSkeleton />}>
      <Title params={params} />
    </Suspense>
  );
}

async function Title({ params }: Pick<PageProps<"/explore/title/[slug]">, "params">) {
  const { slug } = await params;
  const entry = findEntry(slug);
  if (!entry) notFound();
  return <TitleView entry={entry} />;
}

// Shaped like the page, as on a project.
function TitleSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-12 px-4 pt-10 md:px-15" aria-busy="true" aria-label="Loading title">
      <Skeleton className="h-5 w-36" />
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] xl:gap-16">
        <div className="flex flex-col gap-6">
          <Skeleton className="aspect-[19/10] w-full rounded-3xl" />
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="h-16 w-full" />
        </div>
        <div className="flex flex-col gap-6">
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
