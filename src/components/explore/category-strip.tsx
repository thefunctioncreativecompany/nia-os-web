import { ScrollRow } from "@/components/nia/scroll-row";
import { categoryViews, titleHref, type CategoryKey } from "@/features/explore/made-in-africa";
import { TitleCard } from "./title-card";

// A category's row under By category on Explore (Hollywood Classics since 2026-10-29, Greatest TV
// since 2026-11-08): its titles as equal cards in one still row, in release order, so the row
// reads as history. The heading and View all come from the section around it.
export function CategoryStrip({ category }: { category: CategoryKey }) {
  const view = categoryViews[category];
  return (
    <section aria-label={view.name}>
      <ScrollRow label={view.name}>
        {view.entries.map((e) => (
          <li key={e.title.slug} className="w-[44%] flex-none snap-start sm:w-[30%] md:w-[22%] lg:w-[18%]">
            <TitleCard entry={e} href={titleHref(e.title.slug)} sizes="(min-width: 64rem) 18vw, (min-width: 40rem) 30vw, 44vw" />
          </li>
        ))}
      </ScrollRow>
    </section>
  );
}
