import { ScrollRow } from "@/components/nia/scroll-row";
import { CREATORS } from "@/features/explore/creators";
import { creatorItems } from "@/features/explore/items";
import { ExploreCard, cardSpan } from "./title-card";

// Creators on Explore (Ika, 2026-10-21): commercials, fashion films, music videos and shorts by
// independent creators and studios, in one still row under By category (after Made in Africa, Ika
// 2026-10-21) so Explore reads as being for creators as much as filmmakers. Landscape films get
// wider cards.
export function CreatorsStrip() {
  return (
    <section aria-labelledby="creators-title" className="mt-7">
      <div className="mb-4 min-w-0">
        <h3 id="creators-title" className="text-subtitle font-semibold text-foreground">
          {CREATORS.name}
        </h3>
        <p className="mt-1 max-w-160 text-sm text-muted-foreground">{CREATORS.description}</p>
      </div>
      <ScrollRow label={CREATORS.name}>
        {creatorItems().map((item) => (
          <li key={item.slug} className="w-[calc(44%*var(--span,1))] flex-none snap-start sm:w-[calc(30%*var(--span,1))] md:w-[calc(22%*var(--span,1))] lg:w-[calc(18%*var(--span,1))]" style={cardSpan(item)}>
            <ExploreCard item={item} href={item.href()} sizes="(min-width: 64rem) 18vw, (min-width: 40rem) 30vw, 44vw" />
          </li>
        ))}
      </ScrollRow>
      <CreatorCredit className="mt-2" />
    </section>
  );
}

// Where creators' films and credits come from (Ika, 2026-10-21: say so plainly during beta).
export function CreatorCredit({ className }: { className?: string }) {
  return (
    <p className={`max-w-180 text-caption leading-relaxed text-muted-foreground ${className ?? ""}`}>
      Films play from Instagram, posted by the people who made them, and credits come from each post&rsquo;s caption. They&rsquo;re shown for educational
      purposes while Nia is in beta testing, and Nia earns no revenue from them.
    </p>
  );
}
