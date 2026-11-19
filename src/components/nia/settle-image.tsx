"use client";

import Image, { type ImageProps } from "next/image";

// A cover that settles into its frame as it arrives (Ika, 2026-11-18): it waits slightly enlarged
// and, once its picture is loaded and decoded, eases back to its place (`cover-settle` in
// globals.css). A picture that arrives after the page is ready also fades in. Its frame clips it,
// so nothing around it moves. Plays once per picture; reduced motion shows it still.
// `glide` uses Explore's own timing; `settle={false}` skips it (Explore all settles only the view
// you arrive at, not tiles panned to later).
export function SettleImage({
  settle = true,
  glide = false,
  onLoad,
  ...props
}: ImageProps & { settle?: boolean; glide?: boolean }) {
  return (
    <Image
      {...props}
      alt={props.alt}
      // On the server too, so a picture shown before the page is ready already waits enlarged
      // instead of jumping up and back.
      data-cover={settle ? (glide ? "glide" : "") : undefined}
      ref={(img) => {
        // Not drawn yet: it may fade in as well as settle.
        if (img && settle && !img.complete) img.dataset.fresh = "";
      }}
      onLoad={(e) => {
        const img = e.currentTarget;
        // Start only once the picture can be drawn, so the first frames aren't skipped.
        if (settle)
          img
            .decode()
            .catch(() => {})
            .then(() => {
              img.dataset.settled = "";
            });
        onLoad?.(e);
      }}
    />
  );
}
