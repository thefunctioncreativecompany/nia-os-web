"use client";

import type { ReactNode } from "react";
import {
  ArrowRight,
  ClipboardList,
  IdCard,
  Image,
  MapPin,
  PackageOpen,
  PenTool,
  Scan,
  Shirt,
  Sparkle,
  Umbrella,
  Users,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { MarqueeColumns, laneCardClass } from "@/components/nia/marquee-columns";
import { RankedList } from "@/components/nia/ranked-list";
import { ScrubFilmstrip } from "@/components/nia/scrub-filmstrip";
import { WORKFLOWS, type WorkflowStep } from "@/lib/template-workflows";
import { COMING_SOON, grainAt, grainFor, works, type GalleryTemplate } from "@/features/templates/gallery";
import { FlatIcon } from "@/features/templates/components/flat-icon";

type Preview = (template: GalleryTemplate, list: GalleryTemplate[]) => void;

const WORKFLOWS_GROUP = "Workflows";
const STRATEGY = "Strategy & Development";
const UGC = "UGC & Social Content";

// Phase pill colours (theme `phase-*`, from Ika's design).
const PHASE: Record<string, string> = {
  "Pre-production": "bg-phase-pre text-phase-pre-foreground",
  Production: "bg-phase-production text-phase-production-foreground",
  "Post-production": "bg-phase-post text-phase-post-foreground",
  [COMING_SOON]: "bg-phase-soon text-phase-soon-foreground",
};

// One Lucide icon per Editorial Shoot step.
const STEP_ICONS: Record<number, LucideIcon> = {
  1: Sparkle,
  2: PenTool,
  3: Image,
  4: MapPin,
  5: IdCard,
  6: Shirt,
  7: Users,
  8: Scan,
  9: ClipboardList,
  10: Umbrella,
  11: PackageOpen,
};

const phaseOf = (t: GalleryTemplate) => (works(t) ? t.stage : COMING_SOON);

// Everything below "Suggested for you" (Ika's Claude Design "Templates", 2026-10-20): each
// category in its own form. Workflows and Strategy & Development as filmstrips the pointer scrubs,
// Production Management as a ranked list with a following preview, UGC as scrolling columns, and
// the templates still to come as a compact list. Clicking anything opens its preview pop-up.
// Categories added later fall back to the ranked list.
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

  if (!sections.length && !soon.length) return <p className="px-4 pt-7 text-sm text-muted-foreground md:px-11">No templates here yet.</p>;

  return (
    <div className="flex flex-col gap-22 px-4 pt-20 md:px-11">
      {sections.map(({ group, items }) =>
        group === WORKFLOWS_GROUP ? (
          <WorkflowsSection key={group} items={items} onPreview={onPreview} />
        ) : group === STRATEGY ? (
          <StripSection key={group} group={group} items={items} onPreview={onPreview} />
        ) : group === UGC ? (
          <ColumnsSection key={group} group={group} items={items} onPreview={onPreview} />
        ) : (
          <ListSection key={group} group={group} items={items} onPreview={onPreview} />
        ),
      )}
      {soon.length > 0 && <SoonSection items={soon} total={total} onPreview={onPreview} />}
    </div>
  );
}

const sectionId = (group: string) => `cat-${group.replace(/\W+/g, "-").toLowerCase()}`;

function SectionTitle({ group, count, children }: { group: string; count: number; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-3">
      <h2 id={sectionId(group)} className="text-lg font-extrabold text-foreground">
        {group} <span className="text-micro font-normal text-muted-foreground">{count}</span>
      </h2>
      {children}
    </div>
  );
}

const tile = "grid place-items-center overflow-hidden";

// 1. Workflows: each workflow's steps as a filmstrip.
function WorkflowsSection({ items, onPreview }: { items: GalleryTemplate[]; onPreview: Preview }) {
  return (
    <section aria-labelledby={sectionId(WORKFLOWS_GROUP)}>
      <SectionTitle group={WORKFLOWS_GROUP} count={items.length} />
      {items.map((t) => {
        const steps = WORKFLOWS[t.slug]?.steps ?? [];
        return (
          <div key={t.code} className="mt-3.5">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-h2 font-bold tracking-tight text-foreground">{t.name}</span>
                {/* The launcher that runs a workflow comes in a later build step. */}
                <span className={cn("inline-flex h-6 items-center rounded-full px-2.5 text-caption font-semibold", PHASE[COMING_SOON])}>{COMING_SOON}</span>
              </div>
              <span className="text-sm text-muted-foreground">{t.preview}</span>
            </div>
            {steps.length > 0 && (
              <ScrubFilmstrip
                className="mt-2"
                items={steps}
                label={`${t.name} steps`}
                getKey={(s) => String(s.n)}
                footer={(s) => s.label}
                renderCard={(s, i) => <StepCard step={s} index={i} onClick={() => onPreview(t, [t])} workflow={t.name} />}
              />
            )}
          </div>
        );
      })}
    </section>
  );
}

