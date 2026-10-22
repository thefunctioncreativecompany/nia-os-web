import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";
import type { ExploreItem } from "@/features/explore/items";
import { coverFor, metaLine, type Entry } from "@/features/explore/made-in-africa";

// An Explore card (Ika, 2026-10-21: equal cards, like the Top 10 press kits, without numbers): the
// cover, then the title and who made it. Without a cover it gets a typographic poster on its
// grain gradient. A creator's film carries its type in the corner. Opens the item's page.
// A landscape creator's film keeps its shape (Ika, 2026-10-21): a wider card in rows, or the whole
// frame on a blurred fill where every cell is poster-shaped (grids).

/** A poster's shape, width ÷ height. */
const POSTER = 268 / 373;

/** For a row's cell: a landscape card is as tall as the posters beside it, so its cell is wider
 * by this much. Cells size themselves as `w-[calc(30%*var(--span,1))]`. */
export function cardSpan(item: ExploreItem): CSSProperties | undefined {
  return item.aspect ? ({ "--span": item.aspect / POSTER } as CSSProperties) : undefined;
}

/** A landscape picture in a poster-shaped frame: the whole picture, on a blurred copy of itself. */
export function FramedStill({ src, sizes, draggable }: { src: string; sizes: string; draggable?: boolean }) {
  return (
    <>
      <Image src={src} alt="" fill sizes={sizes} draggable={draggable} className="pointer-events-none scale-125 object-cover blur-xl" />
      <Image src={src} alt="" fill sizes={sizes} quality={90} draggable={draggable} className="pointer-events-none object-contain" />
    </>
  );
}

export function TitleCard({
  entry,
  href,
  sizes,
  first = false,
  actions,
}: {
  entry: Entry;
  href: string;
  sizes: string;
  first?: boolean;
  /** Buttons under the card (Add to project, Remove), kept outside its link. */
  actions?: React.ReactNode;
}) {
  const { title, grain } = entry;
  return (
    <PosterCard
      href={href}
      title={title.title}
      credit={title.credit ?? metaLine(title)}
      label={`${title.title}, ${metaLine(title)}${title.credit ? `, ${title.credit}` : ""}`}
      image={coverFor(title.slug)}
      grain={grain}
      sizes={sizes}
      first={first}
      actions={actions}
    />
  );
}

/** The same card for any Explore item (a title or a creator's film). In a grid, pass
 * `shape="poster"` so landscape films fit the grid's poster-shaped cells. */
export function ExploreCard({
  item,
  href,
  sizes,
  first = false,
  actions,
  shape = "film",
}: {
  item: ExploreItem;
  href: string;
  sizes: string;
  first?: boolean;
  actions?: React.ReactNode;
  shape?: "film" | "poster";
}) {
  return (
    <PosterCard
      href={href}
      title={item.title}
      credit={item.credit}
      label={`${item.title}, ${item.meta}, ${item.credit}`}
      image={item.image}
      grain={item.grain}
      badge={item.badge}
      aspect={item.aspect}
      shape={shape}
      sizes={sizes}
      first={first}
      actions={actions}
    />
  );
}

function PosterCard({
  href,
  title,
  credit,
  label,
  image,
  grain,
  badge,
  aspect,
  shape = "film",
  sizes,
  first,
  actions,
}: {
  href: string;
  title: string;
  credit: string;
  label: string;
  image: string | null;
  grain: string;
  badge?: string;
  aspect?: number;
  shape?: "film" | "poster";
  sizes: string;
  first: boolean;
  actions?: React.ReactNode;
}) {
  const framed = Boolean(aspect && image && shape === "poster");
  const card = (
    <Link href={href} aria-label={label} className="group flex w-full flex-col gap-2 rounded-lg text-left text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
      <span
        className={cn(
          "relative block overflow-hidden rounded-lg transition-[transform,box-shadow] duration-lift ease-glide group-hover:-translate-y-1 group-hover:shadow-card-hover group-focus-visible:-translate-y-1 motion-reduce:translate-y-0!",
          image ? "bg-muted" : grain,
        )}
        style={{ aspectRatio: aspect && shape === "film" ? aspect : POSTER }}
      >
        {image && framed ? (
          <FramedStill src={image} sizes={sizes} />
        ) : image ? (
          <Image
            src={image}
            alt=""
            fill
            sizes={sizes}
            // Posters are text-heavy artwork: the higher quality keeps their lettering sharp.
            quality={90}
            loading={first ? "eager" : undefined}
            fetchPriority={first ? "high" : undefined}
            className="object-cover"
          />
        ) : (
          <span aria-hidden className="absolute inset-x-0 bottom-0 p-4 text-h3 leading-tight font-bold tracking-tight">
            {title}
          </span>
        )}
        {badge && <span className="absolute top-2.5 left-2.5 rounded-full bg-white/90 px-2.5 py-1 text-micro font-semibold text-foreground">{badge}</span>}
      </span>
      <span className="truncate text-lead font-semibold">{title}</span>
      <span className="-mt-1.5 truncate text-small text-muted-foreground">{credit}</span>
    </Link>
  );
  if (!actions) return card;
  return (
    <div className="flex flex-col gap-2.5">
      {card}
      <div className="flex flex-wrap gap-1.5">{actions}</div>
    </div>
  );
}
