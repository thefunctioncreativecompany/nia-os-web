"use client";

import { cn } from "@/lib/utils";
import { NewMarker, dayLabel } from "@/components/nia/new-marker";
import { ScrollRow } from "@/components/nia/scroll-row";
import { grainFor, type GalleryTemplate } from "@/features/templates/gallery";
import { FlatIcon } from "@/features/templates/components/flat-icon";

// "Just added" at the top of Templates (Ika, 2026-10-28): every template that opened in the last
// NEW_FOR_DAYS (launches.ts), newest first. One row of compact cards that scrolls (Ika,
// 2026-10-30: the big two-column cards were hard to read and showed only three of twenty):
// each card has the name, its stage and what it does for you; the whole card opens the preview,
// which carries both value lines and Use this template. Shown only while something is new.
export function JustAdded({
  templates,
  onPreview,
  className,
}: {
  templates: GalleryTemplate[];
  onPreview: (template: GalleryTemplate) => void;
  className?: string;
}) {
  const fresh = templates.filter((t) => t.fresh).toSorted((a, b) => (b.launched ?? "").localeCompare(a.launched ?? ""));
  if (!fresh.length) return null;
  return (
    <section aria-labelledby="just-added" className={cn("flex flex-col gap-3", className)}>
      <h2 id="just-added" className="text-lg font-extrabold text-foreground">
        Just added
      </h2>
      <ScrollRow label="Just added">
        {fresh.map((t) => (
          <li key={t.code} className="w-64 flex-none snap-start sm:w-72">
            <button
              type="button"
              onClick={() => onPreview(t)}
              className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-border bg-white text-left outline-none transition-shadow duration-fast hover:shadow-elevation-2 focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span className={cn("flex h-24 items-end p-3", grainFor(t.code))}>
                <span className="grid size-11 place-items-center rounded-xl bg-white shadow-elevation-2">
                  <FlatIcon name={t.icon} size="sm" />
                </span>
              </span>
              <span className="flex flex-1 flex-col gap-1.5 p-4">
                {t.launched && <NewMarker label={`New · ${dayLabel(t.launched)}`} className="self-start" />}
                <span className="text-base leading-snug font-bold text-foreground">{t.name}</span>
                <span className="text-small text-muted-foreground">{t.stage}</span>
                {t.forYou && <span className="line-clamp-3 text-small leading-normal text-foreground/80">{t.forYou}</span>}
              </span>
            </button>
          </li>
        ))}
      </ScrollRow>
    </section>
  );
}
