"use client";

import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { WORKFLOWS } from "@/lib/template-workflows";
import { COMING_SOON, works, type GalleryTemplate } from "@/features/templates/gallery";
import { useHoverIntent } from "@/features/templates/use-hover-intent";
import { FlatIcon } from "@/features/templates/components/flat-icon";
import { MiniMap } from "@/features/templates/components/mini-map";
import { NewMarker } from "@/components/nia/new-marker";
import { Button } from "@/components/ui/button";

// The large Showcase card (TEMPLATES_BUILD.md §2, prototype TemplateCard): title and stage
// above a flat 16:11 card with the template's icon, its one-line description, and a mini
// map on workflow templates. Click (or rest the mouse) to preview; the "Use template" pill
// that shows on hover uses it straight away.
export function TemplateCard({
  template,
  onPreview,
  onUse,
  badge,
  size = "default",
  className,
}: {
  // "small": the phone row; a smaller icon and no mini map so nothing overlaps.
  size?: "default" | "small";
  template: GalleryTemplate;
  onPreview: (template: GalleryTemplate, viaHover?: boolean) => void;
  onUse: (template: GalleryTemplate) => void;
  badge?: string;
  className?: string;
}) {
  const open = works(template);
  const small = size === "small";
  const workflow = template.kind === "workflow" && !small ? WORKFLOWS[template.slug] : undefined;
  const hover = useHoverIntent(() => onPreview(template, true));

  return (
    <div className={cn("w-140 max-w-[calc(100vw-2rem)] shrink-0 snap-start", className)}>
      {/* The New marker or badge sits on the card, so names line up along the row (Ika, 2026-11-02). */}
      <div className="mb-3">
        <h3 className="text-title font-semibold text-foreground">{template.name}</h3>
        <p className="mt-0.5 text-lead text-muted-foreground">{template.stage}</p>
      </div>
      <div className="group relative" onPointerEnter={hover.onPointerEnter} onPointerLeave={hover.onPointerLeave}>
        <button
          type="button"
          onClick={() => {
            hover.cancel();
            onPreview(template);
          }}
          aria-label={`Preview the ${template.name} template${open ? "" : `, ${COMING_SOON.toLowerCase()}`}`}
          className="relative flex aspect-[16/11] w-full cursor-pointer items-center justify-center group-sweep overflow-hidden rounded-xl border border-border bg-card text-left outline-none transition-colors duration-fast group-hover:border-nia-blue/35 focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <FlatIcon
            name={template.icon}
            size={small ? "md" : "xl"}
            className={cn(small ? "-mt-10 size-16" : "-mt-12", "transition-transform duration-slow ease-out", open ? "group-hover:-translate-y-1" : "opacity-30")}
          />
          {!open && (
            <span className="absolute top-4 left-4 rounded-full border border-foreground px-3 py-1.5 text-micro font-semibold text-foreground">
              {COMING_SOON}
            </span>
          )}
          {badge ? (
            <span className={cn("absolute top-4 rounded-full border border-foreground bg-card px-2 py-0.5 text-micro font-semibold", open ? "left-4" : "right-4")}>{badge}</span>
          ) : (
            template.fresh && <NewMarker className={cn("absolute top-4", open ? "left-4" : "right-4")} />
          )}
          {template.preview && (
            <p className={cn("absolute line-clamp-2 leading-normal text-foreground/80", small ? "right-4 bottom-3.5 left-4 text-small" : "bottom-5 left-5.5 text-lead", workflow ? "right-43" : !small && "right-5.5")}>
              {template.preview}
            </p>
          )}
          {workflow && (
            <span className="absolute right-4.5 bottom-4.5">
              <MiniMap workflow={workflow} />
            </span>
          )}
        </button>
        {open && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              hover.cancel();
              onUse(template);
            }}
            className="absolute top-4 right-4 -translate-y-1 opacity-0 transition-all duration-base ease-out group-hover:translate-y-0 group-hover:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100"
          >
            Use template <ArrowRight aria-hidden />
          </Button>
        )}
      </div>
    </div>
  );
}
