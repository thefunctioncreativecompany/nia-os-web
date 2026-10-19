"use client";

import { toast } from "sonner";

import manifest from "@/data/templates.manifest.json";
import { toGallery, type GalleryTemplate } from "@/features/templates/gallery";
import type { TemplateEntry } from "@/features/templates/types";
import { CompactTile } from "@/features/templates/components/compact-tile";
import { IndexItem } from "@/features/templates/components/index-item";
import { GalleryCard, GallerySection } from "../_gallery";

// Real templates from the manifest: three ready ones and one coming soon.
const all = (manifest as unknown as { templates: TemplateEntry[] }).templates.map(toGallery);
const SAMPLE = ["D01", "D03", "D15", "G01"].map((code) => all.find((t) => t.code === code)).filter((t): t is GalleryTemplate => !!t);
const preview = (t: GalleryTemplate) => toast(`Preview: ${t.name}`);

// The Templates page's retired views (Ika retired Compact and Index views; kept here in
// case they come back). Both open the preview pop-up on click or a 0.8s mouse rest.
export function TemplateViewsSection() {
  return (
    <GallerySection
      id="template-views"
      number={31}
      title="Templates: retired views"
      figma="744-523"
      description="Compact and Index views from the Templates page, retired in favour of the Showcase and category rows. <CompactTile>, <IndexItem> in src/features/templates/components."
    >
      <GalleryCard title="1. Compact tile" description="Name and stage on the left, the template's line icon on the right." wide>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,15.5rem),1fr))] gap-3.5">
          {SAMPLE.map((t) => <CompactTile key={t.code} template={t} onPreview={preview} />)}
        </div>
      </GalleryCard>
      <GalleryCard title="2. Index item" description="A large line icon with the template's name; coming-soon templates are faded." wide>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,9rem),1fr))] gap-x-5 gap-y-7.5">
          {SAMPLE.map((t) => <IndexItem key={t.code} template={t} onPreview={preview} />)}
        </div>
      </GalleryCard>
    </GallerySection>
  );
}
