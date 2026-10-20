"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { workingSuggestions } from "@/features/templates/recommend";
import type { GalleryTemplate } from "@/features/templates/gallery";
import type { UserTemplateProfile } from "@/features/templates/types";
import { TemplateCard } from "@/features/templates/components/template-card";

type Preview = (template: GalleryTemplate, list: GalleryTemplate[], viaHover?: boolean) => void;

// Phones (Ika, after Apple Music): the templates suggested for this person as a row of large
// cards, slightly smaller than desktop's, with the next one peeking in.
export function SuggestedRow({
  templates,
  profile,
  ready,
  onPreview,
  onUse,
}: {
  templates: GalleryTemplate[];
  profile: UserTemplateProfile;
  ready: boolean;
  onPreview: Preview;
  onUse: (template: GalleryTemplate) => void;
}) {
  // Worked out once the person's history has loaded (it reads the clock).
  const suggested = ready ? workingSuggestions(templates, profile).map((s) => s.template) : [];
  return (
    <section aria-labelledby="m-suggested" className="pt-7">
      <h2 id="m-suggested" className="mb-3 px-4 text-lg font-extrabold text-foreground">Suggested for you</h2>
      <div className="flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 [scrollbar-width:none]">
        {ready
          ? suggested.map((t) => (
              <TemplateCard key={t.code} template={t} size="small" onPreview={(x) => onPreview(x, suggested)} onUse={onUse} className="w-[78%] max-w-none" />
            ))
          : Array.from({ length: 2 }, (_, i) => <Skeleton key={i} className="aspect-[16/11] w-[78%] shrink-0 rounded-xl" />)}
      </div>
    </section>
  );
}
