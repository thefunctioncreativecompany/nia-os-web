import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollRow } from "@/components/nia/scroll-row";
import { HOLLYWOOD_CLASSICS, HOLLYWOOD_CLASSICS_HREF, hollywoodClassics, titleHref } from "@/features/explore/made-in-africa";
import { TitleCard } from "./title-card";
import { TmdbCredit } from "./tmdb-credit";

// Hollywood Classics on Explore (Ika, 2026-10-29): all 30 titles as equal cards in one still
// row, like Made in Africa, in release order (1939 to 1979) so the row reads as film history.
export function HollywoodClassicsStrip({ bare = false }: { bare?: boolean }) {
  return (
    <section aria-labelledby="hollywood-classics-title" className={bare ? undefined : "mt-7"}>
      {bare ? (
        <h3 id="hollywood-classics-title" className="sr-only">
          {HOLLYWOOD_CLASSICS.name}
        </h3>
      ) : (
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <h3 id="hollywood-classics-title" className="text-subtitle font-semibold text-foreground">
                {HOLLYWOOD_CLASSICS.name}
              </h3>
              <TmdbCredit />
            </div>
            <p className="mt-1 max-w-160 text-sm text-muted-foreground">{HOLLYWOOD_CLASSICS.description}</p>
          </div>
          <Button variant="outline" asChild>
            <Link href={HOLLYWOOD_CLASSICS_HREF}>
              View all {hollywoodClassics.length}
              <ArrowRight aria-hidden data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      )}
      <ScrollRow label={HOLLYWOOD_CLASSICS.name}>
        {hollywoodClassics.map((e) => (
          <li key={e.title.slug} className="w-[44%] flex-none snap-start sm:w-[30%] md:w-[22%] lg:w-[18%]">
            <TitleCard entry={e} href={titleHref(e.title.slug)} sizes="(min-width: 64rem) 18vw, (min-width: 40rem) 30vw, 44vw" />
          </li>
        ))}
      </ScrollRow>
    </section>
  );
}
