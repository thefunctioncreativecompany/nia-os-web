"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowUpRight, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollRow } from "@/components/nia/scroll-row";
import { useStopVideosWhenHidden } from "@/hooks/use-stop-videos";
import {
  creatorFilms,
  creatorImage,
  creatorYear,
  creditName,
  instagramEmbed,
  instagramUrl,
  profileUrl,
  type CreatorFilm,
} from "@/features/explore/creators";
import { exploreItem } from "@/features/explore/items";
import { LIBRARY_HREF, exploreHome } from "@/features/explore/made-in-africa";
import { CreatorCredit } from "./creators-strip";
import { AddToProject, SaveToCollection } from "./save-controls";
import { ExploreCard } from "./title-card";

// A creator's film, full screen (Ika, 2026-10-21), laid out like a title or project page: the film
// where the cover sits (Instagram's own player, loaded only on Play and stopped when the page is
// left), its title, Save and Add to project on the left; Details and the full production credits,
// each linked to the person's Instagram, on the right. More from creators closes the page.
export function CreatorView({ film }: { film: CreatorFilm }) {
  const params = useSearchParams();
  const fromLibrary = params.get("from") === "library";
  const back = fromLibrary ? { href: LIBRARY_HREF, label: "← Back to Explore all" } : { href: exploreHome(), label: "← Back to Explore" };
  const [playing, setPlaying] = useState(false);
  const hero = useRef<HTMLDivElement>(null);
  useStopVideosWhenHidden(hero, () => setPlaying(false));
  const more = creatorFilms
    .filter((f) => f.slug !== film.slug)
    .toSorted((a, b) => Number(b.type === film.type) - Number(a.type === film.type))
    .map((f) => exploreItem(f.slug)!);
  const date = new Date(`${film.date}T12:00:00`).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });

  const row = (label: string, value: React.ReactNode) => (
    <div key={label} className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-6">
      <dt className="w-36 shrink-0 pt-1.5 text-sm leading-[1.4] font-bold text-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 pt-1.5 text-sm font-medium text-muted-foreground">{value}</dd>
    </div>
  );

  return (
    <div className="flex flex-1 flex-col gap-12 px-4 pt-10 pb-15 md:px-15">
      <Link href={back.href} className="w-fit rounded-sm text-sm leading-[1.4] font-bold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50">
        {back.label}
      </Link>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] xl:gap-16">
        <div className="flex min-w-0 flex-col gap-6">
          <div ref={hero} className="relative flex min-h-[min(80svh,46rem)] items-center justify-center overflow-hidden rounded-3xl bg-foreground">
            {/* The film's still, blurred to fill the frame, with the still itself in the middle. */}
            <Image src={creatorImage(film)} alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="scale-110 object-cover opacity-50 blur-2xl" />
            {playing ? (
              <iframe
                src={instagramEmbed(film)}
                title={`${film.title}, on Instagram`}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                className="relative z-10 h-[min(78svh,45rem)] w-[min(100%,25rem)] rounded-2xl bg-white"
              />
            ) : (
              <button
                type="button"
                onClick={() => setPlaying(true)}
                aria-label={`Play ${film.title}, from Instagram`}
                className="group relative z-10 flex h-[min(70svh,40rem)] w-[min(90%,24rem)] items-center justify-center overflow-hidden rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <Image src={creatorImage(film)} alt="" fill preload sizes="24rem" quality={90} className="object-cover" />
                <span className="relative flex size-16 items-center justify-center rounded-full bg-white/90 text-foreground shadow-card-hover transition-transform duration-fast ease-out group-hover:scale-105 group-focus-visible:scale-105 motion-reduce:scale-100!">
                  <Play aria-hidden className="ml-1 size-6 fill-current" />
                </span>
              </button>
            )}
          </div>
          <p className="-mt-3 text-caption text-muted-foreground">
            Plays from Instagram, posted by{" "}
            <a href={profileUrl(film.account)} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
              @{film.account}
            </a>
            . Credits from the post&rsquo;s caption.
          </p>

          <div className="flex flex-col gap-3">
            <p className="text-small font-semibold text-muted-foreground">{[film.type, creatorYear(film), film.country].filter(Boolean).join(" · ")}</p>
            <h1 className="text-h3 font-bold text-foreground md:text-h2">{film.title}</h1>
            <div className="flex flex-wrap gap-2">
              <SaveToCollection slug={film.slug} title={film.title} />
              <AddToProject slug={film.slug} title={film.title} />
            </div>
            <p className="text-sm leading-relaxed text-foreground/80">{film.summary}</p>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-8">
          <section aria-labelledby="details" className="flex flex-col gap-4">
            <h2 id="details" className="text-xl leading-[1.4] font-bold text-foreground">
              Details
            </h2>
            <dl className="flex flex-col gap-3">
              {row("Type", film.type)}
              {film.brand && row("Brand", film.brand)}
              {row("Posted by", <Handle handle={film.account} />)}
              {row("Posted", date)}
              {film.country && row("Country", film.country)}
            </dl>
            <div className="flex flex-wrap gap-2.5 pt-2">
              <Button variant="outline" size="md" asChild>
                <a href={instagramUrl(film)} target="_blank" rel="noopener noreferrer">
                  View on Instagram
                  <ArrowUpRight aria-hidden data-icon="inline-end" />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </Button>
            </div>
          </section>

          <section aria-labelledby="credits" className="flex flex-col gap-4">
            <h2 id="credits" className="text-xl leading-[1.4] font-bold text-foreground">
              Credits <span className="text-micro font-normal text-muted-foreground">{film.credits.length}</span>
            </h2>
            <dl className="flex flex-col gap-3">
              {film.credits.map((x) =>
                row(
                  x.role,
                  x.handle ? (
                    <a href={profileUrl(x.handle)} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:text-foreground hover:underline">
                      {creditName(x)}
                      <span className="sr-only"> on Instagram (opens in a new tab)</span>
                    </a>
                  ) : (
                    x.name
                  ),
                ),
              )}
            </dl>
          </section>
        </div>
      </div>

      <section aria-labelledby="more-creators" className="flex flex-col gap-4">
        <h2 id="more-creators" className="text-xl leading-[1.4] font-bold text-foreground">
          More from creators
        </h2>
        <ScrollRow label="More from creators">
          {more.map((item) => (
            <li key={item.slug} className="w-[44%] flex-none snap-start sm:w-[30%] md:w-[22%] lg:w-[16%]">
              <ExploreCard item={item} href={item.href(fromLibrary ? "library" : undefined)} sizes="(min-width: 64rem) 16vw, (min-width: 40rem) 30vw, 44vw" />
            </li>
          ))}
        </ScrollRow>
      </section>

      <CreatorCredit />
    </div>
  );
}

function Handle({ handle }: { handle: string }) {
  return (
    <a href={profileUrl(handle)} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:text-foreground hover:underline">
      @{handle}
      <span className="sr-only"> on Instagram (opens in a new tab)</span>
    </a>
  );
}
