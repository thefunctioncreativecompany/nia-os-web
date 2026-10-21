"use client";

import { useState } from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";
import { videoThumbnail, type Video } from "@/lib/explore";

// A video's YouTube thumbnail (Ika, 2026-10-21): the large one, or the smaller one when YouTube
// has no large one for that upload. Fills the nearest positioned parent; nothing for Vimeo.
// Give it `key={video.video_id}` so a new video starts from the large one again.
export function VideoThumbnail({ video, sizes, preload = false, className }: { video: Video; sizes: string; preload?: boolean; className?: string }) {
  const [small, setSmall] = useState(false);
  const src = videoThumbnail(video, small ? "hqdefault" : "maxresdefault");
  if (!src) return null;
  return <Image src={src} alt="" fill sizes={sizes} preload={preload} onError={() => setSmall(true)} className={cn("object-cover", className)} />;
}
