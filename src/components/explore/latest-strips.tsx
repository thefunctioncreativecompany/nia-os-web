"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { isMouse } from "@/hooks/use-pointer";
import { getFilm, type Category } from "./explore-data";
import { PosterArt } from "./poster-art";

// Latest projects as six tall strips (Ika's Claude Design). The first stands open; pointing at (or
// tabbing to) another opens that one and dims the rest. Collapsed strips show the title on its
// side. On phones they're a row of cards to swipe, the still on top and the text under it (Ika,
// 2026-10-20).
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
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:h-130 md:snap-none md:gap-2.5 md:overflow-visible md:px-0"
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
                "flex w-[85%] min-w-0 shrink-0 snap-start md:w-auto md:shrink md:basis-0 md:transition-[flex-grow,filter] md:duration-strip md:ease-glide",
                on ? "md:grow-6" : "md:grow",
                engaged && !on && "md:brightness-85 md:saturate-50",
              )}
            >
              <button
                type="button"
                // Film pages open with Explore (February 2027): the strip opens up, nothing more.
                aria-disabled="true"
                onPointerEnter={(e) => isMouse(e) && show()}
                onFocus={show}
                aria-label={`${film.title} by ${film.director}, latest project. Film pages open in February 2027.`}
                className="group relative flex w-full flex-col rounded-xl text-left text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50 md:block md:h-full md:overflow-hidden md:text-white"
              >
                {/* Phones: a card, the still on top. Larger screens: the still fills the strip. */}
                <span className="relative block aspect-[16/10] overflow-hidden rounded-xl md:absolute md:inset-0 md:aspect-auto md:rounded-none">
                  <PosterArt
                    film={film}
                    still
                    position={item.position}
                    sizes="(min-width: 48rem) 60vw, 85vw"
                    className={cn("transition-transform duration-zoom ease-glide motion-reduce:scale-100", on && "md:scale-106")}
                  />
                  <span aria-hidden className="absolute inset-0 bg-linear-to-b from-transparent from-35% to-black/70 max-md:hidden" />
                </span>
                <span
                  aria-hidden
                  className={cn(
                    "absolute bottom-5 left-1/2 -translate-x-1/2 rotate-180 whitespace-nowrap text-sm font-semibold drop-shadow-md transition-opacity duration-base ease-out [writing-mode:vertical-rl] max-md:hidden",
                    on && "opacity-0",
                  )}
                >
                  {film.title}
                </span>
                {/* Phones: the text sits under the still. Larger screens: over it, on the open strip. */}
                <span
                  className={cn(
                    "flex flex-col items-start gap-2 pt-3 transition-[opacity,transform] duration-lift ease-glide md:absolute md:inset-x-8 md:bottom-8 md:min-w-90 md:gap-3 md:pt-0",
                    on ? "md:delay-150" : "md:translate-y-3.5 md:opacity-0",
                  )}
                >
                  <span className="inline-flex h-6 items-center rounded-full border border-border px-2.5 text-micro font-semibold md:border-white/70">
                    Latest project
                  </span>
                  <span className="text-lead leading-tight font-semibold tracking-tight md:text-display md:drop-shadow-md">
                    Step inside the world of {film.title}
                  </span>
                  <span className="text-small text-muted-foreground md:text-sm md:text-white/90">
                    {film.director}&rsquo;s latest &mdash; explore behind-the-scenes breakdowns, call sheets, and production docs
                  </span>
                  <span className="mt-1 inline-flex h-9 items-center gap-2 rounded-full border border-border px-4 text-small font-medium md:mt-0 md:border-white">
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
