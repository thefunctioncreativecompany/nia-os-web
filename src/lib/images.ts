// Browser-only image helpers.

export const COVER_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_COVER_BYTES = 10 * 1024 * 1024;

// Scales a photo down to at most `maxWidth` wide and re-encodes it as JPEG, so a 12 MB
// phone photo uploads as a few hundred KB.
export async function shrinkImage(file: File, maxWidth = 1920): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const scale = Math.min(1, maxWidth / image.naturalWidth);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);
    const context = canvas.getContext("2d")!;
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Couldn't process that image"))),
        "image/jpeg",
        0.88,
      ),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function checkCoverFile(file: File) {
  if (!COVER_TYPES.includes(file.type)) return "Choose a JPG, PNG or WebP image.";
  if (file.size > MAX_COVER_BYTES) return "That image is over 10MB. Choose a smaller one.";
  return null;
}
