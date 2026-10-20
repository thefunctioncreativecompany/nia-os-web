"use client";

import Image, { type StaticImageData } from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

export type LightboxImage = { src: StaticImageData | string; alt: string; title: string };

const navClassName =
  "absolute top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white outline-none hover:bg-black/60 focus-visible:ring-3 focus-visible:ring-white/50";

// Full-screen dark viewer for stills (design system Section 17.5). Left and right
// arrow keys step through; Esc closes.
export function Lightbox({
  images,
  index,
  onIndexChange,
  open,
  onOpenChange,
}: {
  images: LightboxImage[];
  index: number;
  onIndexChange: (next: number) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const image = images[index];
  const step = (by: number) => onIndexChange((index + by + images.length) % images.length);
  if (!image) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") step(-1);
          if (e.key === "ArrowRight") step(1);
        }}
        className="flex h-[min(720px,90svh)] w-[min(1100px,calc(100vw-2rem))] max-w-none flex-col gap-4 border-0 bg-primary p-4 text-white sm:max-w-none md:p-6"
      >
        <div className="flex items-center justify-between gap-4">
          <DialogTitle className="truncate text-base text-white">
            {image.title} <span className="font-normal text-white/60">({index + 1} of {images.length})</span>
          </DialogTitle>
          <DialogDescription className="sr-only">Use the left and right arrow keys to move between images.</DialogDescription>
          <DialogClose aria-label="Close viewer" className="flex size-8 shrink-0 items-center justify-center rounded-full text-white outline-none hover:bg-white/10 focus-visible:ring-3 focus-visible:ring-white/50">
            <X aria-hidden className="size-5" />
          </DialogClose>
        </div>
        <div className="relative min-h-0 flex-1">
          <Image src={image.src} alt={image.alt} fill sizes="(min-width: 1100px) 1000px, 100vw" className="object-contain" />
          {images.length > 1 && (
            <>
              <button type="button" aria-label="Previous image" onClick={() => step(-1)} className={`${navClassName} left-0`}>
                <ChevronLeft aria-hidden className="size-6" />
              </button>
              <button type="button" aria-label="Next image" onClick={() => step(1)} className={`${navClassName} right-0`}>
                <ChevronRight aria-hidden className="size-6" />
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
