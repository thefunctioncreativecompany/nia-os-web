"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { getFilm, type Category } from "./explore-data";
import { PosterArt, opensLater } from "./poster-art";

// Latest projects as six tall strips (Ika's Claude Design). The first stands open; pointing at (or
// tabbing to) another opens that one and dims the rest. Collapsed strips show the title on its side. On phones the
// strips stack, each one open.
export function LatestStrips({ category }: { category: Category }) {
  const [open, setOpen] = useState(0);
  const [engaged, setEngaged] = useState(false);

  const reset = () => {
    setOpen(0);
    setEngaged(false);
  };

  return (
    <section aria-labelledby={`${category.id}-title`} className="mt-18">
      <h3 id={`${category.id}-title`} className="mb-4 text-subtitle font-semibold text-foreground">
        {category.title}
      </h3>
      <ul
        onPointerLeave={reset}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) reset();
        }}
        className="flex flex-col gap-2.5 md:h-130 md:flex-row"
      >
        {category.items.map((item, i) => {
          const film = getFilm(item.filmId);
          const on = open === i;
          const show = () => {
            setOpen(i);
            setEngaged(true);
          };
          return (
            <li
              key={item.filmId}
              className={cn(
                "flex min-w-0 md:basis-0 md:transition-[flex-grow,filter] md:duration-strip md:ease-glide",
                on ? "md:grow-6" : "md:grow",
                engaged && !on && "md:brightness-85 md:saturate-50",
              )}
            >
              <button
                type="button"
                onClick={opensLater}
                onPointerEnter={(e) => e.pointerType === "mouse" && show()}
                onFocus={show}
                aria-label={`${film.title} by ${film.director}, latest project`}
                className="group relative block h-72 w-full overflow-hidden rounded-xl text-left text-white outline-none focus-visible:ring-3 focus-visible:ring-ring/50 md:h-full"
              >
                <PosterArt
                  film={film}
                  still
                  position={item.position}
                  sizes="(min-width: 48rem) 60vw, 100vw"
                  className={cn("transition-transform duration-zoom ease-glide motion-reduce:scale-100", on && "md:scale-106")}
                />
                <span aria-hidden className="absolute inset-0 bg-linear-to-b from-transparent from-35% to-black/70" />
                <span
                  aria-hidden
                  className={cn(
                    "absolute bottom-5 left-1/2 -translate-x-1/2 rotate-180 whitespace-nowrap text-sm font-semibold drop-shadow-md transition-opacity duration-base ease-out [writing-mode:vertical-rl] max-md:hidden",
                    on && "opacity-0",
                  )}
                >
                  {film.title}
                </span>
                <span
                  className={cn(
                    "absolute inset-x-5 bottom-5 flex flex-col items-start gap-3 transition-[opacity,transform] duration-lift ease-glide md:inset-x-8 md:bottom-8 md:min-w-90",
                    on ? "md:delay-150" : "md:translate-y-3.5 md:opacity-0",
                  )}
                >
                  <span className="inline-flex h-6 items-center rounded-full border border-white/70 px-2.5 text-micro font-semibold">
                    Latest project
                  </span>
                  <span className="text-h3 leading-tight font-semibold tracking-tight drop-shadow-md md:text-display">
                    Step inside the world of {film.title}
                  </span>
                  <span className="text-sm text-white/90">
                    {film.director}&rsquo;s latest &mdash; explore behind-the-scenes breakdowns, call sheets, and production docs
                  </span>
                  <span className="inline-flex h-9 items-center gap-2 rounded-full border border-white px-4 text-small font-medium">
                    View project
                    <ArrowRight aria-hidden className="size-3.25" strokeWidth={2} />
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
