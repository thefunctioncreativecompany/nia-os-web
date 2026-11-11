import { ScrollRow } from "@/components/nia/scroll-row";
import { spread } from "@/lib/rows";
import { categoryViews, titleHref, type CategoryKey } from "@/features/explore/made-in-africa";
import { TitleCard, entrySpan } from "./title-card";

// A category's row under By category on Explore (Hollywood Classics since 2026-10-29, Greatest TV
// since 2026-11-08): ten of its titles (ROW_MAX), spread evenly through its release order so the
// row still reads as history, as equal cards in one still row. The heading and View all come from the section around it.
export function CategoryStrip({ category }: { category: CategoryKey }) {
  const view = categoryViews[category];
  return (
    <section aria-label={view.name}>
      <ScrollRow label={view.name}>
        {spread(view.entries).map((e) => (
          <li key={e.title.slug} className="w-[calc(44%*var(--span,1))] flex-none snap-start sm:w-[calc(30%*var(--span,1))] md:w-[calc(22%*var(--span,1))] lg:w-[calc(18%*var(--span,1))]" style={entrySpan(e)}>
            <TitleCard entry={e} href={titleHref(e.title.slug)} sizes="(min-width: 64rem) 18vw, (min-width: 40rem) 30vw, 44vw" />
          </li>
        ))}
      </ScrollRow>
    </section>
  );
}
