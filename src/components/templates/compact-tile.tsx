import { cn } from "@/lib/utils";
import { COMING_SOON, familyGradient, type Template } from "@/lib/templates";
import { TemplateIcon } from "@/components/templates/template-icon";
import { TemplateArt, hasThumbnail } from "@/components/templates/template-art";

// The small Compact view tile: name and stage on a soft family tint, with two stacked
// mini cards bleeding off the bottom edge (TEMPLATE_THUMBNAILS.md Section 8b).
export function CompactTile({ template, onUse }: { template: Template; onUse: (template: Template) => void }) {
  const open = template.status !== "gap";
  const f = template.family;

  return (
    <button
      type="button"
      disabled={!open}
      onClick={open ? () => onUse(template) : undefined}
      aria-label={open ? `Use the ${template.name} template, ${template.stage}` : `${template.name}, coming soon`}
      className={cn(
        "group relative h-24 overflow-hidden rounded-xl border border-foreground/8 text-left outline-none transition-all duration-fast ease-out focus-visible:ring-3 focus-visible:ring-ring/50",
        open ? "cursor-pointer hover:-translate-y-0.5 hover:border-foreground/13 hover:shadow-menu" : "cursor-default",
      )}
      style={{
        background: `linear-gradient(100deg, color-mix(in oklab, var(--family-${f}-light) 40%, white) 0%, color-mix(in oklab, var(--family-${f}-light) 67%, white) 100%)`,
      }}
    >
      <span className="absolute inset-y-0 right-28 left-4 flex flex-col justify-center gap-1">
        <span className="text-sm leading-tight font-semibold text-foreground">{template.name}</span>
        <span className="font-mono text-tiny font-semibold tracking-wider text-foreground/60 uppercase">{open ? template.stage : COMING_SOON}</span>
      </span>
      <span
        aria-hidden
        className={cn(
          "absolute top-6 right-2.5 h-17.5 w-15 rounded-lg opacity-32 transition-transform duration-base ease-out",
          open ? "rotate-9 group-hover:rotate-12" : "rotate-9",
        )}
        style={{ background: `var(--family-${f}-core)` }}
      />
      <span
        aria-hidden
        className={cn(
          "absolute top-5.5 right-7.5 flex h-19 w-17 -rotate-5 items-center justify-center overflow-hidden rounded-lg shadow-menu transition-[top] duration-base ease-out",
          open ? "group-hover:top-4.5" : "opacity-55",
        )}
        style={{ background: familyGradient(f, template.variant) }}
      >
        {hasThumbnail(template) ? (
          <TemplateArt template={template} square sizes="68px" />
        ) : (
          <TemplateIcon template={template} strokeWidth={1.6} className="-mt-1.5 size-7.5 text-white" />
        )}
      </span>
    </button>
  );
}
