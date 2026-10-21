import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Skeleton } from "@/components/ui/skeleton";
import { CreatorView } from "@/components/explore/creator-view";
import { creatorFilms, findCreatorFilm } from "@/features/explore/creators";

// The films are known ahead of time, so each page is drawn once at build.
export function generateStaticParams() {
  return creatorFilms.map((f) => ({ code: f.code }));
}

export async function generateMetadata({ params }: PageProps<"/explore/creator/[code]">): Promise<Metadata> {
  const { code } = await params;
  const film = findCreatorFilm(code);
  return { title: film ? `${film.title} · Explore · Nia OS` : "Explore · Nia OS" };
}

// A creator's film, from Explore's Creators row (Ika, 2026-10-21). `?from=library` sends the back
// link to Explore all.
export default function Page({ params }: PageProps<"/explore/creator/[code]">) {
  return (
    <Suspense fallback={<CreatorSkeleton />}>
      <Creator params={params} />
    </Suspense>
  );
}

async function Creator({ params }: Pick<PageProps<"/explore/creator/[code]">, "params">) {
  const { code } = await params;
  const film = findCreatorFilm(code);
  if (!film) notFound();
  // A fresh page for each film, also when moving between them.
  return <CreatorView key={film.code} film={film} />;
}

function CreatorSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-12 px-4 pt-10 md:px-15" aria-busy="true" aria-label="Loading film">
      <Skeleton className="h-5 w-36" />
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] xl:gap-16">
        <Skeleton className="h-[min(80svh,46rem)] rounded-3xl" />
        <div className="flex flex-col gap-6">
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
