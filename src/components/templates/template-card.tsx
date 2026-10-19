import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { templateLabel, type Template } from "@/lib/templates";
import { WORKFLOWS } from "@/lib/template-workflows";
import { MiniMap } from "@/components/templates/mini-map";
import { TemplateArt } from "@/components/templates/template-art";

// The large Showcase card, Apple Music style: label · title · stage above 16:11 artwork
// with the description, and a mini map on workflow templates (TEMPLATE_THUMBNAILS.md
// Section 8). Templates not built yet can't be opened.
export function TemplateCard({
  template,
  onUse,
  badge,
  className,
}: {
  template: Template;
  onUse: (template: Template) => void;
  badge?: string;
  className?: string;
}) {
  const open = template.status !== "gap";
  const workflow = template.kind === "workflow" ? WORKFLOWS[template.slug] : undefined;

  return (
    <div className={cn("w-140 max-w-[calc(100vw-2rem)] shrink-0 snap-start", className)}>
      <div className="mb-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-micro font-semibold tracking-wider text-muted-foreground uppercase">{templateLabel(template)}</span>
          {badge && <span className="rounded-full bg-accent px-2 py-0.5 font-mono text-tiny font-semibold tracking-wider uppercase">{badge}</span>}
        </div>
        <h3 className="mt-1.5 text-title font-semibold text-foreground">{template.name}</h3>
        <p className="mt-0.5 text-lead text-muted-foreground">{template.stage}</p>
      </div>
      <button
        type="button"
        disabled={!open}
        onClick={open ? () => onUse(template) : undefined}
        aria-label={open ? `Use the ${template.name} template` : `${template.name} template, coming soon`}
        className={cn(
          "group relative block aspect-[16/11] w-full overflow-hidden rounded-xl border border-foreground/8 text-left shadow-card outline-none transition-[translate,box-shadow] duration-base ease-out focus-visible:ring-3 focus-visible:ring-ring/50",
          open ? "cursor-pointer hover:-translate-y-0.75 hover:shadow-card-hover" : "cursor-default",
        )}
      >
        <TemplateArt template={template} sizes="(min-width: 640px) 560px, 100vw" />
        <div aria-hidden className="template-fade absolute inset-0" />
        {open ? (
          <span className="absolute top-4 right-4 inline-flex -translate-y-1 items-center gap-1.5 rounded-full bg-white/92 px-3.5 py-2 text-small font-semibold text-foreground opacity-0 transition-all duration-base ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
            Use template <ArrowRight aria-hidden className="size-3.5" />
          </span>
        ) : (
          <span className="absolute top-4 left-4 rounded-full border border-white/30 bg-white/16 px-3 py-1.5 font-mono text-micro font-semibold tracking-wider text-white uppercase backdrop-blur-sm">
            Coming soon
          </span>
        )}
        {template.preview && (
          <p className={cn("absolute bottom-5 left-5.5 line-clamp-2 text-lead leading-normal text-white", workflow ? "right-43" : "right-5.5")}>
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