function StepCard({ step, index, workflow, onClick }: { step: WorkflowStep; index: number; workflow: string; onClick: () => void }) {
  const Icon = STEP_ICONS[step.n] ?? ClipboardList;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Step ${step.n}, ${step.label}: ${step.description} Preview ${workflow}.`}
      className="group flex w-65 flex-col gap-2.5 rounded-2xl text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span className={cn(tile, "relative size-65 rounded-2xl transition-shadow duration-base group-hover:shadow-card-hover", grainAt(index))}>
        <span className="absolute top-3.5 left-4 text-small font-semibold">{String(step.n).padStart(2, "0")}</span>
        <Icon aria-hidden className="size-13 stroke-[1.4]" />
      </span>
      <span className="text-lead font-bold text-foreground">{step.label}</span>
      <span className="-mt-1.5 text-small leading-snug text-muted-foreground">{step.description}</span>
    </button>
  );
}

// 2. Production Management & Operations (and any new category): a ranked list.
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

// 3. Strategy & Development: a filmstrip of the templates.
function StripSection({ group, items, onPreview }: { group: string; items: GalleryTemplate[]; onPreview: Preview }) {
  return (
    <section aria-labelledby={sectionId(group)}>
      <SectionTitle group={group} count={items.length} />
      <ScrubFilmstrip
        className="mt-2"
        items={items}
        start={0.3}
        label={group}
        getKey={(t) => t.code}
        footer={(t) => (works(t) ? t.name : `${t.name} · ${COMING_SOON}`)}
        renderCard={(t) => (
          <button
            type="button"
            onClick={() => onPreview(t, items)}
            aria-label={`${t.name}${works(t) ? "" : `, ${COMING_SOON.toLowerCase()}`}. Preview the template.`}
            className="group flex w-75 flex-col gap-2.5 rounded-2xl text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <span className={cn(tile, "size-75 rounded-2xl transition-shadow duration-base group-hover:shadow-card-hover", grainFor(t.code))}>
              <FlatIcon name={t.icon} className="size-15 stroke-[1.3] text-current" />
            </span>
            <span className="text-lg font-bold text-foreground">{t.name}</span>
            <span className="-mt-1.5 line-clamp-2 text-small leading-snug text-muted-foreground">{t.preview}</span>
          </button>
        )}
      />
    </section>
  );
}

// 4. UGC & Social Content: scrolling columns.
function ColumnsSection({ group, items, onPreview }: { group: string; items: GalleryTemplate[]; onPreview: Preview }) {
  return (
    <section aria-labelledby={sectionId(group)}>
      <div className="mb-4">
        <SectionTitle group={group} count={items.length}>
          <span className="text-small text-muted-foreground max-sm:hidden">Hover a column to pause</span>
        </SectionTitle>
      </div>
      <MarqueeColumns
        items={items}
        getKey={(t) => t.code}
        speeds={[52, 68, 46, 74, 58]}
        className="sm:h-160"
        renderCard={(t) => (
          <button
            type="button"
            onClick={() => onPreview(t, items)}
            aria-label={`${t.name}${works(t) ? "" : `, ${COMING_SOON.toLowerCase()}`}. Preview the template.`}
            className={cn("flex flex-col gap-2 rounded-2xl text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50", laneCardClass)}
          >
            <span className={cn(tile, "aspect-square w-full rounded-2xl", grainFor(t.code))}>
              <FlatIcon name={t.icon} className="size-10 stroke-[1.4] text-current" />
            </span>
            <span className="text-lead font-bold text-foreground">{t.name}</span>
            <span className="-mt-1.5 line-clamp-2 text-caption leading-snug text-muted-foreground">{t.preview}</span>
          </button>
        )}
      />
    </section>
  );
}

// 5. Coming soon: a compact numbered list in three columns.
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
