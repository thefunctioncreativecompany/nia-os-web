import Image from "next/image";

import { cn } from "@/lib/utils";

// The NIA wordmark from Ika's logo files (design/brand). `light` is the white version for
// photos and dark panels; `dark` is the black one for the page, turned white in dark mode.
// Height sets the size.
const FILES = {
  dark: { src: "/brand/nia-wordmark-black.svg", width: 888, height: 406 },
  light: { src: "/brand/nia-wordmark-white.svg", width: 934, height: 427 },
};

export function Wordmark({ tone = "dark", className }: { tone?: "dark" | "light"; className?: string }) {
  const file = FILES[tone];
  return (
    <Image
      src={file.src}
      width={file.width}
      height={file.height}
      alt="NIA"
      unoptimized
      className={cn("h-5 w-auto", tone === "dark" && "dark:invert", className)}
    />
  );
}
