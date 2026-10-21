import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { coverFor, metaLine, type Entry } from "@/features/explore/made-in-africa";

// A Made in Africa title as a 3:4 poster (Ika's Claude Design "05 · Filmstrip scrub"): its cover
// when Ika has given one (the title and director show on hover or focus), otherwise a typographic
// poster on the title's grain gradient. Opens the title's page.
export function TitlePoster({
  entry,
  href,
  number,
  sizes,
  first = false,
  className,
}: {
  entry: Entry;
  href: string;
  /** Its place in the strip ("01"), top left. */
  number?: number;
  sizes: string;
  /** The page's main picture: fetched straight away. */
  first?: boolean;
  className?: string;
}) {
  const { title, grain } = entry;
  const cover = coverFor(title.slug);
  return (
    <Link
      href={href}
      aria-label={`${title.title}, ${metaLine(title)}${title.credit ? `, ${title.credit}` : ""}`}
      className={cn(
        "group relative block aspect-[3/4] overflow-hidden rounded-xl outline-none transition-shadow duration-base ease-out hover:shadow-card-hover focus-visible:ring-3 focus-visible:ring-ring/50",
        cover ? "bg-muted text-white" : grain,
        className,
      )}
    >
      {cover && (
        <Image
          src={cover}
          alt=""
          fill
          sizes={sizes}
          // Posters are text-heavy artwork: the higher quality keeps their lettering sharp.
          quality={90}
          loading={first ? "eager" : undefined}
          fetchPriority={first ? "high" : undefined}
          className="object-cover"
        />
      )}
      {number !== undefined && (
        <span aria-hidden className={cn("absolute top-3 left-3.5 text-caption font-semibold", cover && "drop-shadow-md")}>
          {String(number).padStart(2, "0")}
        </span>
      )}
      <span
        aria-hidden
        className={cn(
          "absolute inset-x-0 bottom-0 flex flex-col gap-1 px-4 pb-4",
          cover &&
            "bg-linear-to-b from-transparent to-black/75 pt-14 opacity-0 transition-opacity duration-base ease-out group-hover:opacity-100 group-focus-visible:opacity-100",
        )}
      >
        <span className={cn("font-bold tracking-tight", cover ? "text-lead" : "text-h3 leading-tight")}>{title.title}</span>
        <span className="text-caption opacity-85">{metaLine(title)}</span>
        {!cover && title.credit && <span className="text-caption opacity-85">{title.credit}</span>}
      </span>
    </Link>
  );
}
