import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { InfoNote } from "@/components/nia/info-note";
import { ScrollRow } from "@/components/nia/scroll-row";
import { shuffled } from "@/lib/shuffle";
import { CREATORS, CREATORS_HREF, creatorFilms } from "@/features/explore/creators";
import { creatorItems } from "@/features/explore/items";
import { ExploreCard, cardSpan } from "./title-card";

// Creators on Explore (Ika, 2026-10-21): commercials, fashion films, music videos and shorts by
// independent creators and studios, in one still row under By category (after Made in Africa, Ika
// 2026-10-21) so Explore reads as being for creators as much as filmmakers. Landscape films get
// wider cards. View all opens every film with search (Ika, 2026-10-22).
export function CreatorsStrip({ seed }: { seed: number }) {
  return (
    <section aria-labelledby="creators-title" className="mt-7">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <h3 id="creators-title" className="text-subtitle font-semibold text-foreground">
              {CREATORS.name}
            </h3>
            <CreatorCredit />
          </div>
          <p className="mt-1 max-w-160 text-sm text-muted-foreground">{CREATORS.description}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={CREATORS_HREF}>
            View all {creatorFilms.length}
            <ArrowRight aria-hidden data-icon="inline-end" />
          </Link>
        </Button>
      </div>
      <ScrollRow label={CREATORS.name}>
        {shuffled(creatorItems(), seed).map((item) => (
          <li key={item.slug} className="w-[calc(44%*var(--span,1))] flex-none snap-start sm:w-[calc(30%*var(--span,1))] md:w-[calc(22%*var(--span,1))] lg:w-[calc(18%*var(--span,1))]" style={cardSpan(item)}>
            <ExploreCard item={item} href={item.href()} sizes="(min-width: 64rem) 18vw, (min-width: 40rem) 30vw, 44vw" />
          </li>
        ))}
      </ScrollRow>
    </section>
  );
}

// Where creators' films and credits come from (Ika, 2026-10-21: say so plainly during beta), behind
// a small (i) button like the TMDB credit (Ika, 2026-10-22).
export function CreatorCredit({ className }: { className?: string }) {
  return (
    <InfoNote label="Where these films come from" className={className}>
      <p>
        Films play from Instagram, posted by the people who made them, and credits come from each post&rsquo;s caption. They&rsquo;re shown for
        educational purposes while Nia is in beta testing, and Nia earns no revenue from them.
      </p>
    </InfoNote>
  );
}
