"use client";

import { useState, type CSSProperties } from "react";

/** A poster's shape, as in Explore's cards (title-card.tsx). */
const POSTER = 268 / 373;

// A reference still in a shared page's References row (Ika, 2026-11-11), beside the Explore
// titles: as tall as their posters, at the picture's own shape once it has loaded (cells size
// themselves by `--span`, like `cardSpan`). Opens the full picture. Private files come with
// short-lived links, so they skip the image optimiser (which would keep a copy).
export function ReferenceStill({ url, name, className }: { url: string; name: string; className: string }) {
  const [aspect, setAspect] = useState(POSTER);
  const measure = (img: HTMLImageElement | null) => {
    if (img?.complete && img.naturalWidth && img.naturalHeight) setAspect(img.naturalWidth / img.naturalHeight);
  };
  return (
    <li className={className} style={{ "--span": aspect / POSTER } as CSSProperties}>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        aria-label={`Open ${name}`}
        className="group block overflow-hidden rounded-lg bg-muted outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        style={{ aspectRatio: aspect }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- short-lived links (see above) */}
        <img
          src={url}
          alt={name}
          loading="lazy"
          // A picture that loaded before the page woke up is measured straight away.
          ref={measure}
          onLoad={(e) => measure(e.currentTarget)}
          className="size-full object-cover transition-transform duration-base ease-out group-hover:scale-[1.02] motion-reduce:transition-none"
        />
      </a>
    </li>
  );
}
