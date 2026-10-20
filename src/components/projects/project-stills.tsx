import { ImagePlus } from "lucide-react";

import type { ProjectFile } from "@/lib/projects-data";

// "Stills" (Figma 824:23124): the project's pictures in a row that runs off the edge, newest
// first; each one, and the Add stills tile, leads to Files & references below.
export function ProjectStills({ files, canEdit }: { files: ProjectFile[]; canEdit: boolean }) {
  const stills = files.filter((f) => f.kind === "image" && f.url).slice(0, 10);
  if (!stills.length)
    return canEdit ? (
      <a
        href="#files"
        className="flex aspect-[19/10] w-56 flex-col items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-border bg-nia-panel text-small font-semibold text-muted-foreground outline-none transition-colors duration-fast hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <ImagePlus aria-hidden className="size-6" strokeWidth={1.5} />
        Add stills
      </a>
    ) : (
      <p className="text-small text-muted-foreground">No stills yet.</p>
    );
  return (
    <ul className="-mr-4 flex snap-x gap-3 overflow-x-auto pr-4 pb-1 [scrollbar-width:none] md:-mr-15 md:pr-15">
      {stills.map((f) => (
        <li key={f.id} className="shrink-0 snap-start">
          <a href="#files" aria-label={`${f.name}, in Files & references`} className="block aspect-[19/10] w-60 overflow-hidden rounded-2xl bg-muted outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            {/* eslint-disable-next-line @next/next/no-img-element -- private files use short-lived links, which the image optimiser would cache */}
            <img src={f.url!} alt="" loading="lazy" className="size-full object-cover transition-transform duration-base ease-out hover:scale-[1.03]" />
          </a>
        </li>
      ))}
    </ul>
  );
}
