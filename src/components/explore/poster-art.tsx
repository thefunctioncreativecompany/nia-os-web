import Image from "next/image";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { grainFor, type Film } from "./explore-data";

// A film's picture: its poster, or its still (`still`), falling back to the other one and then to a
// grain gradient. Fills the nearest positioned parent.
export function PosterArt({
  film,
  still = false,
  position,
  sizes,
  className,
}: {
  film: Film;
  still?: boolean;
  position?: string;
  sizes: string;
  className?: string;
}) {
  const src = still ? (film.stillUrl ?? film.posterUrl) : (film.posterUrl ?? film.stillUrl);
  return (
    <span aria-hidden className={cn("absolute inset-0 block bg-muted", !src && grainFor(film.id), className)}>
      {src && <Image src={src} alt="" fill sizes={sizes} className="object-cover" style={{ objectPosition: position }} />}
    </span>
  );
}

// Film pages, press kits and documents arrive when Explore opens; until then a click says so.
export function opensLater() {
  toast("Film pages open with Explore in February 2027.");
}
