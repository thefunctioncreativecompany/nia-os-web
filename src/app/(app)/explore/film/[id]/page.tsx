import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FilmView } from "@/components/explore/film-view";
import { FILMS, getFilm } from "@/components/explore/explore-data";
import { getFilmDetails } from "@/components/explore/film-details";

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
export default async function Page({ params }: PageProps<"/explore/film/[id]">) {
  const { id } = await params;
  if (!getFilmDetails(id)) notFound();
  return <FilmView key={id} filmId={id} />;
}
