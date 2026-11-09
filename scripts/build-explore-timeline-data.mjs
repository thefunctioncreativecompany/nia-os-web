// What Explore's Timeline and Colour views need for every title (Ika, 2026-11-02;
// design-ref EXPLORE_TIMELINE_SPEC.md, step A):
//
//   release-dates.json  the day each film or series came out, from Wikidata (the earliest
//                       release, usually its premiere; a series' first episode), with how exact
//                       it is (day, month or year). Creator films use their posting day. Titles
//                       Wikidata can't date keep their year.
//   palettes.json       each title's five main colours (share of the picture, CIELAB), its
//                       dominant colour, hue, chroma, lightness, warm/cool/neutral and black and
//                       white. Measured from frames inside the official trailer where there is
//                       one (posters carry titles and logos that skew the colour), else the
//                       cover; creator films from their own still. Black bars are cut first.
//
// Run from the project root after adding titles (both files are rewritten in full):
//   node scripts/build-explore-timeline-data.mjs
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import sharp from "sharp";

const UA = "NiaOS/1.0 (nia@niatechnologies.co)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(url, as = "json") {
  for (let i = 0; i < 3; i++) {
    const r = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(30000) }).catch(() => null);
    if (r?.ok) return as === "json" ? r.json() : Buffer.from(await r.arrayBuffer());
    if (r && r.status === 404) return null;
    await sleep(1500 * (i + 1));
  }
  return null;
}

// ---- The library: titles, press-kit films, creator films ----
const library = JSON.parse(await readFile("src/features/explore/made-in-africa.json", "utf8"));
const credits = JSON.parse(await readFile("src/features/explore/film-credits.json", "utf8"));
const items = library.titles.map((t) => ({
  key: t.slug,
  year: t.year ?? null,
  series: /series/i.test(t.type),
  video: t.videos?.find((v) => v.is_primary && v.provider === "youtube")?.video_id ?? t.videos?.find((v) => v.provider === "youtube")?.video_id ?? null,
  cover: `public/explore/made-in-africa/${t.slug}.jpg`,
}));
const filmSource = await readFile("src/components/explore/film-details.ts", "utf8");
const consts = Object.fromEntries([...filmSource.matchAll(/^const ([A-Z_]+): FilmDetails = \{([\s\S]*?)^\};/gm)].map((m) => [m[1], m[2]]));
for (const m of filmSource.slice(filmSource.indexOf("export const FILM_DETAILS")).matchAll(/^ {2}("?[a-z0-9-]+"?): (?:\{([\s\S]*?)^ {2}\}|([A-Z_]+)),$/gm)) {
  const body = m[2] ?? consts[m[3]] ?? "";
  const id = m[1].replaceAll('"', "");
  items.push({
    key: `film-${id}`,
    year: Number(body.match(/year: (\d{4})/)?.[1]) || null,
    series: /kind: "[^"]*series/i.test(body),
    video: body.match(/video: \{ id: "([^"]+)"/)?.[1] ?? null,
    cover: `public/explore/posters/${id}.jpg`,
  });
}
const creatorSource = await readFile("src/features/explore/creators.ts", "utf8");
for (const m of creatorSource.matchAll(/code: "([^"]+)",[\s\S]*?date: "(\d{4}-\d{2}-\d{2})"/g)) {
  items.push({ key: `creator-${m[1]}`, date: m[2], video: null, cover: `public/explore/creators/${m[1]}.jpg` });
}
console.log(`${items.length} titles`);

