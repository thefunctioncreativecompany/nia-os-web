// A contact sheet of Explore posters, to check a new batch by eye in one picture (2026-11-19).
//   node scripts/contact-sheet.mjs <batch.json> <out.png>
// Each poster at 200 wide in a row of five, its slug's place in the batch in reading order.
import fs from "node:fs";
import sharp from "sharp";

const [batchFile, out] = process.argv.slice(2);
const batch = JSON.parse(fs.readFileSync(batchFile, "utf8"));
const W = 200, H = 300, COLS = 5;
const tiles = [];
for (const [i, t] of batch.entries()) {
  const file = `public/explore/made-in-africa/${t.slug}.jpg`;
  if (!fs.existsSync(file)) continue;
  tiles.push({ input: await sharp(file).resize(W, H, { fit: "cover" }).toBuffer(), left: (i % COLS) * W, top: Math.floor(i / COLS) * H });
}
const rows = Math.ceil(batch.length / COLS);
await sharp({ create: { width: COLS * W, height: rows * H, channels: 3, background: "#808080" } }).composite(tiles).png().toFile(out);
console.log(`${tiles.length} posters → ${out}`);
