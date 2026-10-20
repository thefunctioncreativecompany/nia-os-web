"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useReducedMotion } from "motion/react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { DirectorsNotes } from "./directors-notes";
import { EpkLanes } from "./epk-lanes";
import { getCategory, getFilm, type Film } from "./explore-data";
import { LatestStrips } from "./latest-strips";
import { PosterArt, opensLater } from "./poster-art";

const CHIPS = ["All", "Most popular", "Genres", "Crew", "Directors", "Rating"] as const;
const SORTS = { popular: "Most popular", title: "Title A–Z", director: "Director A–Z" } as const;
type Sort = keyof typeof SORTS;

// How far each of the five columns slides as the pointer moves down the grid (EXPLORE_SPEC.md),
// in pixels between the top and bottom of the grid. Odd columns also sit higher.
const DRIFT = [-50, 40, -80, 30, -45];
const ODD_OFFSET = -60;

const pill =
  "inline-flex h-9 items-center gap-2.5 rounded-full border px-4 text-sm font-medium outline-none transition-colors duration-fast focus-visible:ring-3 focus-visible:ring-ring/50";

// Explore, the library: Ika's Claude Design "ExploreLibrary" as designed (layout, motion, images),
// in the platform's font, colours, buttons and sentence case. Drawn from explore-data.ts.
export function ExploreLibrary() {
  const [chip, setChip] = useState<(typeof CHIPS)[number]>("All");
  const [sort, setSort] = useState<Sort>("popular");

  const films = useMemo(() => {
    const list = getCategory("grid").items.map((item) => getFilm(item.filmId));
    if (sort === "title") return list.toSorted((a, b) => a.title.localeCompare(b.title));
    if (sort === "director") return list.toSorted((a, b) => a.director.localeCompare(b.director));
    return list;
  }, [sort]);

  return (
    <div className="flex w-full flex-col px-4 pt-10 pb-24 md:px-7.5 lg:pt-12.5">
      <div className="flex items-center gap-3.5">
        <h1 id="explore-all" className="text-h2 font-semibold tracking-tight text-foreground">
          Explore all
        </h1>
        <ChevronRight aria-hidden className="size-5.5" strokeWidth={2} />
      </div>

      <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
        <div role="group" aria-label="Show" className="flex flex-wrap gap-2.25">
          {CHIPS.map((option) => {
            const on = chip === option;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={on}
                onClick={() => setChip(option)}
                className={cn(
                  pill,
                  on ? "border-foreground bg-foreground text-primary-foreground" : "border-border bg-white text-foreground hover:border-ring",
                )}
              >
                {option}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className={cn(pill, "border-border bg-white pr-3.5 text-foreground hover:border-ring")}>
                {SORTS[sort]}
                <ChevronDown aria-hidden className="size-3.5" strokeWidth={2} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup value={sort} onValueChange={(value) => setSort(value as Sort)}>
                {(Object.keys(SORTS) as Sort[]).map((key) => (
                  <DropdownMenuRadioItem key={key} value={key}>
                    {SORTS[key]}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ExploreAllGrid films={films} />

      <div className="mt-14 flex items-center gap-3">
        <h2 className="text-h3 font-semibold text-foreground">By category</h2>
        <ChevronRight aria-hidden className="size-5" strokeWidth={2} />
      </div>

      <EpkLanes category={getCategory("epk")} />
      <DirectorsNotes category={getCategory("notes")} />
      <LatestStrips category={getCategory("latest")} />
    </div>
  );
}

// Five columns of posters that drift apart as the pointer moves down them (wide screens only).
// Phones and tablets get a plain two- or three-column grid of the same posters.
function ExploreAllGrid({ films }: { films: Film[] }) {
  const reduce = useReducedMotion();
  const [pointerY, setPointerY] = useState(0.5);
  const frame = useRef(0);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const onMove = (e: React.PointerEvent<HTMLElement>) => {
    if (reduce || e.pointerType !== "mouse") return;
    const box = e.currentTarget.getBoundingClientRect();
    const y = (e.clientY - box.top) / box.height;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => setPointerY(y));
  };
  const onLeave = () => {
    cancelAnimationFrame(frame.current);
    setPointerY(0.5);
  };

  return (
    <section
      aria-labelledby="explore-all"
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="mt-15 lg:-mx-1.5 lg:h-295 lg:overflow-hidden lg:px-1.5"
    >
      <div className="grid grid-cols-2 gap-3.25 sm:grid-cols-3 lg:flex lg:items-start lg:pt-2.5">
        {DRIFT.map((drift, c) => {
          const y = (reduce ? 0 : (pointerY - 0.5) * drift) + (c % 2 ? ODD_OFFSET : 0);
          return (
            <div
              key={c}
              style={{ transform: `translate3d(0, ${y.toFixed(1)}px, 0)` }}
              className="contents lg:flex lg:min-w-0 lg:flex-1 lg:flex-col lg:gap-3.25 lg:transition-transform lg:duration-drift lg:ease-glide"
            >
              {films
                .filter((_, i) => i % DRIFT.length === c)
                .map((film) => (
                  <PosterTile key={film.id} film={film} />
                ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// Lifts and shows the title and director on hover or keyboard focus.
function PosterTile({ film }: { film: Film }) {
  return (
    <button
      type="button"
      onClick={opensLater}
      aria-label={`${film.title}, ${film.director}`}
      className="group relative block aspect-[268/373] w-full overflow-hidden rounded-lg text-left text-white outline-none transition-[transform,box-shadow] duration-lift ease-glide hover:-translate-y-1.5 hover:shadow-card-hover focus-visible:-translate-y-1.5 focus-visible:shadow-card-hover focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:hover:translate-y-0 motion-reduce:focus-visible:translate-y-0"
    >
      <PosterArt film={film} sizes="(min-width: 64rem) 20vw, (min-width: 40rem) 33vw, 50vw" />
      <span className="absolute inset-x-0 bottom-0 flex flex-col gap-0.5 bg-linear-to-b from-transparent to-black/75 px-3.5 pt-10 pb-3.5 opacity-0 transition-opacity duration-base ease-out group-hover:opacity-100 group-focus-visible:opacity-100">
        <span className="text-lead font-semibold">{film.title}</span>
        <span className="text-caption text-white/85">{film.director}</span>
      </span>
    </button>
  );
}