// ---- 1. Release dates ----
const PRECISION = { 11: "day", 10: "month", 9: "year" };
const dates = {};
const qids = items.flatMap((it) => (credits[it.key]?.qid ? [credits[it.key].qid] : []));
const claims = {};
for (let i = 0; i < qids.length; i += 50) {
  const r = await get(`https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=claims&ids=${qids.slice(i, i + 50).join("|")}`);
  for (const [id, e] of Object.entries(r?.entities ?? {})) claims[id] = e.claims ?? {};
  await sleep(200);
}
for (const it of items) {
  if (it.date) {
    dates[it.key] = { date: it.date, precision: "day" };
    continue;
  }
  const c = claims[credits[it.key]?.qid] ?? {};
  // A series dates from its first episode (start time), a film from its earliest release.
  const values = [...(it.series ? (c.P580 ?? []) : []), ...(c.P577 ?? [])]
    .map((s) => s.mainsnak?.datavalue?.value)
    .filter((v) => v?.time && PRECISION[v.precision])
    .map((v) => ({ time: v.time.slice(1, 11).replace(/-00/g, "-01"), precision: PRECISION[v.precision] }));
  // Earliest, and of the earliest the most exact.
  const best = values.toSorted((a, b) => a.time.localeCompare(b.time) || Object.values(PRECISION).indexOf(a.precision) - Object.values(PRECISION).indexOf(b.precision))[0];
  if (best && (!it.year || Math.abs(Number(best.time.slice(0, 4)) - it.year) <= 1)) dates[it.key] = { date: best.time, precision: best.precision };
  else if (it.year) dates[it.key] = { date: `${it.year}-01-01`, precision: "year" };
}

