// Turns each Spline export in design/thumbnails/masters/{slug}.master.png into the four
// web images the Templates gallery uses (TEMPLATE_THUMBNAILS.md Section 7), and writes
// src/data/template-thumbs.json so the gallery knows which templates have one.
// Run with `npm run thumbs`. Templates without a master keep their family gradient.
import { existsSync } from "node:fs";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import sharp from "sharp";

const manifest = JSON.parse(await readFile("src/data/templates.manifest.json", "utf8"));
await mkdir("public/templates", { recursive: true });

const KB = 1024;
const CARD = { width: 1120, height: 770, maxBytes: 120 * KB };
const CARD_SMALL = { width: 560, height: 385, maxBytes: 60 * KB };
const SQUARE = { size: 512, maxBytes: 40 * KB };

// Lower the quality step by step until the file is under its size target.
async function encode(pipeline, format, path, maxBytes) {
  for (let quality = 82; quality >= 30; quality -= 6) {
    const buffer = await pipeline.clone()[format]({ quality }).toBuffer();
    if (buffer.length <= maxBytes || quality - 6 < 30) {
      await writeFile(path, buffer);
      return { bytes: buffer.length, quality };
    }
  }
}

const built = [];
for (const template of manifest.templates) {
  const master = template.thumbnail?.master;
  if (!master || !existsSync(master)) continue;

  const image = sharp(master);
  const { width, height } = await image.metadata();
  const card = image.clone().resize(CARD.width, CARD.height, { fit: "cover" });
  const small = image.clone().resize(CARD_SMALL.width, CARD_SMALL.height, { fit: "cover" });
  // The square is the middle of the picture: height × height, centred.
  const left = Math.round((width - height) / 2);
  const square = image.clone().extract({ left: Math.max(0, left), top: 0, width: Math.min(width, height), height }).resize(SQUARE.size, SQUARE.size);

  const out = `public/templates/${template.slug}`;
  const results = [
    await encode(card, "avif", `${out}-card.avif`, CARD.maxBytes),
    await encode(card, "webp", `${out}-card.webp`, CARD.maxBytes),
    await encode(small, "webp", `${out}-card-sm.webp`, CARD_SMALL.maxBytes),
    await encode(square, "webp", `${out}-square.webp`, SQUARE.maxBytes),
  ];
  built.push(template.slug);
  console.log(`${template.slug}: ${results.map((r) => `${Math.round(r.bytes / KB)}KB@q${r.quality}`).join(", ")}`);
}

await writeFile("src/data/template-thumbs.json", `${JSON.stringify(built, null, 2)}\n`);
const masters = (await stat("design/thumbnails/masters").catch(() => null)) ? "" : " (no masters folder yet)";
console.log(`${built.length} of ${manifest.templates.length} templates have thumbnails${masters}.`);
