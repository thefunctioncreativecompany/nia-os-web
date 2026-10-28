"use client";

import { useState } from "react";
import { Play } from "lucide-react";

import { ScrollRow } from "@/components/nia/scroll-row";
import { getFilm, type Category, type CategoryItem } from "./explore-data";
import { PosterArt } from "./poster-art";
import { PressKitPreview } from "./press-kit-preview";

// Top 10 press kits as one still row, number 1 on the left to 10 on the right (Ika, 2026-10-21;
// it was five columns that scrolled on their own). Swipe, scroll or use the arrows. Choosing a
// card opens its press-kit preview.
export function EpkLanes({ category, bare = false }: { category: Category; bare?: boolean }) {
  const [open, setOpen] = useState<CategoryItem | null>(null);

  return (
    <section aria-labelledby={`${category.id}-title`} className={bare ? undefined : "mt-12"}>
      <h3 id={`${category.id}-title`} className={bare ? "sr-only" : "mb-4 text-subtitle font-semibold text-foreground"}>
        {category.title}
      </h3>
      <ScrollRow label={category.title}>
        {category.items.map((item) => (
          <li key={item.filmId} className="w-[44%] flex-none snap-start sm:w-[30%] md:w-[22%] lg:w-[18%]">
            <EpkCard item={item} onOpen={() => setOpen(item)} />
          </li>
        ))}
      </ScrollRow>
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
      className="group flex w-full flex-col gap-2 rounded-lg text-left text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span className="relative block aspect-[268/373] overflow-hidden rounded-lg transition-[transform,box-shadow] duration-lift ease-glide group-hover:-translate-y-1 group-hover:shadow-card-hover group-focus-visible:-translate-y-1 motion-reduce:translate-y-0!">
        <PosterArt film={film} sizes="(min-width: 64rem) 18vw, (min-width: 40rem) 30vw, 44vw" />
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
