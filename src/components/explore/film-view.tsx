"use client";

import { useEffect } from "react";
import Link from "next/link";

import { exploreHome } from "@/features/explore/made-in-africa";
import { filmSlug } from "@/features/explore/items";
import { recordView } from "@/features/explore/views";
import { getFilm } from "./explore-data";
import { getFilmDetails, lengthOf } from "./film-details";
import { PressKitBody } from "./press-kit-body";
import { AddToProject, SaveToCollection } from "./save-controls";

// A film's own page (Ika, 2026-10-28): its press kit in full (official video, facts, links, the
// press tour, what critics said and context), with Save and Add to project so it can go into a
// collection or a project's references like any Explore title.
export function FilmView({ filmId }: { filmId: string }) {
  const film = getFilm(filmId);
  const details = getFilmDetails(filmId);
  const slug = filmSlug(filmId);
  // Remembered for Explore's Recently viewed and For you.
  useEffect(() => void recordView(slug), [slug]);
  const meta = details ? [details.kind, details.year, lengthOf(details), details.country].filter(Boolean).join(" · ") : null;

  return (
    <div className="mx-auto w-full max-w-225 px-4 pt-10 pb-24 sm:px-9.5">
      <Link
        href={exploreHome()}
        className="w-fit rounded-sm text-sm leading-[1.4] font-bold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        ← Back to Explore
      </Link>
      <p className="mt-8 text-micro font-semibold text-muted-foreground">{meta ?? "Press kit"}</p>
      <h1 className="mt-2.5 mb-4 text-display leading-tight font-semibold tracking-tight text-foreground">{film.title}</h1>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {details?.createdBy ? "Created by " : "Directed by "}
          <span className="font-semibold text-foreground">{details?.createdBy ?? film.director}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          <SaveToCollection slug={slug} title={film.title} />
          <AddToProject slug={slug} title={film.title} />
        </div>
      </div>
      <PressKitBody filmId={filmId} />
    </div>
  );
}