// ---- 2. Palettes ----
const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
function lab(r, g, b) {
  const [R, G, B] = [r / 255, g / 255, b / 255].map(toLinear);
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const x = f((0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047);
  const y = f(0.2126 * R + 0.7152 * G + 0.0722 * B);
  const z = f((0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}
function hex([L, a, b]) {
  const fy = (L + 16) / 116, fx = fy + a / 500, fz = fy - b / 200;
  const inv = (t) => (t ** 3 > 0.008856 ? t ** 3 : (t - 16 / 116) / 7.787);
  const [X, Y, Z] = [inv(fx) * 0.95047, inv(fy), inv(fz) * 1.08883];
  const rgb = [3.2406 * X - 1.5372 * Y - 0.4986 * Z, -0.9689 * X + 1.8758 * Y + 0.0415 * Z, 0.0557 * X - 0.204 * Y + 1.057 * Z];
  return `#${rgb.map((c) => Math.round(255 * Math.min(1, Math.max(0, c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055))).toString(16).padStart(2, "0")).join("")}`;
}
const chromaOf = ([, a, b]) => Math.hypot(a, b);
const hueOf = ([, a, b]) => (Math.atan2(b, a) * 180 / Math.PI + 360) % 360;

// Pixels of a picture as Lab, black bars and borders cut (rows and columns that are almost all dark).
async function pixels(buffer) {
  const img = sharp(buffer).removeAlpha();
  const { data, info } = await img.resize(96, 96, { fit: "inside" }).raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const luma = (x, y) => { const i = (y * w + x) * 3; return 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]; };
  const darkRow = (y) => { let s = 0; for (let x = 0; x < w; x++) s += luma(x, y); return s / w < 14; };
  const darkCol = (x) => { let s = 0; for (let y = 0; y < h; y++) s += luma(x, y); return s / h < 14; };
  let top = 0, bottom = h - 1, left = 0, right = w - 1;
  while (top < h / 3 && darkRow(top)) top++;
  while (bottom > (2 * h) / 3 && darkRow(bottom)) bottom--;
  while (left < w / 3 && darkCol(left)) left++;
  while (right > (2 * w) / 3 && darkCol(right)) right--;
  const out = [];
  for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) { const i = (y * w + x) * 3; out.push(lab(data[i], data[i + 1], data[i + 2])); }
  return out;
}

// k-means (k = 6) in Lab, seeded the same way every run so results don't wander.
function kmeans(points, k = 6) {
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const d2 = (p, q) => (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2;
  const centres = [points[Math.floor(rand() * points.length)]];
  while (centres.length < k) {
    const dist = points.map((p) => Math.min(...centres.map((c) => d2(p, c))));
    let r = rand() * dist.reduce((a, b) => a + b, 0);
    centres.push(points[Math.max(0, dist.findIndex((d) => (r -= d) <= 0))]);
  }
  let groups = [];
  for (let iter = 0; iter < 15; iter++) {
    groups = centres.map(() => []);
    for (const p of points) groups[centres.reduce((best, c, i) => (d2(p, c) < d2(p, centres[best]) ? i : best), 0)].push(p);
    groups.forEach((g, i) => { if (g.length) centres[i] = [0, 1, 2].map((j) => g.reduce((s, p) => s + p[j], 0) / g.length); });
  }
  return centres.map((c, i) => ({ lab: c, n: groups[i].length })).filter((c) => c.n);
}

function palette(all) {
  // Near-black and near-white don't count, unless they're most of the picture.
  const mid = all.filter(([L]) => L >= 6 && L <= 96);
  const points = mid.length >= all.length * 0.3 ? mid : all;
  const isMono = points.reduce((s, p) => s + chromaOf(p), 0) / points.length < 6;
  const clusters = kmeans(points).toSorted((a, b) => b.n - a.n).slice(0, 5);
  const total = clusters.reduce((s, c) => s + c.n, 0);
  const swatches = clusters.map((c) => ({ hex: hex(c.lab), share: +(c.n / total).toFixed(3), lab: c.lab.map((v) => +v.toFixed(1)) }));
  // The dominant colour: the strongest colour that covers at least 8% (share weighted by how
  // colourful it is), else the biggest swatch. Dark films otherwise all read as neutral.
  const weight = (x) => x.share * Math.min(chromaOf(x.lab), 40);
  const colourful = swatches.filter((x) => chromaOf(x.lab) >= 12 && x.share >= 0.08).toSorted((a, b) => weight(b) - weight(a))[0];
  const dom = isMono ? swatches[0] : (colourful ?? swatches[0]);
  const chroma = chromaOf(dom.lab);
  const hue = chroma < 12 ? -1 : Math.round(hueOf(dom.lab));
  const temperature = hue < 0 ? "neutral" : hue < 100 || hue >= 330 ? "warm" : hue >= 150 && hue < 300 ? "cool" : "neutral";
  return { dominant: dom.hex, swatches, hue, chroma: +chroma.toFixed(1), lightness: +dom.lab[0].toFixed(1), temperature, isMono };
}

const palettes = {};
let fromTrailer = 0;
for (const it of items) {
  let all = [];
  if (it.video) {
    for (const f of ["maxres1", "maxres2", "maxres3"]) {
      const buf = await get(`https://i.ytimg.com/vi/${it.video}/${f}.jpg`, "buffer");
      if (buf) all.push(...(await pixels(buf)));
    }
    // Older videos keep only 640 × 480 frames.
    if (!all.length) {
      for (const f of ["sd1", "sd2", "sd3"]) {
        const buf = await get(`https://i.ytimg.com/vi/${it.video}/${f}.jpg`, "buffer");
        if (buf) all.push(...(await pixels(buf)));
      }
    }
    if (all.length) fromTrailer++;
  }
  if (!all.length && existsSync(it.cover)) all = await pixels(await readFile(it.cover));
  if (all.length < 50) continue;
  palettes[it.key] = palette(all);
}

const sorted = (o) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));
await writeFile("src/features/explore/release-dates.json", JSON.stringify(sorted(dates), null, 1) + "\n");
await writeFile("src/features/explore/palettes.json", JSON.stringify(sorted(palettes)) + "\n");
const exact = Object.values(dates).filter((d) => d.precision === "day").length;
console.log(`Dates: ${Object.keys(dates).length} (${exact} to the day). Palettes: ${Object.keys(palettes).length} (${fromTrailer} from trailer frames).`);
console.log(`No date: ${items.filter((i) => !dates[i.key]).map((i) => i.key).join(", ") || "none"}. No palette: ${items.filter((i) => !palettes[i.key]).map((i) => i.key).join(", ") || "none"}`);
