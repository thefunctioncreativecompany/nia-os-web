// Explore's update run (Ika, 2026-10-31): what to add next from the studio catalogue, in
// batches of 10, and what's waiting. Each run:
//   1. marks which catalogue titles are already on Explore (by name and year),
//   2. picks the next batch: the most notable titles not on Explore that can be shown now
//      (a free poster on Wikimedia Commons; the rest wait for the TMDB licence),
//   3. writes scripts/out/next-batch.json for the steps that build each title, in order:
//        node scripts/find-title-assets.mjs <slug…>      trailer and poster
//        node scripts/measure-explore-covers.mjs          the cover's look (tags)
//        node scripts/build-press-kits.mjs <slug…>        press-kit draft, checked by hand
//      then the title is added to made-in-africa.json (category, collection, tags in tag-data.ts,
//      an `added` day so it shows in Recently added), checked, committed and pushed.
//
//   node scripts/explore-update.mjs [batch=10]
import fs from "node:fs";

const BATCH = Number(process.argv[2] || 10);
const slugify = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const catalogueFile = "src/features/explore/studio-catalogue.json";
const catalogue = JSON.parse(fs.readFileSync(catalogueFile, "utf8"));
const explore = JSON.parse(fs.readFileSync("src/features/explore/made-in-africa.json", "utf8"));
const byKey = new Map(explore.titles.map((t) => [`${slugify(t.title)}|${t.year ?? ""}`, t.slug]));
const byTitle = new Map(explore.titles.map((t) => [slugify(t.title), t.slug]));

// 1. What's on Explore now.
let marked = 0;
for (const t of catalogue.titles) {
  const slug = byKey.get(`${slugify(t.title)}|${t.year}`) ?? byTitle.get(slugify(t.title)) ?? null;
  if (slug !== t.onExplore) marked += 1;
  t.onExplore = slug;
}
if (marked) fs.writeFileSync(catalogueFile, JSON.stringify(catalogue, null, 1) + "\n");

// Commons files already checked by eye and turned down (CLAUDE.md, seed batches): not a poster.
const REJECTED = new Map([
  ["Q105702", "Commons has only a newspaper-style ad"], // Dr. Strangelove
]);

// 2. The next batch, most notable first. Every poster is still checked by eye before it's added
// (Commons sometimes files an ad, a lobby card or a later re-release under a film).
const missing = catalogue.titles.filter((t) => !t.onExplore);
const ready = missing.filter((t) => t.freePoster && !REJECTED.has(t.qid));
const studioName = new Map(catalogue.studios.map((s) => [s.id, s.name]));
const batch = ready.slice(0, BATCH).map((t) => ({
  slug: slugify(t.title),
  title: t.title,
  year: t.year,
  type: t.type,
  studio: studioName.get(t.studios[0]),
  wikidata: t.qid,
  commons: t.freePoster,
  wikipedia: t.wikipedia,
}));

// 3. For the build steps.
fs.mkdirSync("scripts/out", { recursive: true });
fs.writeFileSync("scripts/out/next-batch.json", JSON.stringify(batch, null, 1) + "\n");

console.log(`${catalogue.titles.length} in the catalogue · ${catalogue.titles.length - missing.length} on Explore · ${ready.length} ready to add · ${missing.length - ready.length} waiting for a poster`);
for (const b of batch) console.log(`  ${b.title} (${b.year}, ${b.studio})`);
if (marked) console.log(`Updated ${marked} "on Explore" marks.`);
