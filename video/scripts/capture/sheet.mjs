// A contact sheet of one film's shots, to check them by eye: node scripts/capture/sheet.mjs <film> <out.png>
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const sharp = require("sharp");
const [film, out] = process.argv.slice(2);
const dir = path.resolve(import.meta.dirname, "../../screens", film);
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".png")).sort((a, b) => fs.statSync(path.join(dir, a)).mtimeMs - fs.statSync(path.join(dir, b)).mtimeMs);
const W = 480, H = 270, COLS = 4;
const tiles = [];
for (const [i, f] of files.entries()) {
  const left = (i % COLS) * (W + 6), top = Math.floor(i / COLS) * (H + 26);
  tiles.push({ input: await sharp(path.join(dir, f)).resize(W, H).toBuffer(), left, top });
  tiles.push({ input: Buffer.from(`<svg width="${W}" height="22"><rect width="100%" height="22" fill="#000"/><text x="4" y="16" font-size="14" fill="#fff" font-family="sans-serif">${i + 1}. ${f}</text></svg>`), left, top: top + H });
}
await sharp({ create: { width: COLS * (W + 6), height: Math.ceil(files.length / COLS) * (H + 26), channels: 3, background: "#444" } }).composite(tiles).png().toFile(out);
console.log("wrote", out);
