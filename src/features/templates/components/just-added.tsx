"use client";

import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NewMarker, dayLabel } from "@/components/nia/new-marker";
import { grainFor, type GalleryTemplate } from "@/features/templates/gallery";
import { FlatIcon } from "@/features/templates/components/flat-icon";
import { TemplateValue } from "@/features/templates/components/template-value";

// "Just added" at the top of Templates (Ika, 2026-10-28): each template that opened in the last
// NEW_FOR_DAYS (launches.ts), with the day it arrived and what it does for you and your team.
// Shown only while something is new.
export function JustAdded({
  templates,
  onPreview,
  onUse,
  className,
}: {
  templates: GalleryTemplate[];
  onPreview: (template: GalleryTemplate) => void;
  onUse: (template: GalleryTemplate) => void;
  className?: string;
}) {
  const fresh = templates.filter((t) => t.fresh).slice(0, 3);
  if (!fresh.length) return null;
  return (
    <section aria-labelledby="just-added" className={cn("flex flex-col gap-4.5", className)}>
      <div>
        <h2 id="just-added" className="text-lg font-extrabold text-foreground">Just added</h2>
        <p className="text-small text-muted-foreground">
          {fresh.length === 1 ? "A new template is ready to use." : `${fresh.length} new templates are ready to use.`}
        </p>
      </div>
      <div className={cn("grid gap-5", fresh.length > 1 && "lg:grid-cols-2")}>
        {fresh.map((t) => (
          <article key={t.code} className="flex flex-col overflow-hidden rounded-2xl border border-border bg-white sm:flex-row">
            <button
              type="button"
              onClick={() => onPreview(t)}
              aria-label={`Preview the ${t.name} template`}
              className={cn("grid min-h-40 place-items-center outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:w-56 sm:flex-none", grainFor(t.code))}
            >
              <span className="grid size-24 place-items-center rounded-2xl bg-white shadow-elevation-2">
                <FlatIcon name={t.icon} size="md" />
              </span>
            </button>
            <div className="flex min-w-0 flex-1 flex-col gap-4 p-5 sm:p-6">
              <div>
                {t.launched && <NewMarker label={`New · added ${dayLabel(t.launched)}`} />}
                <h3 className="mt-2.5 text-h3 font-bold tracking-tight text-foreground">{t.name}</h3>
                <p className="text-small text-muted-foreground">{t.stage}</p>
              </div>
              <TemplateValue template={t} />
              <div className="flex flex-wrap gap-2.5">
                <Button onClick={() => onUse(t)}>
                  Use this template <ArrowRight aria-hidden />
                </Button>
                <Button variant="outline" onClick={() => onPreview(t)}>Preview</Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
