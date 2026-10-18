import Image, { type StaticImageData } from "next/image";

import { cn } from "@/lib/utils";

export type StoryboardFrame = { id: string; src: StaticImageData | string; code: string; caption: string };

// Storyboard frames in order, each with its shot code and a short note
// (design system Section 17.3).
export function StoryboardGrid({ frames, className }: { frames: StoryboardFrame[]; className?: string }) {
  return (
    <ol className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3", className)}>
      {frames.map((frame) => (
        <li key={frame.id} className="flex flex-col gap-1.5">
          <span className="relative block aspect-video overflow-hidden rounded-md border border-border bg-white">
            <Image src={frame.src} alt={frame.caption} fill sizes="(min-width: 640px) 160px, 45vw" className="object-cover grayscale" />
          </span>
          <span className="text-micro font-bold text-foreground">{frame.code}</span>
          <span className="-mt-1 text-micro text-muted-foreground">{frame.caption}</span>
        </li>
      ))}
    </ol>
  );
}
