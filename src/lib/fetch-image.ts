import "server-only";

import sharp, { type Sharp } from "sharp";

// Guardrails for every picture Nia downloads and resizes on the server (security audit,
// 2026-11-15): the image resizer (/api/img), Explore's trailer stills and Instagram covers.
// - At most `maxBytes` is ever read: the size the server states is checked first, then the
//   download stops as soon as it passes the cap (a server can lie about its size).
// - Only pictures (`image/*`), within a time limit.
// - Redirects are refused unless the caller checks where it landed (`landedOn`).
// - Sharp refuses a picture over MAX_PIXELS before decoding it, so a small file that claims to
//   be enormous (a "decompression bomb") can't use up the server's memory.

/** The largest upload Nia accepts (project files, 50 MB), so anything Nia stores can be resized. */
export const MAX_IMAGE_BYTES = 50 * 1024 * 1024;
/** 100 megapixels: a medium-format camera's full frame. */
export const MAX_PIXELS = 100_000_000;

type Options = {
  maxBytes?: number;
  timeoutMs?: number;
  headers?: HeadersInit;
  /** Follow redirects, then accept the answer only if this says the final address is allowed. */
  landedOn?: (url: URL) => boolean;
};

export async function fetchImage(url: string | URL, { maxBytes = MAX_IMAGE_BYTES, timeoutMs = 15_000, headers, landedOn }: Options = {}): Promise<Buffer | null> {
  const response = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(timeoutMs),
    redirect: landedOn ? "follow" : "error",
    cache: "no-store",
  }).catch(() => null);
  if (!response?.ok || !response.body) return null;
  if (landedOn && !landedOn(new URL(response.url))) return null;
  if (!response.headers.get("content-type")?.startsWith("image/")) return null;
  const stated = Number(response.headers.get("content-length"));
  if (stated > maxBytes) return null;

  const chunks: Uint8Array[] = [];
  let total = 0;
  const reader = response.body.getReader();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => {});
        return null;
      }
      chunks.push(value);
    }
  } catch {
    return null;
  }
  return Buffer.concat(chunks);
}

/** Sharp with the pixel limit. Use in place of `sharp(buffer)` for anything downloaded. */
export const safeSharp = (input: Buffer): Sharp => sharp(input, { limitInputPixels: MAX_PIXELS });
