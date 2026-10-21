"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight, Play, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { getFilm, type CategoryItem } from "./explore-data";
import { getFilmDetails, lengthOf, linksFor, type FilmDetails } from "./film-details";
import { NotYet } from "@/components/nia/not-yet";
import { PosterArt } from "./poster-art";

// The film preview (Ika, 2026-10-20), opened from Explore's press kits, poster grid and director's
// notes (not Latest projects), laid out like the template preview pop-up: the film's
// official video, a short summary and the facts, with links out to IMDb, Rotten Tomatoes and
// Wikipedia. The video loads only when Play is pressed, from YouTube's privacy-enhanced player.
// Previous / next (← →) move through the list it was opened from; Escape or outside closes it.
// Full screen on phones.
export function PressKitPreview({
  item,
  list,
  onNavigate,
  onClose,
  actionLabel = () => "Open press kit",
}: {
  item: CategoryItem;
  list: CategoryItem[];
  onNavigate: (item: CategoryItem) => void;
  onClose: () => void;
  /** The main button's words for this film ("Open press kit", "Open film page", "Open Call Sheet"). */
  actionLabel?: (item: CategoryItem) => string;
}) {
  const film = getFilm(item.filmId);
  const details = getFilmDetails(item.filmId);
  const scroller = useRef<HTMLDivElement>(null);
  const index = list.findIndex((x) => x.filmId === item.filmId);
  const prev = index > 0 ? list[index - 1] : null;
  const next = index >= 0 && index < list.length - 1 ? list[index + 1] : null;

  // Back to the top for each film.
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [item.filmId]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" && next) onNavigate(next);
    if (e.key === "ArrowLeft" && prev) onNavigate(prev);
  };

  const meta = details ? [details.kind, details.year, lengthOf(details)].filter(Boolean).join(" · ") : null;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        onKeyDown={onKeyDown}
        className="flex max-w-none flex-col gap-0 overflow-hidden p-0 max-sm:h-svh max-sm:w-screen max-sm:rounded-none sm:h-[min(92svh,62.5rem)] sm:w-[min(62rem,calc(100vw-3rem))] sm:max-w-none"
      >
        <div className="flex items-center gap-1 border-b border-border px-3.5 py-3">
          <Button variant="ghost" size="icon-sm" disabled={!prev} onClick={() => prev && onNavigate(prev)} aria-label={prev ? `Previous: ${getFilm(prev.filmId).title}` : "Previous"}>
            <ChevronLeft />
          </Button>
          <Button variant="ghost" size="icon-sm" disabled={!next} onClick={() => next && onNavigate(next)} aria-label={next ? `Next: ${getFilm(next.filmId).title}` : "Next"}>
            <ChevronRight />
          </Button>
          <div className="flex-1" />
          <DialogClose asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Close">
              <X />
            </Button>
          </DialogClose>
        </div>

        <div ref={scroller} className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-225 px-4 pt-8.5 pb-14 sm:px-9.5">
            <p className="text-micro font-semibold text-muted-foreground">
              {item.rank ? `Number ${item.rank} · ` : ""}
              {meta ?? "Press kit"}
            </p>
            <DialogTitle className="mt-2.5 mb-4 text-display leading-tight font-semibold tracking-tight text-foreground">{film.title}</DialogTitle>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                {details?.createdBy ? "Created by " : "Directed by "}
                <span className="font-semibold text-foreground">{details?.createdBy ?? film.director}</span>
              </p>
              {/* Greyed out until film pages open with Explore. */}
              <div className="flex flex-col items-end gap-1.5">
                <Button disabled className="px-6.5">
                  {actionLabel(item)}
                </Button>
                <NotYet>Opens with Explore in February 2027</NotYet>
              </div>
            </div>

            {/* A new player for each film, so one film's video never carries over to the next. */}
            <FilmVideoPlayer key={item.filmId} filmId={item.filmId} title={film.title} details={details} />

            {details ? (
              <>
                <DialogDescription className="mt-6 text-lead leading-relaxed text-foreground/80">{details.summary}</DialogDescription>
                <ul className="mt-3.5 flex flex-wrap gap-2">
                  {details.genres.map((g) => (
                    <li key={g} className="rounded-full bg-secondary px-3 py-1.5 text-small text-foreground/80">{g}</li>
                  ))}
                </ul>

                <dl className="mt-8 grid gap-x-8 gap-y-4 sm:grid-cols-[max-content_1fr]">
                  {details.starring.length > 0 && <Fact term="Starring">{details.starring.join(", ")}</Fact>}
                  {details.createdBy && <Fact term="Directed by">{film.director}</Fact>}
                  {details.basedOn && <Fact term="Based on">{details.basedOn}</Fact>}
                  {details.country && <Fact term="Country">{details.country}</Fact>}
                </dl>

                <div className="mt-8 flex flex-wrap gap-2.5">
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

                <p className="mt-8 text-caption text-muted-foreground">
                  {details.video ? `${details.video.label} from ${details.video.channel} on YouTube. ` : ""}
                  {details.script ? `Script: ${details.script.source} (PDF). ` : ""}
                  Details from Wikidata.
                </p>
              </>
            ) : (
              <DialogDescription className="mt-6 text-lead text-foreground/80">More about {film.title} is coming soon.</DialogDescription>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// The film's still with a Play button; pressing it swaps in the YouTube player and starts it.
// Nothing is loaded from YouTube until then.
function FilmVideoPlayer({ filmId, title, details }: { filmId: string; title: string; details: FilmDetails | null }) {
  const [playing, setPlaying] = useState(false);
  const video = details?.video;
  const film = getFilm(filmId);

  return (
    <div className="relative mt-6.5 aspect-video overflow-hidden rounded-2xl border border-border bg-foreground">
      {playing && video ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
          title={`${title}: ${video.label.toLowerCase()}`}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          className="absolute inset-0 size-full"
        />
      ) : (
        <>
          <PosterArt film={film} still sizes="(min-width: 62rem) 56rem, 100vw" className="opacity-80" />
          <span aria-hidden className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent" />
          {video ? (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              aria-label={`Play ${video.label.toLowerCase()}: ${title}`}
              className="group absolute inset-0 flex flex-col items-center justify-center gap-3 text-white outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
            >
              <span className="flex size-16 items-center justify-center rounded-full bg-white/90 text-foreground shadow-card-hover transition-transform duration-fast ease-out group-hover:scale-105 group-focus-visible:scale-105 motion-reduce:scale-100!">
                <Play aria-hidden className="ml-1 size-6 fill-current" />
              </span>
              <span className="text-sm font-semibold drop-shadow-md">{video.label}</span>
            </button>
          ) : (
            <span className="absolute inset-x-0 bottom-0 p-5 text-sm font-medium text-white">No official video to show yet.</span>
          )}
        </>
      )}
    </div>
  );
}

function Fact({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-sm font-semibold text-foreground">{term}</dt>
      <dd className="-mt-3 text-sm text-foreground/80 sm:mt-0">{children}</dd>
    </>
  );
}
