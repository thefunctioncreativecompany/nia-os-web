import { ScrollRow } from "@/components/nia/scroll-row";
import { ROW_MAX } from "@/lib/rows";
import { pick, seedFor } from "@/lib/shuffle";
import { categoryViews, type CategoryKey } from "@/features/explore/made-in-africa";
import { exploreItem } from "@/features/explore/items";
import { TrailerCell } from "./trailer-cell";

// A category's row under By category on Explore (Hollywood Classics since 2026-10-29, Greatest TV
// since 2026-11-08): ten of its titles (ROW_MAX), a different ten on each visit (`seed`, Ika
// 2026-11-19), kept in the category's own order so the row still reads as history, or in rank
// order for a ranked category (Best of 2026, ten of its hundred). The heading and View all come from the section around it.
export function CategoryStrip({ category, seed }: { category: CategoryKey; seed: number }) {
  const view = categoryViews[category];
  return (
    <section aria-label={view.name}>
      <ScrollRow label={view.name}>
        {pick(view.entries, seedFor(seed, category), ROW_MAX).map((e) => (
          <TrailerCell key={e.title.slug} item={exploreItem(e.title.slug)!} />
        ))}
      </ScrollRow>
    </section>
  );
}
