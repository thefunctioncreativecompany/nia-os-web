"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { suggestTemplates } from "@/features/templates/recommend";
import { COMING_SOON, type GalleryTemplate } from "@/features/templates/gallery";
import type { UserTemplateProfile } from "@/features/templates/types";
import { FlatIcon } from "@/features/templates/components/flat-icon";
import { TemplateCard } from "@/features/templates/components/template-card";

// Listed in full so the styles are generated (see the grain utilities in globals.css).
const GRAINS = ["grain-1", "grain-2", "grain-3", "grain-4", "grain-5", "grain-6", "grain-7", "grain-8", "grain-9", "grain-10", "grain-11", "grain-12"];
const grainFor = (code: string) => GRAINS[[...code].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) % GRAINS.length];

type Preview = (template: GalleryTemplate, list: GalleryTemplate[], viaHover?: boolean) => void;

// Phones (Ika, after Apple Music): the templates suggested for this person as a row of large
// cards, slightly smaller than desktop's, with the next one peeking in.
export function SuggestedRow({
  templates,
  profile,
  ready,
  onPreview,
  onUse,
}: {
  templates: GalleryTemplate[];
  profile: UserTemplateProfile;
  ready: boolean;
  onPreview: Preview;
  onUse: (template: GalleryTemplate) => void;
}) {
  // Worked out once the person's history has loaded (it reads the clock).
  const suggested = ready ? suggestTemplates(templates, profile).map((s) => s.template) : [];
  return (
    <section aria-labelledby="m-suggested" className="pt-7">
      <h2 id="m-suggested" className="mb-3 px-4 text-lg font-extrabold text-foreground">Suggested for you</h2>
      <div className="flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 [scrollbar-width:none]">
        {ready
          ? suggested.map((t) => (
              <TemplateCard key={t.code} template={t} size="small" onPreview={(x) => onPreview(x, suggested)} onUse={onUse} className="w-[78%] max-w-none" />
            ))
          : Array.from({ length: 2 }, (_, i) => <Skeleton key={i} className="aspect-[16/11] w-[78%] shrink-0 rounded-xl" />)}
      </div>
    </section>
  );
}

// Every template by category (Figma groups, then Coming soon): a row of square gradient cards
// per category. "›" opens the whole category as a grid in place, "⌄" folds it back.
export function CategoryRows({ templates, groups, onPreview }: { templates: GalleryTemplate[]; groups: string[]; onPreview: Preview }) {
  const [open, setOpen] = useState<string[]>([]);
  const rows = [...groups, COMING_SOON]
    .map((group) => ({ group, items: templates.filter((t) => (group === COMING_SOON ? t.status === "gap" : t.status !== "gap" && t.group === group)) }))
    .filter((r) => r.items.length);

  if (!rows.length) return <p className="px-4 pt-7 text-sm text-muted-foreground md:px-11">No templates here yet.</p>;

  return (
    <div className="flex flex-col gap-9 pt-9">
      {rows.map(({ group, items }) => {
        const id = `row-${group.replace(/\W+/g, "-").toLowerCase()}`;
        const all = open.includes(group);
        return (
          <section key={group} aria-labelledby={id}>
            <button
              type="button"
              aria-expanded={all}
              aria-controls={`${id}-items`}
              onClick={() => setOpen((o) => (all ? o.filter((g) => g !== group) : [...o, group]))}
              className="mx-4 mb-3 block rounded-sm text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50 md:mx-11"
            >
              {/* Inline, so on a wrapped name the count and arrow follow the last word. */}
              <h2 id={id} className="inline text-lg font-extrabold text-foreground">{group}</h2>
              <span className="ml-1 text-micro whitespace-nowrap text-muted-foreground">
                {items.length}
                {all ? <ChevronDown aria-hidden className="ml-0.5 inline size-5 align-text-bottom" /> : <ChevronRight aria-hidden className="ml-0.5 inline size-5 align-text-bottom" />}
              </span>
              <span className="sr-only">{all ? ", show as a row" : ", show all"}</span>
            </button>
            <div
              id={`${id}-items`}
              className={cn(
                "px-4 md:px-11",
                all
                  ? "grid grid-cols-[repeat(auto-fill,minmax(min(42%,11rem),1fr))] gap-x-3.5 gap-y-5"
                  : "flex snap-x snap-mandatory scroll-px-4 gap-3.5 overflow-x-auto [scrollbar-width:none] md:scroll-px-11",
              )}
            >
              {items.map((t) => (
                <SquareCard key={t.code} template={t} inRow={!all} onPreview={() => onPreview(t, items)} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function SquareCard({ template: t, inRow, onPreview }: { template: GalleryTemplate; inRow: boolean; onPreview: () => void }) {
  const open = t.status !== "gap";
  return (
    <button
      type="button"
      onClick={onPreview}
      aria-label={`Preview the ${t.name} template${open ? "" : `, ${COMING_SOON.toLowerCase()}`}`}
      className={cn("rounded-xl text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50", inRow && "w-[42%] shrink-0 snap-start md:w-44")}
    >
      <span className={cn("grain-noise flex aspect-square items-center justify-center overflow-hidden rounded-xl", grainFor(t.code), !open && "opacity-60")}>
        <FlatIcon name={t.icon} size="md" className="size-12 text-current" />
      </span>
      <span className="mt-2 block truncate text-sm font-semibold text-foreground">{t.name}</span>
      <span className="block truncate text-small text-muted-foreground">{open ? t.stage : COMING_SOON}</span>
    </button>
  );
}
