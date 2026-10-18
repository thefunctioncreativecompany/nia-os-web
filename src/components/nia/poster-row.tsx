import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export type Poster = { id: string; title: string; kind: string; src: StaticImageData | string; href: string };

// A titled row of tall poster cards that scrolls sideways (Figma "Explore Section").
export function PosterRow({
  title,
  href,
  posters,
  className,
}: {
  title: string;
  href?: string;
  posters: Poster[];
  className?: string;
}) {
  return (
    <section aria-label={title} className={cn("flex flex-col gap-4", className)}>
      {href ? (
        <Link href={href} className="flex w-fit items-center gap-1.5 rounded-sm text-h3 font-bold text-foreground outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50">
          {title}
          <ChevronRight aria-hidden className="size-5" />
        </Link>
      ) : (
        <h3 className="text-h3 font-bold text-foreground">{title}</h3>
      )}
      <ul className="-mx-1 flex snap-x gap-5 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
        {posters.map((poster) => (
          <li key={poster.id} className="w-44 shrink-0 snap-start md:w-52">
            <Link href={poster.href} className="group flex flex-col gap-2 rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
              <span className="relative block aspect-[2/3] overflow-hidden rounded-xl bg-muted">
                <Image src={poster.src} alt="" fill sizes="208px" className="object-cover transition-transform duration-base ease-out group-hover:scale-[1.03]" />
              </span>
              <span className="text-sm font-bold text-foreground">{poster.title}</span>
              <span className="-mt-1 text-small text-muted-foreground">{poster.kind}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
