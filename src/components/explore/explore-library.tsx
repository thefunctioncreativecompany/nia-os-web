"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { DriftColumns } from "@/components/nia/drift-columns";
import { ChipMenu, FilterChip } from "@/components/nia/filter-bar";
import { LIBRARY_HREF } from "@/features/explore/made-in-africa";
import { CreatorsStrip } from "./creators-strip";
import { DirectorsNotes } from "./directors-notes";
import { EpkLanes } from "./epk-lanes";
import { getCategory, getFilm, type CategoryItem, type Film } from "./explore-data";
import { LatestStrips } from "./latest-strips";
import { MadeInAfricaStrip } from "./made-in-africa-strip";
import { PosterArt } from "./poster-art";
import { PressKitPreview } from "./press-kit-preview";

const CHIPS = ["All", "Most popular", "Genres", "Crew", "Directors", "Rating"] as const;
const SORTS = { popular: "Most popular", title: "Title A–Z", director: "Director A–Z" } as const;
type Sort = keyof typeof SORTS;

// How far each of the five columns slides as the pointer moves down the grid (EXPLORE_SPEC.md),
// in pixels between the top and bottom of the grid. Odd columns also sit higher.
const DRIFT = [-50, 40, -80, 30, -45];
const ODD_OFFSET = -60;

// Explore, the library: Ika's Claude Design "ExploreLibrary" as designed (layout, motion, images),
// in the platform's font, colours, buttons and sentence case. Drawn from explore-data.ts. The
// rows under By category come in a new order on each visit (`seed`, Ika 2026-10-22).
export function ExploreLibrary({ seed }: { seed: number }) {
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
      {/* Opens the whole library as one canvas (Ika, 2026-10-21). */}
      <h1 id="explore-all" className="text-h2 font-semibold tracking-tight text-foreground">
        <Link
          href={LIBRARY_HREF}
          className="group inline-flex items-center gap-3.5 rounded-md outline-none hover:text-foreground/80 focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Explore all
          <ChevronRight aria-hidden className="size-5.5 transition-transform duration-fast ease-out group-hover:translate-x-1 motion-reduce:translate-x-0!" strokeWidth={2} />
        </Link>
      </h1>

      <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
        <div role="group" aria-label="Show" className="flex flex-wrap gap-2">
          {CHIPS.map((option) => (
            <FilterChip key={option} on={chip === option} onClick={() => setChip(option)}>
              {option}
            </FilterChip>
          ))}
        </div>
        <ChipMenu label="Sort" value={sort} align="end" options={(Object.keys(SORTS) as Sort[]).map((key) => ({ value: key, label: SORTS[key] }))} onChange={setSort} />
      </div>

      <ExploreAllGrid films={films} />

      <div className="mt-14 flex items-center gap-3">
        <h2 className="text-h3 font-semibold text-foreground">By category</h2>
        <ChevronRight aria-hidden className="size-5" strokeWidth={2} />
      </div>

      <MadeInAfricaStrip seed={seed} />
      <CreatorsStrip seed={seed} />
      <EpkLanes category={getCategory("epk")} />
      <DirectorsNotes category={getCategory("notes")} />
      <LatestStrips category={getCategory("latest")} />
    </div>
  );
}

// Five columns of posters that drift apart as the pointer moves down them (wide screens only).
// Phones and tablets get a plain two- or three-column grid of the same posters.
function ExploreAllGrid({ films }: { films: Film[] }) {
  const [open, setOpen] = useState<CategoryItem | null>(null);
  // The preview steps through the films in the order shown.
  const list: CategoryItem[] = films.map((f) => ({ filmId: f.id }));
  return (
    <>
      <DriftColumns
        label="Explore all"
        items={films}
        getKey={(film) => film.id}
        renderItem={(film) => <PosterTile film={film} first={film.id === films[0]?.id} onOpen={() => setOpen({ filmId: film.id })} />}
        drift={DRIFT}
        oddOffset={ODD_OFFSET}
        className="mt-15 lg:-mx-1.5 lg:h-295 lg:overflow-hidden lg:px-1.5"
        gridClassName="grid-cols-2 gap-3.25 sm:grid-cols-3 lg:pt-2.5"
        columnClassName="lg:gap-3.25"
      />
      {open && <PressKitPreview item={open} list={list} onNavigate={setOpen} onClose={() => setOpen(null)} actionLabel={() => "Open film page"} />}
    </>
  );
}

// Lifts and shows the title and director on hover or keyboard focus.
function PosterTile({ film, first, onOpen }: { film: Film; first: boolean; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      aria-label={`${film.title}, ${film.director}`}
      className="group relative block aspect-[268/373] w-full overflow-hidden rounded-lg text-left text-white outline-none transition-[transform,box-shadow] duration-lift ease-glide hover:-translate-y-1.5 hover:shadow-card-hover focus-visible:-translate-y-1.5 focus-visible:shadow-card-hover focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:hover:translate-y-0 motion-reduce:focus-visible:translate-y-0"
    >
      <PosterArt film={film} first={first} sizes="(min-width: 64rem) 20vw, (min-width: 40rem) 33vw, 50vw" />
      <span className="absolute inset-x-0 bottom-0 flex flex-col gap-0.5 bg-linear-to-b from-transparent to-black/75 px-3.5 pt-10 pb-3.5 opacity-0 transition-opacity duration-base ease-out group-hover:opacity-100 group-focus-visible:opacity-100">
        <span className="text-lead font-semibold">{film.title}</span>
        <span className="text-caption text-white/85">{film.director}</span>
      </span>
    </button>
  );
}
