import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { WORKFLOWS } from "@/lib/template-workflows";
import { COMING_SOON, type GalleryTemplate } from "@/features/templates/gallery";
import { FlatIcon } from "@/features/templates/components/flat-icon";
import { MiniMap } from "@/features/templates/components/mini-map";

// The large Showcase card (TEMPLATES_BUILD.md §2, prototype TemplateCard): title and stage
// above a flat 16:11 card with the template's icon, its one-line description, and a mini
// map on workflow templates. Hovering shows "Use template".
export function TemplateCard({
  template,
  onOpen,
  badge,
  className,
}: {
  template: GalleryTemplate;
  onOpen: (template: GalleryTemplate) => void;
  badge?: string;
  className?: string;
}) {
  const open = template.status !== "gap";
  const workflow = template.kind === "workflow" ? WORKFLOWS[template.slug] : undefined;

  return (
    <div className={cn("w-140 max-w-[calc(100vw-2rem)] shrink-0 snap-start", className)}>
      <div className="mb-3">
        {badge && (
          <span className="mb-1.5 inline-block rounded-full border border-foreground px-2 py-0.5 font-mono text-tiny font-semibold tracking-wider uppercase">
            {badge}
          </span>
        )}
        <h3 className="text-title font-semibold text-foreground">{template.name}</h3>
        <p className="mt-0.5 text-lead text-muted-foreground">{template.stage}</p>
      </div>
      <button
        type="button"
        disabled={!open}
        onClick={open ? () => onOpen(template) : undefined}
        aria-label={open ? `Use the ${template.name} template` : `${template.name} template, ${COMING_SOON.toLowerCase()}`}
        className={cn(
          "group relative flex aspect-[16/11] w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-white text-left outline-none transition-colors duration-fast focus-visible:ring-3 focus-visible:ring-ring/50",
          open ? "cursor-pointer hover:border-ring" : "cursor-default",
        )}
      >
        <FlatIcon
          name={template.icon}
          size="xl"
          className={cn("-mt-12 transition-transform duration-slow ease-out", open ? "group-hover:-translate-y-1" : "opacity-30")}
        />
        {open ? (
          <span className="absolute top-4 right-4 inline-flex -translate-y-1 items-center gap-1.5 rounded-full bg-foreground px-3.5 py-2 text-small font-semibold text-primary-foreground opacity-0 transition-all duration-base ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
            Use template <ArrowRight aria-hidden className="size-3.5" />
          </span>
        ) : (
          <span className="absolute top-4 left-4 rounded-full border border-foreground px-3 py-1.5 font-mono text-micro font-semibold tracking-wider text-foreground uppercase">
            {COMING_SOON}
          </span>
        )}
        {template.preview && (
          <p className={cn("absolute bottom-5 left-5.5 line-clamp-2 text-lead leading-normal text-foreground/80", workflow ? "right-43" : "right-5.5")}>
            {template.preview}
          </p>
        )}
        {workflow && (
          <div className="absolute right-4.5 bottom-4.5">
            <MiniMap workflow={workflow} />
          </div>
        )}
      </button>
    </div>
  );
}
