"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowUpRight, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DialogDescription } from "@/components/ui/dialog";
import { useStopVideosWhenHidden } from "@/hooks/use-stop-videos";
import { getFilm } from "./explore-data";
import { getFilmDetails, linksFor } from "./film-details";
import { PosterArt } from "./poster-art";
import { getPress, type PressCoverage, type PressVideo } from "./press-coverage";

export type PlayerVideo = { id: string; label: string; channel: string };

// A film's press kit below its title, shared by the pop-up and the film's own page (Ika,
// 2026-10-28): the official video (or a press-tour video once one is chosen), summary, facts,
// links out, then the press tour, what critics said and context (press-coverage.ts). In the
// pop-up the summary is the dialog's description. Give it a `key` per film so one film's choice
// never carries over to the next.
export function PressKitBody({ filmId, inDialog = false }: { filmId: string; inDialog?: boolean }) {
  const film = getFilm(filmId);
  const details = getFilmDetails(filmId);
  const press = getPress(filmId);
  const Summary = inDialog ? DialogDescription : "p";
  // The press-tour video chosen for the main player; the official video until one is.
  const [picked, setPicked] = useState<PressVideo | null>(null);
  const playerVideo: PlayerVideo | null = picked ? { id: picked.id, label: picked.kind, channel: picked.channel } : (details?.video ?? null);
  const player = useRef<HTMLDivElement>(null);
  const choose = (video: PressVideo) => {
    setPicked(video);
    player.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <div ref={player} className="scroll-mt-6">
        {/* A new player for each video chosen. */}
        <FilmVideoPlayer key={picked?.id ?? "official"} filmId={filmId} title={film.title} video={playerVideo} autoPlay={!!picked} />
      </div>

      {details ? (
        <>
          <Summary className="mt-6 text-lead leading-relaxed text-foreground/80">{details.summary}</Summary>
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
            {press?.streaming && <Fact term="Streaming on">{press.streaming}</Fact>}
          </dl>

          <div className="mt-8 flex flex-wrap gap-2.5">
            {[...linksFor(details), ...pressLinks(film.title, details.imdb, press)].map((l) => (
              <Button key={l.label} variant="outline" size="md" asChild>
                <a href={l.href} target="_blank" rel="noopener noreferrer">
                  {l.label}
                  <ArrowUpRight aria-hidden data-icon="inline-end" />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </Button>
            ))}
          </div>

          {press && <PressSections press={press} playing={playerVideo?.id ?? null} onChoose={choose} />}

          <p className="mt-8 text-caption text-muted-foreground">
            {playerVideo ? `${playerVideo.label} from ${playerVideo.channel} on YouTube. ` : ""}
            {press ? "Videos from each studio's, streamer's, festival's or publication's own channel; reviews linked, never copied, chosen to show the range of opinion. " : ""}
            {details.script ? `Script: ${details.script.source} (PDF). ` : ""}
            Details from Wikidata.
          </p>
        </>
      ) : (
        <Summary className="mt-6 text-lead text-foreground/80">More about {film.title} is coming soon.</Summary>
      )}
    </>
  );
}

