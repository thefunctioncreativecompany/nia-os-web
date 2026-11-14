import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { recognizeAspect } from "@/lib/aspect-ratios";
import type { ExploreItem } from "@/features/explore/items";
import { servedSized } from "@/lib/served-sized";
import { sentenceCase } from "@/lib/sentence-case";

/** A poster's shape, width ÷ height (Made in Africa titles have posters, not frames). */
export const POSTER = 268 / 373;

/** What a card shows: an Explore item without its link-making function (so it can go to the browser). */
export type CardItem = Omit<ExploreItem, "href">;

export type GalleryEntry = { item: ExploreItem; href: string; actions?: React.ReactNode; /** A short line under who made it ("Added 8 November"). */ note?: string };

// A gallery of films at their true shape (Ika's Claude Design "Creators · Explore", 2026-10-22), in
// justified rows (Ika, 2026-11-14: a tall reel beside wide films left big gaps in a grid): every card
// in a row is the same height and as wide as its shape needs, so a 9:16 reel stands narrow and a
// 2.39:1 film lies wide, nothing cropped, and each row fills the width. A filler at the end keeps
// the last row from stretching. Thin gaps between cards (Ika, 2026-11-14). Tags on the picture say what it is and its frame; the title and
// who made it sit below. Items run left to right, row by row, in order.
export function FilmGallery({ entries, label, className }: { entries: GalleryEntry[]; label: string; className?: string }) {
  return (
    <ul aria-label={label} className={cn("flex flex-wrap gap-x-2 gap-y-6 [--row-h:9rem] sm:[--row-h:12rem] lg:[--row-h:15rem] 2xl:[--row-h:17rem]", className)}>
      {entries.map(({ item, href, actions, note }, i) => {
        const aspect = item.aspect ?? POSTER;
        return (
          <li key={item.slug} className="min-w-0" style={{ flexGrow: aspect, flexBasis: `calc(var(--row-h) * ${aspect})` }}>
            <GalleryCard item={item} href={href} aspect={aspect} first={i === 0} actions={actions} note={note} />
          </li>
        );
      })}
      <li aria-hidden className="grow-[100]" />
    </ul>
  );
}

export function GalleryCard({ item, href, aspect, first, actions, note }: { item: CardItem; href: string; aspect: number; first: boolean; actions?: React.ReactNode; note?: string }) {
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
              unoptimized={servedSized(item.image)}
              alt=""
              fill
              sizes="(min-width: 96rem) 20vw, (min-width: 64rem) 25vw, (min-width: 48rem) 33vw, 50vw"
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
              {item.badge && <span className="rounded-full bg-card/90 px-2.5 py-1 text-micro font-semibold text-foreground">{sentenceCase(item.badge)}</span>}
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
          {note && <span className="text-caption text-muted-foreground">{note}</span>}
        </span>
      </Link>
      {actions && <div className="flex flex-wrap gap-1.5">{actions}</div>}
    </div>
  );
}
