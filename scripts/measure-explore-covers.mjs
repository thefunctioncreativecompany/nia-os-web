// Measures the look of every Explore cover (Ika, 2026-10-28: tags for searching and matching):
// black and white or colour, muted or vivid, dark or bright, warm or cool. Writes
// src/features/explore/cover-looks.json, which src/features/explore/tags.ts turns into Look tags.
// Run from the project root after adding covers:
//   node scripts/measure-explore-covers.mjs
import { readdir, readFile, writeFile } from "node:fs/promises";
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

// Whether a title is black and white comes from its palette where it has one (palettes.json,
// measured from frames inside the official trailer): a poster can be monochrome when the film
// isn't (Network, Get Out), and a colourful poster can sell a black-and-white film (Casablanca). Run build-explore-timeline-data.mjs first after adding titles.
const palettes = JSON.parse(await readFile("src/features/explore/palettes.json", "utf8"));
// A greyish trailer can fool it, so after the 1960s (when black and white became rare) the poster
// has to agree too (Shawshank, Inxeba).
const years = Object.fromEntries(JSON.parse(await readFile("src/features/explore/made-in-africa.json", "utf8")).titles.map((t) => [t.slug, t.year]));
const looks = {};
for (const { dir, slug } of FOLDERS) {
  for (const file of (await readdir(dir)).filter((f) => f.endsWith(".jpg")).sort()) {
    const m = await measure(`${dir}/${file}`);
    const tags = [];
    const key = slug(file.replace(/\.jpg$/, ""));
    const posterMono = m.saturation < 0.08;
    const trailerMono = palettes[key]?.isMono;
    const mono = trailerMono === undefined ? posterMono : trailerMono && ((years[key] ?? 9999) < 1968 || posterMono);
    if (mono) tags.push("black-and-white");
    else {
      if (m.saturation < 0.22) tags.push("muted-colour");
      if (m.saturation > 0.42) tags.push("vivid-colour");
      if (m.warmth > 0.03) tags.push("warm-palette");
      if (m.warmth < -0.03) tags.push("cool-palette");
    }
    if (m.lightness < 0.28) tags.push("low-key");
    if (m.lightness > 0.62) tags.push("bright-airy");
    looks[key] = tags;
  }
}
await writeFile("src/features/explore/cover-looks.json", `${JSON.stringify(looks, null, 1)}\n`);
console.log(`Measured ${Object.keys(looks).length} covers.`);