// The film's still with a Play button; pressing it swaps in the YouTube player and starts it.
// Nothing is loaded from YouTube until then. `className` sets the frame (the pop-up's by default).
export function FilmVideoPlayer({
  filmId,
  title,
  video,
  autoPlay,
  className = "mt-6.5 aspect-video rounded-2xl",
}: {
  filmId: string;
  title: string;
  video: PlayerVideo | null;
  autoPlay: boolean;
  className?: string;
}) {
  const [playing, setPlaying] = useState(false);
  const film = getFilm(filmId);
  const box = useRef<HTMLDivElement>(null);
  // Leaving the page (it stays alive, hidden, for Back) stops the video.
  useStopVideosWhenHidden(box, () => setPlaying(false));
  // A video chosen from the press tour starts straight away; the official one waits for Play.
  // Started after mounting, so the stop-when-hidden clean-up can't undo it.
  useEffect(() => {
    // Deliberately after mounting: as starting state, the clean-up above would reset it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (autoPlay) setPlaying(true);
  }, [autoPlay]);

  return (
    <div ref={box} className={`relative overflow-hidden border border-border bg-foreground ${className}`}>
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
              <span className="flex size-16 items-center justify-center rounded-full bg-card/90 text-foreground shadow-card-hover transition-transform duration-fast ease-out group-hover:scale-105 group-focus-visible:scale-105 motion-reduce:scale-100!">
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

/** Box office (for cinema releases with an IMDb id) and where to watch, beside IMDb and the rest. */
export function pressLinks(title: string, imdb: string | null, press: PressCoverage | null) {
  if (!press) return [];
  return [
    press.cinemaRelease && imdb && { label: "Box office", href: `https://www.boxofficemojo.com/title/${imdb}/` },
    { label: "Where to watch", href: `https://www.justwatch.com/us/search?q=${encodeURIComponent(title)}` },
  ].filter((l): l is { label: string; href: string } => !!l);
}

// The press tour, what critics said and the context around the film.
export function PressSections({ press, playing, onChoose }: { press: PressCoverage; playing: string | null; onChoose: (video: PressVideo) => void }) {
  return (
    <>
      {press.videos.length > 0 && (
        <section aria-labelledby="press-tour" className="mt-10">
          <h3 id="press-tour" className="text-subtitle font-bold tracking-tight text-foreground">Press tour</h3>
          <p className="mt-1 text-small text-muted-foreground">Interviews, featurettes and Q&As from the studios, festivals and the press, official uploads first.</p>
          <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {press.videos.map((v) => (
              <li key={v.id}>
                <button
                  type="button"
                  onClick={() => onChoose(v)}
                  aria-label={`Play ${v.kind.toLowerCase()}: ${v.title}, from ${v.channel}`}
                  aria-current={playing === v.id ? "true" : undefined}
                  className="group flex w-full flex-col gap-2 rounded-lg text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <span className="relative block aspect-video overflow-hidden rounded-lg border border-border bg-muted group-aria-[current=true]:ring-2 group-aria-[current=true]:ring-gold">
                    <Image src={`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`} alt="" fill sizes="(min-width: 40rem) 18rem, 45vw" className="object-cover" />
                    <span aria-hidden className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 transition-opacity duration-fast group-hover:opacity-100">
                      <span className="flex size-10 items-center justify-center rounded-full bg-card/90 text-foreground">
                        <Play className="ml-0.5 size-4 fill-current" />
                      </span>
                    </span>
                  </span>
                  <span className="text-caption font-semibold text-muted-foreground">{v.kind}</span>
                  <span className="-mt-1.5 line-clamp-2 text-sm leading-snug font-semibold text-foreground">{v.title}</span>
                  <span className="-mt-1.5 text-caption text-muted-foreground">{v.channel}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {press.reviews.length > 0 && (
        <section aria-labelledby="critics" className="mt-10">
          <h3 id="critics" className="text-subtitle font-bold tracking-tight text-foreground">What critics said</h3>
          <p className="mt-1 text-small text-muted-foreground">A spread of reviews, praise and criticism alike, with our one-word read of each. No scores.</p>
          <ul className="mt-4 flex flex-col divide-y divide-border border-y border-border">
            {press.reviews.map((r) => (
              <li key={r.href}>
                <OutRow href={r.href} outlet={r.outlet} title={r.title} tag={r.verdict} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {press.articles.length > 0 && (
        <section aria-labelledby="context" className="mt-10">
          <h3 id="context" className="text-subtitle font-bold tracking-tight text-foreground">Context</h3>
          <ul className="mt-4 flex flex-col divide-y divide-border border-y border-border">
            {press.articles.map((a) => (
              <li key={a.href}>
                <OutRow href={a.href} outlet={a.outlet} title={a.title} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function OutRow({ href, outlet, title, tag }: { href: string; outlet: string; title: string; tag?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-3 py-3.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2 text-small font-semibold text-foreground">
          {outlet}
          {tag && <span className="rounded-full border border-border px-2 py-0.5 text-caption font-medium text-muted-foreground">{tag}</span>}
        </span>
        <span className="mt-0.5 block text-sm leading-snug text-foreground/80 group-hover:text-foreground group-hover:underline group-hover:underline-offset-2">{title}</span>
      </span>
      <ArrowUpRight aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

/** What a press kit holds, in a line: "7 videos · 5 reviews · 1 article". */
export function pressSummary(press: PressCoverage) {
  const n = (count: number, one: string) => (count ? `${count} ${one}${count === 1 ? "" : "s"}` : null);
  return [n(press.videos.length, "video"), n(press.reviews.length, "review"), n(press.articles.length, "article")].filter(Boolean).join(" · ");
}

// A full page's "Press kit" (Ika, 2026-10-28): links to box office and where to watch, then the
// press tour, what critics said and context. Used by film pages and title pages.
export function PressKitSection({
  title,
  imdb,
  press,
  playing,
  onChoose,
}: {
  title: string;
  imdb: string | null;
  press: PressCoverage;
  playing: string | null;
  onChoose: (video: PressVideo) => void;
}) {
  const links = pressLinks(title, imdb, press);
  return (
    <section aria-labelledby="press-kit" className="flex flex-col">
      <h2 id="press-kit" className="text-xl leading-[1.4] font-bold text-foreground">
        Press kit <span className="text-micro font-normal text-muted-foreground">{pressSummary(press)}</span>
      </h2>
      <p className="mt-1 max-w-160 text-sm text-muted-foreground">
        The press tour, what critics said and the context around the film, from the studios, festivals and publications themselves.
      </p>
      {links.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2.5">
          {links.map((l) => (
            <Button key={l.label} variant="outline" size="md" asChild>
              <a href={l.href} target="_blank" rel="noopener noreferrer">
                {l.label}
                <ArrowUpRight aria-hidden data-icon="inline-end" />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </Button>
          ))}
        </div>
      )}
      <PressSections press={press} playing={playing} onChoose={onChoose} />
    </section>
  );
}
