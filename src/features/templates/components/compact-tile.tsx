import { cn } from "@/lib/utils";
import { COMING_SOON, type GalleryTemplate } from "@/features/templates/gallery";
import { FlatIcon } from "@/features/templates/components/flat-icon";

// A small white tile for the Compact view and search results: name and stage on the left,
// the template's icon on the right.
export function CompactTile({ template, onOpen }: { template: GalleryTemplate; onOpen: (template: GalleryTemplate) => void }) {
  const open = template.status !== "gap";
  return (
    <button
      type="button"
      disabled={!open}
      onClick={open ? () => onOpen(template) : undefined}
      aria-label={`${template.name}, ${open ? template.stage : COMING_SOON.toLowerCase()}`}
      className={cn(
        "group relative flex h-24 items-center justify-between gap-3 overflow-hidden rounded-xl border border-border bg-white pr-5.5 pl-4 text-left outline-none transition-colors duration-fast focus-visible:ring-3 focus-visible:ring-ring/50",
        open ? "cursor-pointer hover:border-ring" : "cursor-default",
      )}
    >
      <span className="flex min-w-0 flex-col gap-1.25">
        <span className="text-sm leading-tight font-semibold text-foreground">{template.name}</span>
        <span className="font-mono text-meta font-semibold tracking-wider text-muted-foreground uppercase">
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
