"use client";

import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { RankedList } from "@/components/nia/ranked-list";
import { COMING_SOON, grainFor, works, type GalleryTemplate } from "@/features/templates/gallery";
import { FlatIcon } from "@/features/templates/components/flat-icon";
import { sentenceCase } from "@/lib/sentence-case";

type Preview = (template: GalleryTemplate, list: GalleryTemplate[]) => void;

// Phase pill colours (theme `phase-*`, from Ika's design).
const PHASE: Record<string, string> = {
  "Pre-production": "bg-phase-pre text-phase-pre-foreground",
  Production: "bg-phase-production text-phase-production-foreground",
  "Post-production": "bg-phase-post text-phase-post-foreground",
  [COMING_SOON]: "bg-phase-soon text-phase-soon-foreground",
};

const phaseOf = (t: GalleryTemplate) => (works(t) ? t.stage : COMING_SOON);

// Every template once, by category, all in one form: the list Ika's design gave Production
// Management (2026-10-20), so the page reads the same top to bottom (Ika, 2026-11-13: minimalism
// wins; the filmstrip and scrolling-column sections are in git tag parked-2026-11-13-templates).
// The templates still to come follow as a compact list. Clicking a row opens its preview pop-up.
export function CategorySections({
  templates,
  groups,
  total,
  onPreview,
}: {
  templates: GalleryTemplate[];
  groups: string[];
  total: number;
  onPreview: Preview;
}) {
  // Within a category, the ones that work come first.
  const inGroup = (group: string) =>
    templates.filter((t) => t.status !== "gap" && t.group === group).sort((a, b) => Number(works(b)) - Number(works(a)));
  const soon = templates.filter((t) => t.status === "gap");
  const sections = groups.map((group) => ({ group, items: inGroup(group) })).filter((s) => s.items.length);

  if (!sections.length && !soon.length) return <p className="px-4 pt-7 text-sm text-muted-foreground md:px-page">No templates here yet.</p>;

  return (
    <div className="flex flex-col gap-16 px-4 pt-12 md:px-page">
      {sections.map(({ group, items }) => (
        <ListSection key={group} group={group} items={items} onPreview={onPreview} />
      ))}
      {soon.length > 0 && <SoonSection items={soon} total={total} onPreview={onPreview} />}
    </div>
  );
}

const sectionId = (group: string) => `cat-${group.replace(/\W+/g, "-").toLowerCase()}`;

function SectionTitle({ group, count, children }: { group: string; count: number; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-3">
      <h2 id={sectionId(group)} className="text-subtitle font-semibold text-foreground">
        {sentenceCase(group)} <span className="text-micro font-normal text-muted-foreground">{count}</span>
      </h2>
      {children}
    </div>
  );
}

const tile = "grid place-items-center overflow-hidden";

// A category as a ranked list.
function ListSection({ group, items, onPreview }: { group: string; items: GalleryTemplate[]; onPreview: Preview }) {
  return (
    <section aria-labelledby={sectionId(group)}>
      <div className="mb-3.5">
        <SectionTitle group={group} count={items.length} />
      </div>
      <RankedList
        items={items}
        getKey={(t) => t.code}
        getLabel={(t) => `${t.name}, ${phaseOf(t)}. Preview the template.`}
        onSelect={(t) => onPreview(t, items)}
        previewFollowsCursor
        previewClassName="size-55 rounded-2xl"
        renderPreview={(t) => (
          <span className={cn(tile, "size-full", grainFor(t.code))}>
            <FlatIcon name={t.icon} className="size-15 stroke-[1.3] text-current" />
          </span>
        )}
        header={
          <div aria-hidden className="flex gap-4.5 border-b border-border px-2 py-2.5 text-micro font-semibold text-muted-foreground max-md:hidden">
            <span className="w-11" />
            <span className="w-70">Template</span>
            <span className="w-32.5">Phase</span>
            <span className="flex-1">What it&rsquo;s for</span>
            <span className="w-32.5" />
          </div>
        }
        rowClassName="min-h-19 gap-4.5 border-b border-secondary px-2 py-2"
        renderRow={(t) => (
          <>
            <span className={cn(tile, "size-11 flex-none rounded-lg", grainFor(t.code))}>
              <FlatIcon name={t.icon} className="size-5 stroke-[1.6] text-current" />
            </span>
            <span className="min-w-0 flex-1 truncate text-lead font-bold tracking-tight transition-transform duration-glide ease-glide group-hover/row:translate-x-3 group-focus-visible/row:translate-x-3 motion-reduce:translate-x-0! md:w-70 md:flex-none md:text-xl">
              {t.name}
            </span>
            <span className="flex-none md:w-32.5">
              <span className={cn("inline-flex h-6.5 items-center rounded-full px-2.5 text-caption font-medium", PHASE[phaseOf(t)])}>{phaseOf(t)}</span>
            </span>
            <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground max-md:hidden">{t.preview}</span>
            <span className="inline-flex w-32.5 flex-none items-center justify-end gap-1.5 text-small font-semibold opacity-0 transition-opacity duration-base group-hover/row:opacity-100 group-focus-visible/row:opacity-100 max-md:hidden">
              {works(t) ? "Use template" : "Notify me"}
              <ArrowRight aria-hidden className="size-3.25" strokeWidth={2} />
            </span>
          </>
        )}
      />
    </section>
  );
}

// Coming soon: a compact numbered list in three columns.
function SoonSection({ items, total, onPreview }: { items: GalleryTemplate[]; total: number; onPreview: Preview }) {
  return (
    <section aria-labelledby={sectionId(COMING_SOON)}>
      <div className="mb-3.5">
        <SectionTitle group={COMING_SOON} count={items.length} />
      </div>
      <RankedList
        items={items}
        getKey={(t) => t.code}
        getLabel={(t) => `${t.name}, ${COMING_SOON.toLowerCase()}. Preview the template.`}
        onSelect={(t) => onPreview(t, items)}
        previewFollowsCursor
        previewClassName="size-45 rounded-2xl"
        offset={{ x: 30, y: -110 }}
        renderPreview={(t) => (
          <span className={cn(tile, "size-full", grainFor(t.code))}>
            <FlatIcon name={t.icon} className="size-13 stroke-[1.3] text-current" />
          </span>
        )}
        className="grid gap-x-8 border-t border-border sm:grid-cols-2 lg:grid-cols-3"
        rowClassName="min-h-14 gap-3.5 border-b border-secondary"
        renderRow={(t, i) => (
          <>
            <span className="w-6 flex-none text-caption text-nia-placeholder">{String(i + 1).padStart(2, "0")}</span>
            <span className={cn(tile, "size-7.5 flex-none rounded-lg", grainFor(t.code))}>
              <FlatIcon name={t.icon} className="size-3.75 stroke-[1.8] text-current" />
            </span>
            <span className="min-w-0 flex-1 truncate text-lead font-semibold transition-transform duration-glide ease-glide group-hover/row:translate-x-3 group-focus-visible/row:translate-x-3 motion-reduce:translate-x-0!">
              {t.name}
            </span>
          </>
        )}
      />
      <p className="mt-7 text-small text-muted-foreground">{total} templates</p>
    </section>
  );
}
