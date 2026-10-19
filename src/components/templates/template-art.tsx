import { useId } from "react";
import Image from "next/image";

import builtThumbs from "@/data/template-thumbs.json";
import { cn } from "@/lib/utils";
import { familyGradient, type Template } from "@/lib/templates";
import { TemplateIcon } from "@/components/templates/template-icon";

const BUILT = new Set<string>(builtThumbs);

export function hasThumbnail(template: Template) {
  return template.thumbnail !== null && BUILT.has(template.slug);
}

// A template's artwork: the family gradient, then the rendered thumbnail once
// `npm run thumbs` has made it (until then a large icon stands in, or nothing for
// templates not built yet), then film grain. `square` uses the square crop.
export function TemplateArt({
  template,
  square = false,
  sizes,
  className,
}: {
  template: Template;
  square?: boolean;
  sizes: string;
  className?: string;
}) {
  const grain = useId();
  const thumb = hasThumbnail(template) ? template.thumbnail : null;

  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)} style={{ background: familyGradient(template.family, template.variant) }}>
      {thumb ? (
        <Image
          src={square ? thumb.square : thumb.cardFallback}
          alt={template.alt ?? ""}
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-slow ease-out group-hover:scale-[1.035]"
        />
      ) : (
        template.status !== "gap" &&
        !square && (
          <div className="absolute inset-x-0 top-[10%] flex h-[58%] items-center justify-center transition-transform duration-slow ease-out group-hover:scale-[1.035]">
            <TemplateIcon template={template} strokeWidth={1.1} className="size-28 text-white/95 drop-shadow-xl" />
          </div>
        )
      )}
      <svg aria-hidden className="pointer-events-none absolute inset-0 size-full opacity-16 mix-blend-overlay">
        <filter id={grain}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${grain})`} />
      </svg>
    </div>
  );
}
