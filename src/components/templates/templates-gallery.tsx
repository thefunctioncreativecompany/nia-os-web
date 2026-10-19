"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, GalleryHorizontalEnd, Rows3 } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import {
  COMING_SOON,
  FAMILY_LABELS,
  FAMILY_ORDER,
  STAGES,
  TEMPLATES,
  familyGradient,
  type Template,
  type TemplateStage,
} from "@/lib/templates";
import { Button } from "@/components/ui/button";
import { CompactTile } from "@/components/templates/compact-tile";
import { TemplateCard } from "@/components/templates/template-card";
import { TemplateIcon } from "@/components/templates/template-icon";

type View = "showcase" | "compact";

// The Templates page (TEMPLATE_THUMBNAILS.md Sections 8 and 8b; CDWorkspace prototype):
// stage filters, a Showcase / Compact toggle, the featured row and one shelf per family.
export function TemplatesGallery() {
  const [view, setView] = useState<View>("showcase");
  const [stage, setStage] = useState<TemplateStage | "All">("All");
  const row = useRef<HTMLDivElement>(null);

  const use = (template: Template) => {
    if (template.status === "live") {
      toast("The project launcher is the next step of this build.");
      return;
    }
    toast(`${template.name} opens in the document editor, which is coming soon.`);
  };

  const visible = TEMPLATES.filter((t) => stage === "All" || t.stage === stage);
  const featured = visible.filter((t) => t.status !== "gap");
  const comingSoon = visible.filter((t) => t.status === "gap");
  const nudge = (direction: 1 | -1) => {
    const el = row.current;
    if (el) el.scrollBy({ left: direction * Math.min(584, el.clientWidth - 80), behavior: "smooth" });
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4.5 pt-10 pb-18">
      <div className="flex flex-col gap-4.5 px-4 md:px-11">
        <div>
          <p className="font-mono text-micro font-semibold tracking-wider text-muted-foreground uppercase">Templates</p>
          <h1 className="mt-2 text-display font-bold text-foreground">Start from a proven path</h1>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3.5">
          <StageChips stage={stage} onChange={setStage} />
          <div className="flex items-center gap-2">
            {view === "showcase" && (
              <>
                <Button variant="outline" size="icon-sm" aria-label="Previous templates" onClick={() => nudge(-1)} className="hidden sm:inline-flex"><ChevronLeft /></Button>
                <Button variant="outline" size="icon-sm" aria-label="Next templates" onClick={() => nudge(1)} className="hidden sm:inline-flex"><ChevronRight /></Button>
              </>
            )}
            <ViewToggle view={view} onChange={setView} />
          </div>
        </div>
      </div>

      {view === "showcase" ? (
        <>
          <div ref={row} className="-mb-4.5 flex snap-x snap-mandatory scroll-px-4 gap-6 overflow-x-auto px-4 pt-7 pb-13 [scrollbar-width:none] md:scroll-px-11 md:px-11">
            {featured.map((t) => (
              <TemplateCard key={t.code} template={t} onUse={use} />
            ))}
            {featured.length === 0 && <p className="text-sm text-muted-foreground">No templates for this stage yet.</p>}
          </div>
          {comingSoon.length > 0 && (
            <section aria-labelledby="coming-soon" className="px-4 md:px-11">
              <div className="mb-3.5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 id="coming-soon" className="text-lg font-extrabold text-foreground">{comingSoon.length} coming soon</h2>
                  <p className="text-small text-muted-foreground">What we&rsquo;re building next.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setView("compact")}><Rows3 />See all in compact view</Button>
              </div>
              <ul className="flex flex-wrap gap-2">
                {comingSoon.map((t) => {
                  return (
                    <li key={t.code} className="inline-flex h-8 items-center gap-2 rounded-full border border-border bg-white pr-3 pl-1.5 text-small text-muted-foreground">
                      <span aria-hidden className="flex size-5.5 items-center justify-center rounded-full opacity-60" style={{ background: familyGradient(t.family, t.variant) }}>
                        <TemplateIcon template={t} strokeWidth={1.7} className="size-3 text-white" />
                      </span>
                      {t.name}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </>
      ) : (
        <div className="flex flex-col gap-8.5 px-4 pt-7.5 md:px-11">
          {FAMILY_ORDER.map((family) => {
            const items = visible.filter((t) => t.family === family);
            if (!items.length) return null;
            return (
              <section key={family} aria-labelledby={`family-${family}`}>
                <div className="mb-3 flex items-center gap-2.5">
                  <span aria-hidden className="size-2.5 rounded-xs" style={{ background: `var(--family-${family}-core)` }} />
                  <h2 id={`family-${family}`} className="text-lg font-extrabold text-foreground">{FAMILY_LABELS[family]}</h2>
                  <span className="font-mono text-micro font-semibold text-muted-foreground">{items.length}</span>
                </div>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,15.5rem),1fr))] gap-3.5">
                  {items.map((t) => (
                    <CompactTile key={t.code} template={t} onUse={use} />
                  ))}
                </div>
              </section>
            );
          })}
          {visible.length === 0 && <p className="text-sm text-muted-foreground">No templates for this stage yet.</p>}
        </div>
      )}
      <span className="sr-only" aria-live="polite">
        {visible.length} templates{stage === "All" ? "" : ` in ${stage.toLowerCase()}`}, {comingSoon.length} {COMING_SOON.toLowerCase()}
      </span>
    </div>
  );
}

function StageChips({ stage, onChange }: { stage: TemplateStage | "All"; onChange: (next: TemplateStage | "All") => void }) {
  return (
    <div role="group" aria-label="Stage" className="flex flex-wrap gap-2">
      {(["All", ...STAGES] as const).map((s) => {
        const on = stage === s;
        const count = s === "All" ? TEMPLATES.length : TEMPLATES.filter((t) => t.stage === s).length;
        return (
          <button
            key={s}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(s)}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-small outline-none transition-colors duration-fast focus-visible:ring-3 focus-visible:ring-ring/50",
              on ? "border-foreground bg-foreground font-semibold text-primary-foreground" : "border-border bg-white text-foreground hover:border-ring",
            )}
          >
            {s}
            <span className={cn("font-mono text-meta", on ? "text-primary-foreground/70" : "text-muted-foreground")}>{count}</span>
          </button>
        );
      })}
    </div>
  );
}

function ViewToggle({ view, onChange }: { view: View; onChange: (next: View) => void }) {
  const options = [
    { value: "showcase" as const, label: "Showcase", icon: GalleryHorizontalEnd },
    { value: "compact" as const, label: "Compact", icon: Rows3 },
  ];
  return (
    <div role="group" aria-label="Gallery view" className="inline-flex rounded-full border border-border bg-white p-0.75">
      {options.map(({ value, label, icon: Icon }) => {
        const on = view === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(value)}
            className={cn(
              "inline-flex h-7.5 items-center gap-1.5 rounded-full px-3.5 text-small outline-none transition-colors duration-fast focus-visible:ring-3 focus-visible:ring-ring/50",
              on ? "bg-foreground font-semibold text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon aria-hidden className="size-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
