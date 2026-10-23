import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollRow } from "@/components/nia/scroll-row";
import { shuffled } from "@/lib/shuffle";
import { MADE_IN_AFRICA, MADE_IN_AFRICA_HREF, madeInAfrica, titleHref } from "@/features/explore/made-in-africa";
import { TitleCard } from "./title-card";
import { TmdbCredit } from "./tmdb-credit";

// How many titles the row shows; View all has the rest (Ika, 2026-10-21).
const SHOWN = 15;

// Made in Africa on Explore (Ika, 2026-10-21): 15 titles as equal cards in one still row, like the
// Top 10 press kits (without numbers), and View all for the full category. A different 15 on each
// visit (Ika, 2026-10-22).
export function MadeInAfricaStrip({ seed }: { seed: number }) {
  return (
    <section aria-labelledby="made-in-africa-title" className="mt-7">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <h3 id="made-in-africa-title" className="text-subtitle font-semibold text-foreground">
              {MADE_IN_AFRICA.name}
            </h3>
            <TmdbCredit />
          </div>
          <p className="mt-1 max-w-160 text-sm text-muted-foreground">{MADE_IN_AFRICA.description}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={MADE_IN_AFRICA_HREF}>
            View all {madeInAfrica.length}
            <ArrowRight aria-hidden data-icon="inline-end" />
          </Link>
        </Button>
      </div>
      <ScrollRow label={MADE_IN_AFRICA.name}>
        {shuffled(madeInAfrica, seed).slice(0, SHOWN).map((e) => (
          <li key={e.title.slug} className="w-[44%] flex-none snap-start sm:w-[30%] md:w-[22%] lg:w-[18%]">
            <TitleCard entry={e} href={titleHref(e.title.slug)} sizes="(min-width: 64rem) 18vw, (min-width: 40rem) 30vw, 44vw" />
          </li>
        ))}
      </ScrollRow>
    </section>
  );
}
