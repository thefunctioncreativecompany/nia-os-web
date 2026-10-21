import Image from "next/image";

import { cn } from "@/lib/utils";
import { grainFor, type Film } from "./explore-data";

// A film's picture: its poster, or its still (`still`), falling back to the other one and then to a
// grain gradient. Fills the nearest positioned parent.
export function PosterArt({
  film,
  still = false,
  position,
  sizes,
  first = false,
  className,
}: {
  film: Film;
  still?: boolean;
  position?: string;
  sizes: string;
  /** The page's main picture: fetched straight away, ahead of the rest. */
  first?: boolean;
  className?: string;
}) {
  const src = still ? (film.stillUrl ?? film.posterUrl) : (film.posterUrl ?? film.stillUrl);
  return (
    <span aria-hidden className={cn("absolute inset-0 block bg-muted", !src && grainFor(film.id), className)}>
      {src && <Image src={src} alt="" fill sizes={sizes} loading={first ? "eager" : undefined} fetchPriority={first ? "high" : undefined} className="object-cover" style={{ objectPosition: position }} />}
    </span>
  );
}
