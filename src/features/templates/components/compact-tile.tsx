"use client";

import { cn } from "@/lib/utils";
import { COMING_SOON, works, type GalleryTemplate } from "@/features/templates/gallery";
import { useHoverIntent } from "@/features/templates/use-hover-intent";
import { FlatIcon } from "@/features/templates/components/flat-icon";

// A small white tile for the Compact view and search results: name and stage on the left,
// the template's icon on the right. Click, or rest the mouse on it, to preview.
export function CompactTile({ template, onPreview }: { template: GalleryTemplate; onPreview: (template: GalleryTemplate, viaHover?: boolean) => void }) {
  const open = works(template);
  const hover = useHoverIntent(() => onPreview(template, true));
  return (
    <button
      type="button"
      onClick={() => {
        hover.cancel();
        onPreview(template);
      }}
      onPointerEnter={hover.onPointerEnter}
      onPointerLeave={hover.onPointerLeave}
      aria-label={`Preview the ${template.name} template, ${open ? template.stage : COMING_SOON.toLowerCase()}`}
      className="group relative flex h-24 cursor-pointer items-center justify-between gap-3 overflow-hidden rounded-xl border border-border bg-card pr-5.5 pl-4 text-left outline-none transition-colors duration-fast hover:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span className="flex min-w-0 flex-col gap-1.25">
        <span className="text-sm leading-tight font-semibold text-foreground">{template.name}</span>
        <span className="text-meta font-semibold text-muted-foreground">
          {open ? template.stage : COMING_SOON}
        </span>
      </span>
      <FlatIcon
        name={template.icon}
        size="md"
        className={cn("shrink-0 transition-transform duration-slow ease-out", open ? "group-hover:-translate-y-0.75" : "opacity-30")}
      />
    </button>
  );
}
