"use client";

import { useState } from "react";
import { Play } from "lucide-react";

import { cn } from "@/lib/utils";
import { getFilm, type Category, type CategoryItem } from "./explore-data";
import { PosterArt } from "./poster-art";
import { PressKitPreview } from "./press-kit-preview";

// Seconds for each column to slide once round (Ika's Claude Design).
const SPEEDS = [58, 74, 50, 82, 64];
// Each column holds its cards this many times: two halves, so sliding half its height loops
// without a seam, each half tall enough to fill the column.
const COPIES = 4;

// Top 10 press kits in five columns that scroll forever, alternate columns the other way (as
// designed). Pointing at a column, or tabbing into it, pauses it and dims its other cards. Only the
// first set of cards can be reached by keyboard or screen reader. Reduced motion stops the columns;
// phones get a plain two-column grid. Choosing a card opens its press-kit preview.
export function EpkLanes({ category }: { category: Category }) {
  const perLane = Math.ceil(category.items.length / SPEEDS.length);
  const [open, setOpen] = useState<CategoryItem | null>(null);

  return (
    <section aria-labelledby={`${category.id}-title`} className="mt-7">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <h3 id={`${category.id}-title`} className="text-subtitle font-semibold text-foreground">
          {category.title}
        </h3>
        <span className="text-sm text-muted-foreground max-sm:hidden">Hover a column to pause</span>
      </div>
      <div className="grid grid-cols-2 gap-3.25 sm:flex sm:h-160 sm:overflow-hidden sm:[mask-image:linear-gradient(transparent,black_8%,black_92%,transparent)]">
        {SPEEDS.map((speed, c) => {
          const items = category.items.slice(c * perLane, (c + 1) * perLane);
          return (
            <div key={c} className="group/lane contents sm:block sm:min-w-0 sm:flex-1 sm:overflow-hidden sm:px-1">
              <div
                style={{ animationDuration: `${speed}s` }}
                className={cn(
                  "contents sm:flex sm:flex-col sm:gap-3.25 sm:pb-3.25 sm:group-focus-within/lane:[animation-play-state:paused] sm:group-hover/lane:[animation-play-state:paused]",
                  c % 2 ? "sm:animate-lane-down" : "sm:animate-lane-up",
                )}
              >
                {Array.from({ length: COPIES }, (_, copy) => (
                  <div
                    key={copy}
                    aria-hidden={copy > 0 || undefined}
                    inert={copy > 0}
                    className={cn("contents sm:flex sm:flex-col sm:gap-3.25", copy > 0 && "max-sm:hidden")}
                  >
                    {items.map((item) => (
                      <EpkCard key={item.filmId} item={item} onOpen={() => setOpen(item)} />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {open && <PressKitPreview item={open} list={category.items} onNavigate={setOpen} onClose={() => setOpen(null)} />}
    </section>
  );
}

function EpkCard({ item, onOpen }: { item: CategoryItem; onOpen: () => void }) {
  const film = getFilm(item.filmId);
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      aria-label={`Number ${item.rank}: ${film.title} press kit, ${film.director}`}
      className="flex flex-none flex-col gap-2 rounded-lg text-left text-foreground outline-none transition-[opacity,transform] duration-glide ease-glide focus-visible:ring-3 focus-visible:ring-ring/50 sm:group-focus-within/lane:opacity-45 sm:group-hover/lane:opacity-45 sm:hover:scale-103 sm:hover:opacity-100! sm:focus-visible:opacity-100! motion-reduce:hover:scale-100"
    >
      <span className="relative block aspect-[268/373] overflow-hidden rounded-lg">
        <PosterArt film={film} sizes="(min-width: 40rem) 20vw, 50vw" />
        <span className="absolute top-1.5 left-3 text-rank font-bold text-white drop-shadow-md">{item.rank}</span>
        <span className="absolute right-2.5 bottom-2.5 inline-flex h-6 items-center gap-1.5 rounded-full bg-black/60 px-2.25 text-micro font-semibold text-white">
          <Play aria-hidden className="size-2 fill-current" />
          EPK
        </span>
      </span>
      <span className="text-lead font-semibold">{film.title}</span>
      <span className="-mt-1.5 text-small text-muted-foreground">{film.director}</span>
    </button>
  );
}
