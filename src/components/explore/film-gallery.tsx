import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { recognizeAspect } from "@/lib/aspect-ratios";
import type { ExploreItem } from "@/features/explore/items";

/** A poster's shape, width ÷ height (Made in Africa titles have posters, not frames). */
const POSTER = 268 / 373;

export type GalleryEntry = { item: ExploreItem; href: string; actions?: React.ReactNode };

// A masonry gallery of films at their true shape (Ika's Claude Design "Creators · Explore: masonry
// gallery (no gaps)", 2026-10-22): columns of equal width, each film as tall as its shape needs,
// stacked with no gaps, so a 9:16 reel stands tall and a 2.39:1 film lies wide, never squeezed into
// another's frame. Tags on the picture say what it is and its frame; the title and who made it
// sit below. Items run down each column in order.
export function FilmGallery({ entries, label, className }: { entries: GalleryEntry[]; label: string; className?: string }) {
  return (
    <ul aria-label={label} className={cn("columns-2 gap-x-5 md:columns-3 lg:columns-4 2xl:columns-5", className)}>
      {entries.map(({ item, href, actions }, i) => (
        <li key={item.slug} className="mb-6 break-inside-avoid">
          <GalleryCard item={item} href={href} aspect={item.aspect ?? POSTER} first={i === 0} actions={actions} />
        </li>
      ))}
    </ul>
  );
}

function GalleryCard({ item, href, aspect, first, actions }: { item: ExploreItem; href: string; aspect: number; first: boolean; actions?: React.ReactNode }) {
  // Films are tagged with their frame; posters are artwork, not a frame, so they aren't.
  const frame = item.kind === "creator" ? recognizeAspect(aspect).label : null;
  return (
    <div className="flex flex-col gap-2.5">
      <Link href={href} aria-label={`${item.title}, ${item.meta}`} className="group flex flex-col gap-2 rounded-xl text-left text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        <span
          className={cn(
            "relative block w-full overflow-hidden rounded-xl transition-[transform,box-shadow] duration-lift ease-glide group-hover:-translate-y-1 group-hover:shadow-card-hover group-focus-visible:-translate-y-1 motion-reduce:translate-y-0!",
            item.image ? "bg-muted" : item.grain,
          )}
          style={{ aspectRatio: aspect }}
        >
          {item.image ? (
            <Image
              src={item.image}
              alt=""
              fill
              sizes="(min-width: 96rem) 20vw, (min-width: 64rem) 25vw, (min-width: 48rem) 33vw, 50vw"
              quality={90}
              loading={first ? "eager" : undefined}
              fetchPriority={first ? "high" : undefined}
              className="object-cover"
            />
          ) : (
            <span aria-hidden className="absolute inset-x-0 bottom-0 p-4 text-h3 leading-tight font-bold tracking-tight">
              {item.title}
            </span>
          )}
          {(item.badge || frame) && (
            <span className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
              {item.badge && <span className="rounded-full bg-white/90 px-2.5 py-1 text-micro font-semibold text-foreground">{item.badge}</span>}
              {frame && (
                <span className="rounded-full bg-foreground/70 px-2.5 py-1 text-micro font-semibold text-background tabular-nums">
                  <span className="sr-only">Frame </span>
                  {frame}
                </span>
              )}
            </span>
          )}
        </span>
        <span className="flex flex-col gap-0.5">
          <span className="text-lead leading-snug font-semibold">{item.title}</span>
          <span className="truncate text-small text-muted-foreground">{item.credit}</span>
        </span>
      </Link>
      {actions && <div className="flex flex-wrap gap-1.5">{actions}</div>}
    </div>
  );
}
