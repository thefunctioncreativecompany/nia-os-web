"use client";

import { cn } from "@/lib/utils";
import { COMING_SOON, works, type GalleryTemplate } from "@/features/templates/gallery";
import { useHoverIntent } from "@/features/templates/use-hover-intent";
import { FlatIcon } from "@/features/templates/components/flat-icon";

// The Index view's item, product-index style: a large black icon on white with the
// template's name under it (Ika: names, not product codes).
export function IndexItem({ template, onPreview }: { template: GalleryTemplate; onPreview: (template: GalleryTemplate, viaHover?: boolean) => void }) {
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
      aria-label={`Preview the ${template.name} template${open ? "" : `, ${COMING_SOON.toLowerCase()}`}`}
      className={cn(
        "group flex min-w-0 cursor-pointer flex-col items-center gap-3.5 rounded-xl px-1.5 pt-2.5 pb-4.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        !open && "opacity-30",
      )}
    >
      <span className="flex aspect-square w-full max-w-52.5 items-center justify-center transition-transform duration-slow ease-out group-hover:-translate-y-1">
        <FlatIcon name={template.icon} size="lg" />
      </span>
      <span className="line-clamp-2 w-full text-center text-sm font-medium text-foreground">{template.name}</span>
    </button>
  );
}
