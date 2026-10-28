// Measures the look of every Explore cover (Ika, 2026-10-28: tags for searching and matching):
// black and white or colour, muted or vivid, dark or bright, warm or cool. Writes
// src/features/explore/cover-looks.json, which src/features/explore/tags.ts turns into Look tags.
// Run from the project root after adding covers:
//   node scripts/measure-explore-covers.mjs
import { readdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const FOLDERS = [
  { dir: "public/explore/creators", slug: (name) => `creator-${name}` },
  { dir: "public/explore/made-in-africa", slug: (name) => name },
];

async function measure(file) {
  const { data } = await sharp(file).resize(64, 64, { fit: "inside" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let sat = 0, light = 0, warm = 0, n = 0;
  for (let i = 0; i < data.length; i += 3) {
    const [r, g, b] = [data[i] / 255, data[i + 1] / 255, data[i + 2] / 255];
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const s = max === 0 ? 0 : (max - min) / max;
    sat += s;
    light += 0.2126 * r + 0.7152 * g + 0.0722 * b;
    // Warmth counts only where there's colour to judge.
    warm += (r - b) * s;
    n++;
  }
  return { saturation: sat / n, lightness: light / n, warmth: warm / n };
}

const looks = {};
for (const { dir, slug } of FOLDERS) {
  for (const file of (await readdir(dir)).filter((f) => f.endsWith(".jpg")).sort()) {
    const m = await measure(`${dir}/${file}`);
    const tags = [];
    if (m.saturation < 0.08) tags.push("black-and-white");
    else {
      if (m.saturation < 0.22) tags.push("muted-colour");
      if (m.saturation > 0.42) tags.push("vivid-colour");
      if (m.warmth > 0.03) tags.push("warm-palette");
      if (m.warmth < -0.03) tags.push("cool-palette");
    }
    if (m.lightness < 0.28) tags.push("low-key");
    if (m.lightness > 0.62) tags.push("bright-airy");
    looks[slug(file.replace(/\.jpg$/, ""))] = tags;
  }
}
await writeFile("src/features/explore/cover-looks.json", `${JSON.stringify(looks, null, 1)}\n`);
console.log(`Measured ${Object.keys(looks).length} covers.`);
