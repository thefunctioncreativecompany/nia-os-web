import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { recognizeAspect } from "@/lib/aspect-ratios";
import type { ExploreItem } from "@/features/explore/items";

/** A poster's shape, width ÷ height (Made in Africa titles have posters, not frames). */
const POSTER = 268 / 373;

export type GalleryEntry = { item: ExploreItem; href: string; actions?: React.ReactNode };

// A gallery of films at their true shape (Ika, 2026-10-22): a 9:16 reel narrow, a 2.39:1 film
// wide, never squeezed into another's frame, because the shape is part of how a filmmaker reads
// the work. Rows of equal height that fill the width (each card grows in proportion to its
// shape, so a row stays one height); the last row keeps its natural size. Tags on the picture
// say what it is and its frame; the title and who made it sit below.
export function FilmGallery({ entries, label, className }: { entries: GalleryEntry[]; label: string; className?: string }) {
  return (
    <ul aria-label={label} className={cn("flex flex-wrap gap-x-4 gap-y-7 [--row:9rem] sm:[--row:12rem] lg:[--row:15rem]", className)}>
      {entries.map(({ item, href, actions }, i) => {
        const aspect = item.aspect ?? POSTER;
        return (
          <li key={item.slug} className="min-w-0" style={{ flexGrow: aspect, flexBasis: `calc(var(--row) * ${aspect})` }}>
            <GalleryCard item={item} href={href} aspect={aspect} first={i === 0} actions={actions} />
          </li>
        );
      })}
      {/* Takes up the last row's spare width, so its films keep the row height. */}
      <li aria-hidden className="grow-[1000]" />
    </ul>
  );
}

function GalleryCard({ item, href, aspect, first, actions }: { item: ExploreItem; href: string; aspect: number; first: boolean; actions?: React.ReactNode }) {
  // Films are tagged with their frame; posters are artwork, not a frame, so they aren't.
  const frame = item.kind === "creator" ? recognizeAspect(aspect).label : null;
  return (
    <div className="flex flex-col gap-2.5">
      <Link href={href} aria-label={`${item.title}, ${item.meta}`} className="group flex flex-col gap-2 rounded-lg text-left text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        <span
          className={cn(
            "relative block w-full overflow-hidden rounded-lg transition-[transform,box-shadow] duration-lift ease-glide group-hover:-translate-y-1 group-hover:shadow-card-hover group-focus-visible:-translate-y-1 motion-reduce:translate-y-0!",
            item.image ? "bg-muted" : item.grain,
          )}
          style={{ aspectRatio: aspect }}
        >
          {item.image ? (
            <Image
              src={item.image}
              alt=""
              fill
              sizes={`(min-width: 64rem) ${Math.ceil(aspect * 21)}rem, (min-width: 40rem) ${Math.ceil(aspect * 17)}rem, ${Math.ceil(aspect * 13)}rem`}
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
        <span className="line-clamp-2 text-lead leading-snug font-semibold">{item.title}</span>
        <span className="-mt-1.5 truncate text-small text-muted-foreground">{item.credit}</span>
      </Link>
      {actions && <div className="flex flex-wrap gap-1.5">{actions}</div>}
    </div>
  );
}
