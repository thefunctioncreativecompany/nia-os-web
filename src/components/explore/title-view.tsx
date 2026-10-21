"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowUpRight, Play } from "lucide-react";

import { cn } from "@/lib/utils";
import { attribution, embedUrl, imdbUrl, pickSeason, primaryVideo, videoName, watchUrl, type Season, type Video } from "@/lib/explore";
import { Button } from "@/components/ui/button";
import { ChoicePills } from "@/components/nia/choice-pills";
import { MADE_IN_AFRICA_HREF, coverFor, creditTerm, exploreHome, metaLine, typeName, type Entry } from "@/features/explore/made-in-africa";

// A Made in Africa title, full screen (Ika, 2026-10-21), laid out like a project page (Figma
// 824:23124) so the two read the same: the trailer where the cover sits, then the title and what to
// study on the left; Details and Behind the production on the right; stacked on phones and
// tablets. Series get season pills under the trailer: a season swaps the trailer and its videos and
// goes into the address (?season=3) so it can be shared. Every video sits full width below, like
// Files & references. Nothing loads from YouTube until Play is pressed.
export function TitleView({ entry }: { entry: Entry }) {
  const params = useSearchParams();
  const { title, collection, pinnedSeason } = entry;
  const fromAll = params.get("from") === "all";
  const asked = Number(params.get("season"));
  const [season, setSeason] = useState<Season | null>(() => pickSeason(title, Number.isInteger(asked) && asked > 0 ? asked : null, pinnedSeason));
  const videos = season ? season.videos : title.videos;
  const [video, setVideo] = useState<Video | null>(() => primaryVideo(videos));
  const [playing, setPlaying] = useState(false);
  const hero = useRef<HTMLDivElement>(null);
  const cover = coverFor(title.slug);

  const chooseSeason = (number: string) => {
    const next = title.seasons.find((s) => s.number === Number(number)) ?? null;
    setSeason(next);
    setVideo(primaryVideo(next?.videos ?? []));
    setPlaying(false);
    const url = new URL(window.location.href);
    url.searchParams.set("season", number);
    window.history.replaceState(null, "", url);
  };

  const play = (v: Video) => {
    setVideo(v);
    setPlaying(true);
    hero.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest" });
  };

  const imdb = imdbUrl(title);
  const row = (label: string, value: React.ReactNode) => (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-6">
      <dt className="w-28 shrink-0 pt-1.5 text-sm leading-[1.4] font-bold text-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 pt-1.5 text-sm font-medium text-muted-foreground">{value}</dd>
    </div>
  );

  return (
    <div className="flex flex-1 flex-col gap-12 px-4 pt-10 pb-15 md:px-15">
      <Link
        href={fromAll ? MADE_IN_AFRICA_HREF : exploreHome()}
        className="w-fit rounded-sm text-sm leading-[1.4] font-bold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {fromAll ? "← Back to Made in Africa" : "← Back to Explore"}
      </Link>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] xl:gap-16">
        {/* Left: the trailer, the seasons, the title and what to study. */}
        <div className="flex min-w-0 flex-col gap-6">
          <div ref={hero} className={cn("relative aspect-[19/10] w-full overflow-hidden rounded-3xl", cover ? "bg-foreground" : entry.grain)}>
            {/* A new player for each video, so one never carries over to the next. */}
            {playing && video ? (
              <iframe
                key={video.video_id}
                src={embedUrl(video)}
                title={`${title.title}: ${videoName(video).toLowerCase()}`}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                className="absolute inset-0 size-full"
              />
            ) : (
              <>
                {cover ? (
                  <Image src={cover} alt="" fill preload sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover opacity-80" />
                ) : (
                  <span aria-hidden className="absolute top-6 left-7 max-w-[70%] text-h2 leading-tight font-bold tracking-tight">
                    {title.title}
                  </span>
                )}
                <span aria-hidden className="absolute inset-0 bg-linear-to-t from-black/55 via-black/5 to-transparent" />
                {video ? (
                  <button
                    type="button"
                    onClick={() => play(video)}
                    aria-label={`Play ${videoName(video).toLowerCase()}: ${title.title}${season ? `, season ${season.number}` : ""}`}
                    className="group absolute inset-0 flex flex-col items-center justify-center gap-3 text-white outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
                  >
                    <span className="flex size-16 items-center justify-center rounded-full bg-white/90 text-foreground shadow-card-hover transition-transform duration-fast ease-out group-hover:scale-105 group-focus-visible:scale-105 motion-reduce:scale-100!">
                      <Play aria-hidden className="ml-1 size-6 fill-current" />
                    </span>
                    <span className="text-sm font-semibold drop-shadow-md">{videoName(video)}</span>
                  </button>
                ) : (
                  <span className="absolute inset-x-0 bottom-0 p-5 text-sm font-medium text-white">No official video to show yet.</span>
                )}
              </>
            )}
          </div>
          <p className="-mt-3 text-caption text-muted-foreground">{attribution(video)}</p>

          {title.seasons.length > 1 && (
            <ChoicePills
              label="Season"
              value={season ? String(season.number) : null}
              onChange={chooseSeason}
              options={title.seasons.map((s) => ({ value: String(s.number), label: s.label ?? `Season ${s.number}` }))}
            />
          )}

          <div className="flex flex-col gap-3">
            <p className="text-small font-semibold text-muted-foreground">{metaLine(title)}</p>
            <h1 className="text-h3 font-bold text-foreground md:text-h2">{title.title}</h1>
            {title.synopsis && <p className="text-sm leading-relaxed text-foreground/80">{title.synopsis}</p>}
            {title.study_note && (
              <div className="flex flex-col gap-1">
                <h2 className="text-sm font-bold text-foreground">What to study</h2>
                <p className="text-sm leading-relaxed text-foreground/80">{title.study_note}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Details and Behind the production. */}
        <div className="flex min-w-0 flex-col gap-8">
          <section aria-labelledby="details" className="flex flex-col gap-4">
            <h2 id="details" className="text-xl leading-[1.4] font-bold text-foreground">
              Details
            </h2>
            <dl className="flex flex-col gap-3">
              {row("Type", title.seasons.length ? `${typeName(title)} · ${title.seasons.length} ${title.seasons.length === 1 ? "season" : "seasons"}` : typeName(title))}
              {row("Year", title.year ?? "—")}
              {season && row(season.label ?? `Season ${season.number}`, [season.year, season.episode_count && `${season.episode_count} episodes`].filter(Boolean).join(" · ") || "—")}
              {row(title.countries.length > 1 ? "Countries" : "Country", title.countries.join(", "))}
              {row(creditTerm(title), title.credit ?? "To be confirmed")}
              {title.platform && row("Where to watch", title.platform)}
              {row("Collection", collection.name)}
            </dl>
          </section>

          <section aria-labelledby="behind" className="flex flex-col gap-4">
            <h2 id="behind" className="text-xl leading-[1.4] font-bold text-foreground">
              Behind the Production
            </h2>
            <dl className="flex flex-col gap-3">
              {row("Recognition", title.recognition ?? "To be confirmed")}
              {row("Pair with", title.pair_with ?? "—")}
            </dl>
            {(video || imdb) && (
              <div className="flex flex-wrap gap-2.5 pt-2">
                {video && <OutLink href={watchUrl(video)}>{video.provider === "youtube" ? "Watch on YouTube" : "Watch on Vimeo"}</OutLink>}
                {imdb && <OutLink href={imdb}>IMDb</OutLink>}
              </div>
            )}
          </section>
        </div>
      </div>

      {videos.length > 0 && (
        <section aria-labelledby="videos" className="flex flex-col gap-4">
          <h2 id="videos" className="text-xl leading-[1.4] font-bold text-foreground">
            Videos{season && title.seasons.length > 1 ? `, ${season.label ?? `season ${season.number}`}` : ""}{" "}
            <span className="text-micro font-normal text-muted-foreground">{videos.length}</span>
          </h2>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {videos.map((v) => {
              const on = playing && v.video_id === video?.video_id;
              return (
                <li key={v.video_id}>
                  <button
                    type="button"
                    onClick={() => play(v)}
                    aria-pressed={on}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl border p-4 text-left outline-none transition-colors duration-fast focus-visible:ring-3 focus-visible:ring-ring/50",
                      on ? "border-foreground bg-secondary" : "border-border bg-white hover:border-ring",
                    )}
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground text-primary-foreground">
                      <Play aria-hidden className="ml-0.5 size-3.5 fill-current" />
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-bold text-foreground">{videoName(v)}</span>
                      <span className="truncate text-caption text-muted-foreground">
                        {v.channel ?? (v.is_official ? "Official" : "Unofficial upload")} · {v.provider === "youtube" ? "YouTube" : "Vimeo"}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

function OutLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Button variant="outline" size="md" asChild>
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
        <ArrowUpRight aria-hidden data-icon="inline-end" />
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    </Button>
  );
}
