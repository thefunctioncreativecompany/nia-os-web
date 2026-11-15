import { ScrollRow } from "@/components/nia/scroll-row";
import { ROW_MAX, spread } from "@/lib/rows";
import { RANKED, categoryViews, titleHref, type CategoryKey } from "@/features/explore/made-in-africa";
import { ROW_CELL, ROW_SIZES } from "./row-cell";
import { TitleCard, entrySpan } from "./title-card";

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
          <li key={e.title.slug} className={ROW_CELL} style={entrySpan(e)}>
            <TitleCard entry={e} href={titleHref(e.title.slug)} sizes={ROW_SIZES} />
          </li>
        ))}
      </ScrollRow>
    </section>
  );
}
