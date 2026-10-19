import { cn } from "@/lib/utils";
import { COMING_SOON, type GalleryTemplate } from "@/features/templates/gallery";
import { FlatIcon } from "@/features/templates/components/flat-icon";

// The Index view's item, product-index style: a large black icon on white and the
// template's product code; pointing at it swaps the code for the name.
export function IndexItem({ template, onOpen }: { template: GalleryTemplate; onOpen: (template: GalleryTemplate) => void }) {
  const open = template.status !== "gap";
  return (
    <button
      type="button"
      disabled={!open}
      onClick={open ? () => onOpen(template) : undefined}
      title={template.name}
      aria-label={`${template.name}, ${template.sku}${open ? "" : `, ${COMING_SOON.toLowerCase()}`}`}
      className={cn(
        "group flex min-w-0 flex-col items-center gap-3.5 rounded-xl px-1.5 pt-2.5 pb-4.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        open ? "cursor-pointer" : "cursor-default opacity-30",
      )}
    >
      <span className="flex aspect-square w-full max-w-52.5 items-center justify-center transition-transform duration-slow ease-out group-hover:-translate-y-1">
        <FlatIcon name={template.icon} size="lg" />
      </span>
      <span className="relative h-5 w-full text-center font-mono uppercase">
        <span className="absolute inset-0 truncate text-lead leading-5 tracking-widest text-foreground transition-opacity duration-fast group-hover:opacity-0 group-focus-visible:opacity-0">
          {template.sku}
        </span>
        <span className="absolute inset-0 truncate text-micro leading-5 tracking-wider text-foreground opacity-0 transition-opacity duration-fast group-hover:opacity-100 group-focus-visible:opacity-100">
          {template.name}
        </span>
      </span>
    </button>
  );
}
