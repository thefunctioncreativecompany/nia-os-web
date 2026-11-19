import { ScrollRow } from "@/components/nia/scroll-row";
import { ROW_MAX, spread } from "@/lib/rows";
import { RANKED, categoryViews, type CategoryKey } from "@/features/explore/made-in-africa";
import { exploreItem } from "@/features/explore/items";
import { TrailerCell } from "./trailer-cell";

// A category's row under By category on Explore (Hollywood Classics since 2026-10-29, Greatest TV
// since 2026-11-08): ten of its titles (ROW_MAX), spread evenly through its release order so the
// row still reads as history, as equal cards in one still row. A ranked category (Best of 2026)
// shows its top ten in rank order. The heading and View all come from the section around it.
export function CategoryStrip({ category }: { category: CategoryKey }) {
  const view = categoryViews[category];
  return (
    <section aria-label={view.name}>
      <ScrollRow label={view.name}>
        {(RANKED.includes(category) ? view.entries.slice(0, ROW_MAX) : spread(view.entries)).map((e) => (
          <TrailerCell key={e.title.slug} item={exploreItem(e.title.slug)!} />
        ))}
      </ScrollRow>
    </section>
  );
}
