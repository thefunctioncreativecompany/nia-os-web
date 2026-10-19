"use client";

import { useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

export type PhotoAdjustments = { crop: Point; zoom: number; rotation: number };
export const DEFAULT_ADJUSTMENTS: PhotoAdjustments = { crop: { x: 0, y: 0 }, zoom: 1, rotation: 0 };

// Crop with zoom and rotate: round for profile photos, rectangular for covers. Returns a
// JPEG of the framed area, `outputWidth` pixels wide.
export function PhotoEditor({
  open,
  title,
  description = "Drag to reposition. Zoom and rotate to frame your face.",
  src,
  initial = DEFAULT_ADJUSTMENTS,
  aspect = 1,
  shape = "round",
  outputWidth = 512,
  onCancel,
  onApply,
}: {
  open: boolean;
  title: string;
  description?: string;
  src: string;
  initial?: PhotoAdjustments;
  aspect?: number;
  shape?: "round" | "rect";
  outputWidth?: number;
  onCancel: () => void;
  onApply: (result: { blob: Blob; adjustments: PhotoAdjustments }) => void;
}) {
  const [crop, setCrop] = useState(initial.crop);
  const [zoom, setZoom] = useState(initial.zoom);
  const [rotation, setRotation] = useState(initial.rotation);
  const [area, setArea] = useState<Area | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  const apply = async () => {
    if (!area) return;
    setIsWorking(true);
    try {
      const blob = await cropToJpeg(src, area, rotation, outputWidth, Math.round(outputWidth / aspect));
      onApply({ blob, adjustments: { crop, zoom, rotation } });
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className={shape === "rect" ? "sm:max-w-xl" : "sm:max-w-md"}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="relative h-72 overflow-hidden rounded-lg bg-nia-footer">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            cropShape={shape}
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={(_, pixels) => setArea(pixels)}
          />
        </div>
        <div className="flex items-center gap-4">
          <Label htmlFor="photo-zoom" className="text-small font-medium">
            Zoom
          </Label>
          <Slider
            id="photo-zoom"
            min={1}
            max={3}
            step={0.01}
            value={[zoom]}
            onValueChange={([value]) => setZoom(value)}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Rotate 90 degrees"
            onClick={() => setRotation((r) => (r + 90) % 360)}
          >
            <RotateCw />
          </Button>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" disabled={!area || isWorking} onClick={apply}>
            {isWorking ? "Applying…" : "Apply"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

async function cropToJpeg(src: string, area: Area, rotation: number, width: number, height: number) {
  const image = new Image();
  // Saved photos come from Storage on another domain; ask for them in a way the canvas can read.
  if (/^https?:/.test(src)) image.crossOrigin = "anonymous";
  image.src = src;
  await image.decode();

  // Draw the photo rotated onto a canvas big enough to hold it; `area` is measured there.
  const radians = (rotation * Math.PI) / 180;
  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));
  const rotated = document.createElement("canvas");
  rotated.width = image.width * cos + image.height * sin;
  rotated.height = image.width * sin + image.height * cos;
  const rotatedContext = rotated.getContext("2d")!;
  rotatedContext.translate(rotated.width / 2, rotated.height / 2);
  rotatedContext.rotate(radians);
  rotatedContext.drawImage(image, -image.width / 2, -image.height / 2);

  const output = document.createElement("canvas");
  output.width = width;
  output.height = height;
  const context = output.getContext("2d")!;
  // JPEG has no transparency; give see-through PNGs a white background.
  context.fillStyle = "#fff";
  context.fillRect(0, 0, width, height);
  context.drawImage(rotated, area.x, area.y, area.width, area.height, 0, 0, width, height);

  return new Promise<Blob>((resolve, reject) =>
    output.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Couldn't process that image"))),
      "image/jpeg",
      0.9,
    ),
  );
}
