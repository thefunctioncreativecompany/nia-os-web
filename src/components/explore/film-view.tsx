"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CastCrewRow, WIKIDATA_NOTE, type RowPerson } from "@/components/nia/cast-crew-row";
import { exploreHome } from "@/features/explore/made-in-africa";
import { filmSlug } from "@/features/explore/items";
import { recordView } from "@/features/explore/views";
import { getFilm } from "./explore-data";
import { getFilmDetails, lengthOf, linksFor } from "./film-details";
import { FilmVideoPlayer, PressKitSection, type PlayerVideo } from "./press-kit-body";
import type { PressCoverage, PressVideo } from "./press-coverage";
import { AddToProject, SaveToCollection } from "./save-controls";
import { CreditsViewAll } from "./credits-view-all";
import { BackLink } from "@/components/nia/back-link";
import { Comments } from "@/components/nia/comments";

// A film's own page (Ika, 2026-10-28), laid out like a project page and Explore's title pages:
// the video where the cover sits, then the title, Save / Add to project and the summary on the
// left; Details and Behind the production on the right; the press kit (press tour, what critics
// said, context) full width below. Choosing a press-tour video plays it in the main player. Cast &
// Crew sits between the two (Ika, 2026-11-01).
// `press`: this film's press kit, handed in by the page.
export function FilmView({ filmId, castCrew = [], castTotal = 0, press = null }: { filmId: string; castCrew?: RowPerson[]; castTotal?: number; press?: PressCoverage | null }) {
  const film = getFilm(filmId);
  const details = getFilmDetails(filmId)!;
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

  const row = (label: string, value: React.ReactNode) => (
    <div className="flex items-start gap-4 sm:gap-6">
      <dt className="w-24 shrink-0 pt-1.5 text-sm leading-[1.4] font-bold text-foreground sm:w-28">{label}</dt>
      <dd className="min-w-0 flex-1 pt-1.5 text-sm font-medium text-muted-foreground">{value}</dd>
    </div>
  );

  return (
    <div className="flex flex-1 flex-col gap-12 px-4 pt-10 pb-15 md:px-page">
      <BackLink
        href={exploreHome()}
        className="w-fit rounded-sm text-sm leading-[1.4] font-bold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        ← Back to Explore
      </BackLink>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] xl:gap-16">
        {/* Left: the video, the title and the summary. */}
        <div className="flex min-w-0 flex-col gap-6">
          <div ref={hero} className="scroll-mt-24">
            {/* A new player for each video chosen. */}
            <FilmVideoPlayer key={picked?.id ?? "official"} filmId={filmId} title={film.title} video={video} autoPlay={!!picked} className="aspect-[19/10] rounded-3xl" />
          </div>
          {video && <p className="-mt-3 text-caption text-muted-foreground">{video.label} from {video.channel} on YouTube.</p>}

          <div className="flex flex-col gap-3">
            <h1 className="text-h2 font-semibold tracking-tight text-foreground">{film.title}</h1>
            <div className="flex flex-wrap gap-2">
              <SaveToCollection slug={slug} title={film.title} />
              <AddToProject slug={slug} title={film.title} />
            </div>
            <p className="text-sm leading-relaxed text-foreground/80">{details.summary}</p>
          </div>
          {/* Under the summary, as on a project (Ika, 2026-11-11). */}
          <Comments subject={{ slug }} />
        </div>

        {/* Right: Details and Behind the production. */}
        <div className="flex min-w-0 flex-col gap-8">
          <section aria-labelledby="details" className="flex flex-col gap-4">
            <h2 id="details" className="text-subtitle font-semibold text-foreground">
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
            <h2 id="behind" className="text-subtitle font-semibold text-foreground">
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

      <CastCrewRow people={castCrew} total={castTotal} viewAll={<CreditsViewAll slug={slug} title={film.title} total={castTotal} />} note={WIKIDATA_NOTE} />

      {press && <PressKitSection title={film.title} imdb={details.imdb} press={press} playing={video?.id ?? null} onChoose={choose} />}

    </div>
  );
}
