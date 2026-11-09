"use client";

// Every next/image picture goes through Nia's own resizer (src/app/api/img), not Vercel's: the
// Hobby plan's monthly image allowance ran out on 2026-11-08 and new pictures came back "402
// Payment Required" (Ika, 2026-11-09). The address ends in a picture name so the sign-in check
// (src/proxy.ts) lets it through. To go back to Vercel's resizer (e.g. on Vercel Pro), remove
// `loader` and `loaderFile` from next.config.ts.
export default function niaImageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  // Already sized by its own route (Explore's trailer stills), or not a fetchable address.
  if (src.startsWith("/api/") || src.startsWith("data:") || src.startsWith("blob:")) return `${src}${src.includes("?") ? "&" : "?"}w=${width}`;
  return `/api/img/${width}/${quality ?? 75}/picture.webp?u=${encodeURIComponent(src)}`;
}
