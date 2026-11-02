import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Skeleton } from "@/components/ui/skeleton";
import { FilmView } from "@/components/explore/film-view";
import { FILMS, getFilm } from "@/components/explore/explore-data";
import { getFilmDetails } from "@/components/explore/film-details";
import { filmCastAndCrew } from "@/features/explore/film-people";
import { TOP_CREDITS } from "@/features/explore/credit-format";
import { filmSlug } from "@/features/explore/items";

// The films are known ahead of time, so each page is drawn once at build.
export function generateStaticParams() {
  return FILMS.filter((f) => getFilmDetails(f.id)).map((f) => ({ id: f.id }));
}

export async function generateMetadata({ params }: PageProps<"/explore/film/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: getFilmDetails(id) ? `${getFilm(id).title} · Explore · Nia OS` : "Explore · Nia OS" };
}

// A film's press kit as its own page (Ika, 2026-10-28), opened from the pop-up's "Open press kit"
// or "Open film page".
export default function Page({ params }: PageProps<"/explore/film/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="mx-4 mt-10 h-96 rounded-2xl md:mx-15" />}>
      <Film params={params} />
    </Suspense>
  );
}

async function Film({ params }: Pick<PageProps<"/explore/film/[id]">, "params">) {
  const { id } = await params;
  if (!getFilmDetails(id)) notFound();
  // Only the top credits reach the page; the rest comes with "View all" on a paid plan.
  const all = filmCastAndCrew(filmSlug(id));
  const castCrew = all.slice(0, TOP_CREDITS).map(({ key, name, role, href, photo }) => ({ key, name, role, href, photo }));
  return <FilmView key={id} filmId={id} castCrew={castCrew} castTotal={all.length} />;
}
