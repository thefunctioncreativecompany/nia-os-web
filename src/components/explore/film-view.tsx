"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { exploreHome } from "@/features/explore/made-in-africa";
import { filmSlug } from "@/features/explore/items";
import { recordView } from "@/features/explore/views";
import { getFilm } from "./explore-data";
import { getFilmDetails, lengthOf, linksFor } from "./film-details";
import { FilmVideoPlayer, PressKitSection, type PlayerVideo } from "./press-kit-body";
import { getPress, type PressVideo } from "./press-coverage";
import { AddToProject, SaveToCollection } from "./save-controls";

// A film's own page (Ika, 2026-10-28), laid out like a project page and Explore's title pages:
// the video where the cover sits, then the title, Save / Add to project and the summary on the
// left; Details and Behind the production on the right; the press kit (press tour, what critics
// said, context) full width below. Choosing a press-tour video plays it in the main player.
export function FilmView({ filmId }: { filmId: string }) {
  const film = getFilm(filmId);
  const details = getFilmDetails(filmId)!;
  const press = getPress(filmId);
  const slug = filmSlug(filmId);
  // Remembered for Explore's Recently viewed and For you.
  useEffect(() => void recordView(slug), [slug]);

  const [picked, setPicked] = useState<PressVideo | null>(null);
  const video: PlayerVideo | null = picked ? { id: picked.id, label: picked.kind, channel: picked.channel } : details.video;
  const hero = useRef<HTMLDivElement>(null);
  const choose = (v: PressVideo) => {
    setPicked(v);
    hero.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest" });
  };

  const meta = [details.kind, details.year, lengthOf(details), details.country].filter(Boolean).join(" · ");
  const row = (label: string, value: React.ReactNode) => (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-6">
      <dt className="w-28 shrink-0 pt-1.5 text-sm leading-[1.4] font-bold text-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 pt-1.5 text-sm font-medium text-muted-foreground">{value}</dd>
    </div>
  );

  return (
    <div className="flex flex-1 flex-col gap-12 px-4 pt-10 pb-15 md:px-15">
      <Link
        href={exploreHome()}
        className="w-fit rounded-sm text-sm leading-[1.4] font-bold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        ← Back to Explore
      </Link>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] xl:gap-16">
        {/* Left: the video, the title and the summary. */}
        <div className="flex min-w-0 flex-col gap-6">
          <div ref={hero} className="scroll-mt-24">
            {/* A new player for each video chosen. */}
            <FilmVideoPlayer key={picked?.id ?? "official"} filmId={filmId} title={film.title} video={video} autoPlay={!!picked} className="aspect-[19/10] rounded-3xl" />
          </div>
          {video && <p className="-mt-3 text-caption text-muted-foreground">{video.label} from {video.channel} on YouTube.</p>}

          <div className="flex flex-col gap-3">
            <p className="text-small font-semibold text-muted-foreground">{meta}</p>
            <h1 className="text-h3 font-bold text-foreground md:text-h2">{film.title}</h1>
            <div className="flex flex-wrap gap-2">
              <SaveToCollection slug={slug} title={film.title} />
              <AddToProject slug={slug} title={film.title} />
            </div>
            <p className="text-sm leading-relaxed text-foreground/80">{details.summary}</p>
          </div>
        </div>

        {/* Right: Details and Behind the production. */}
        <div className="flex min-w-0 flex-col gap-8">
          <section aria-labelledby="details" className="flex flex-col gap-4">
            <h2 id="details" className="text-xl leading-[1.4] font-bold text-foreground">
              Details
            </h2>
            <dl className="flex flex-col gap-3">
              {row("Type", details.kind)}
              {row("Year", details.year)}
              {lengthOf(details) && row("Length", lengthOf(details))}
              {details.country && row("Country", details.country)}
              {details.createdBy ? row("Created by", details.createdBy) : null}
              {row("Directed by", film.director)}
              {details.starring.length > 0 && row("Starring", details.starring.join(", "))}
              {details.basedOn && row("Based on", details.basedOn)}
              {details.genres.length > 0 && row(details.genres.length > 1 ? "Genres" : "Genre", details.genres.join(", "))}
              {press?.streaming && row("Streaming on", press.streaming)}
            </dl>
          </section>

          <section aria-labelledby="behind" className="flex flex-col gap-4">
            <h2 id="behind" className="text-xl leading-[1.4] font-bold text-foreground">
              Behind the Production
            </h2>
            <div className="flex flex-wrap gap-2.5">
              {linksFor(details).map((l) => (
                <Button key={l.label} variant="outline" size="md" asChild>
                  <a href={l.href} target="_blank" rel="noopener noreferrer">
                    {l.label}
                    <ArrowUpRight aria-hidden data-icon="inline-end" />
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </Button>
              ))}
            </div>
            <p className="text-caption text-muted-foreground">Details from Wikidata{details.script ? `; script: ${details.script.source}` : ""}.</p>
          </section>
        </div>
      </div>

      {press && <PressKitSection title={film.title} imdb={details.imdb} press={press} playing={video?.id ?? null} onChoose={choose} />}
    </div>
  );
}
