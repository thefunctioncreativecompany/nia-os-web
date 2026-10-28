// Moves checked press-kit drafts (scripts/out/press-kit-drafts.json, from build-press-kits.mjs)
// into src/features/explore/press-kits.json, which Explore reads. Run after checking the drafts:
//   node scripts/apply-press-kits.mjs            every draft
//   node scripts/apply-press-kits.mjs mami-wata  just these
// Keeps what the pages show; the notes used while checking (`because`, `wikipedia`) stay behind.
// A draft with nothing in it is skipped, so a title without a press kit shows none.
import { readFile, writeFile } from "node:fs/promises";

const FILE = "src/features/explore/press-kits.json";
const drafts = JSON.parse(await readFile("scripts/out/press-kit-drafts.json", "utf8"));
const kits = JSON.parse(await readFile(FILE, "utf8").catch(() => "{}"));
const only = process.argv.slice(2);

let applied = 0;
for (const [key, d] of Object.entries(drafts)) {
  if (only.length && !only.includes(key)) continue;
  const kit = {
    videos: d.videos ?? [],
    reviews: (d.reviews ?? []).map(({ outlet, title, href, verdict }) => ({ outlet, title, href, verdict })),
    articles: (d.articles ?? []).map(({ outlet, title, href }) => ({ outlet, title, href })),
    ...(d.streaming ? { streaming: d.streaming } : {}),
    ...(d.cinemaRelease ? { cinemaRelease: true } : {}),
    ...(d.imdb ? { imdb: d.imdb } : {}),
  };
  if (!kit.videos.length && !kit.reviews.length && !kit.articles.length) continue;
  kits[key] = kit;
  applied++;
}
const sorted = Object.fromEntries(Object.entries(kits).sort(([a], [b]) => a.localeCompare(b)));
await writeFile(FILE, `${JSON.stringify(sorted, null, 1)}\n`);
console.log(`Applied ${applied} press kits; ${Object.keys(sorted).length} in ${FILE}.`);
