import { ScrollRow } from "@/components/nia/scroll-row";
import { dayLabel } from "@/components/nia/new-marker";
import { exploreItem } from "@/features/explore/items";
import { RECENT_DAYS, type Added } from "@/features/explore/recent";
import { ExploreCard, cardSpan } from "./title-card";
import { TmdbCredit } from "./tmdb-credit";

// "Recently added on Explore" (Ika, 2026-10-28): what joined Explore in the last week, newest
// first, each with the day it arrived. Shown only while something is that new; the list is worked
// out per request (recent.ts), so the row empties itself after seven days.
export function RecentlyAddedStrip({ added, bare = false }: { added: Added[]; bare?: boolean }) {
  const recent = added.flatMap(({ slug, added }) => {
    const item = exploreItem(slug);
    return item ? [{ item, added }] : [];
  });
  if (!recent.length) return null;
  return (
    <section aria-labelledby="recently-added-title" className={bare ? undefined : "mt-7"}>
      {bare ? (
        <h3 id="recently-added-title" className="sr-only">
          Recently added on Explore
        </h3>
      ) : (
        <div className="mb-4 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 id="recently-added-title" className="text-subtitle font-semibold text-foreground">
              Recently added on Explore
            </h3>
            <TmdbCredit />
          </div>
          <p className="mt-1 max-w-160 text-sm text-muted-foreground">Titles and films added in the last {RECENT_DAYS} days.</p>
        </div>
      )}
      <ScrollRow label="Recently added on Explore">
        {recent.map(({ item, added }) => (
          <li key={item.slug} className="w-[calc(44%*var(--span,1))] flex-none snap-start sm:w-[calc(30%*var(--span,1))] md:w-[calc(22%*var(--span,1))] lg:w-[calc(18%*var(--span,1))]" style={cardSpan(item)}>
            <ExploreCard item={item} href={item.href()} sizes="(min-width: 64rem) 18vw, (min-width: 40rem) 30vw, 44vw" note={`Added ${dayLabel(added)}`} />
          </li>
        ))}
      </ScrollRow>
    </section>
  );
}
