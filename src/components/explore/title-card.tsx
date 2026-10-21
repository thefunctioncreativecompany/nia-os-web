import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { coverFor, metaLine, type Entry } from "@/features/explore/made-in-africa";

// A Made in Africa title as a card (Ika, 2026-10-21: equal cards, like the Top 10 press kits,
// without numbers): its official cover, then the title and who made it. A title without a cover
// gets a typographic poster on its grain gradient. Opens the title's page.
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
  const card = <TitleCardLink entry={entry} href={href} sizes={sizes} first={first} />;
  if (!actions) return card;
  return (
    <div className="flex flex-col gap-2.5">
      {card}
      <div className="flex flex-wrap gap-1.5">{actions}</div>
    </div>
  );
}

function TitleCardLink({ entry, href, sizes, first }: { entry: Entry; href: string; sizes: string; first: boolean }) {
  const { title, grain } = entry;
  const cover = coverFor(title.slug);
  return (
    <Link
      href={href}
      aria-label={`${title.title}, ${metaLine(title)}${title.credit ? `, ${title.credit}` : ""}`}
      className="group flex w-full flex-col gap-2 rounded-lg text-left text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span
        className={cn(
          "relative block aspect-[268/373] overflow-hidden rounded-lg transition-[transform,box-shadow] duration-lift ease-glide group-hover:-translate-y-1 group-hover:shadow-card-hover group-focus-visible:-translate-y-1 motion-reduce:translate-y-0!",
          cover ? "bg-muted" : grain,
        )}
      >
        {cover ? (
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
        ) : (
          <span aria-hidden className="absolute inset-x-0 bottom-0 p-4 text-h3 leading-tight font-bold tracking-tight">
            {title.title}
          </span>
        )}
      </span>
      <span className="truncate text-lead font-semibold">{title.title}</span>
      <span className="-mt-1.5 truncate text-small text-muted-foreground">{title.credit ?? metaLine(title)}</span>
    </Link>
  );
}
