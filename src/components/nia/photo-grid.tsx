"use client";

import { useState } from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";
import { Lightbox, type LightboxImage } from "@/components/nia/lightbox";

// A grid of stills; click one to open it in the lightbox (design system Section 17.1). Images keep
// their own shape, in a grid that fills row by row from the left (2026-11-11: masonry left gaps).
export function PhotoGrid({ images, className }: { images: LightboxImage[]; className?: string }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  return (
    <>
      <ul className={cn("grid grid-cols-2 items-start gap-2.5 sm:grid-cols-3", className)}>
        {images.map((image, i) => (
          <li key={image.title}>
            <button
              type="button"
              aria-label={`Open ${image.title}`}
              onClick={() => {
                setIndex(i);
                setOpen(true);
              }}
              className="block w-full overflow-hidden rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <Image
                src={image.src}
                alt={image.alt}
                sizes="(min-width: 768px) 200px, 50vw"
                className="h-auto w-full transition-transform duration-base ease-out hover:scale-[1.02]"
              />
            </button>
          </li>
        ))}
      </ul>
      <Lightbox images={images} index={index} onIndexChange={setIndex} open={open} onOpenChange={setOpen} />
    </>
  );
}
