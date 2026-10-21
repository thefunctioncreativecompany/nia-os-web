"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

// The cropper (and its library) loads only when someone picks a cover, not with the page.
const PhotoEditor = dynamic(() => import("@/components/nia/photo-editor").then((m) => m.PhotoEditor), { ssr: false });

// Covers are framed to the ProjectCard shape (19:10); the project page header shows the
// middle of the same picture.
const COVER_ASPECT = 19 / 10;

// Opens the cropper for a cover picture and hands back the framed JPEG as a File.
// `start` takes a picked file or the URL of the current cover (to reposition it).
export function useCoverCropper(onCropped: (file: File) => void | Promise<void>) {
  const [src, setSrc] = useState<string | null>(null);

  const close = () => {
    if (src?.startsWith("blob:")) URL.revokeObjectURL(src);
    setSrc(null);
  };

  const start = (source: File | string) => setSrc(typeof source === "string" ? source : URL.createObjectURL(source));

  const dialog = src ? (
    <PhotoEditor
      open
      title="Frame the cover"
      description="Drag to reposition. Zoom and rotate to frame the shot."
      src={src}
      aspect={COVER_ASPECT}
      shape="rect"
      outputWidth={1600}
      onCancel={close}
      onApply={async ({ blob }) => {
        close();
        await onCropped(new File([blob], "cover.jpg", { type: "image/jpeg" }));
      }}
    />
  ) : null;

  return { start, dialog };
}
