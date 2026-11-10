// Adds a checked batch of titles to Explore (Ika, 2026-11-10, FEEDBACK EX4). Takes the batch list
// (slug, title, year, type), what find-title-assets.mjs found (poster, trailer, IMDb id), the
// tagger's drafts (suggest-tags.mts) and the entries written and checked by hand:
//   { "<slug>": [collection, genres, countries, credit, recognition | null, study note, hand tags] }
// and writes them into made-in-africa.json, cover-sources.json and tag-data.ts. Titles already on
// Explore are skipped. Run from the project root:
//   node scripts/add-explore-titles.mjs <batch.json> <entries.json> [added day]
// Then: build-explore-credits, build-explore-timeline-data, measure-explore-covers, the tests.
import fs from "node:fs";

const [batchFile, entriesFile, day = new Date().toISOString().slice(0, 10)] = process.argv.slice(2);
const batch = JSON.parse(fs.readFileSync(batchFile, "utf8"));
const E = JSON.parse(fs.readFileSync(entriesFile, "utf8"));
const assets = JSON.parse(fs.readFileSync("scripts/out/title-assets.json", "utf8"));
const drafts = JSON.parse(fs.readFileSync("scripts/out/tag-drafts.json", "utf8"));
const file = "src/features/explore/made-in-africa.json";
const raw = JSON.parse(fs.readFileSync(file, "utf8"));
const sourcesFile = "src/features/explore/cover-sources.json";
const sources = JSON.parse(fs.readFileSync(sourcesFile, "utf8"));
const collections = new Set(raw.collections.map((c) => c.slug));
let tagLines = "";
let added = 0;
for (const t of batch) {
  if (raw.titles.some((x) => x.slug === t.slug)) continue;
  const entry = E[t.slug];
  const a = assets[t.slug];
  if (!entry || !a?.cover) {
    console.log(`skipped ${t.slug}: ${entry ? "no poster" : "no entry"}`);
    continue;
  }
  const [collection, genres, countries, credit, recognition, study_note, tags] = entry;
  if (!collections.has(collection)) throw new Error(`${t.slug}: no collection "${collection}" (never invent one)`);
  const imdb = a.imdb ?? drafts[t.slug]?.imdb_id;
  raw.titles.push({
    slug: t.slug, collection, title: t.title, type: t.type, genres, year: t.year, countries, credit,
    ...(recognition ? { recognition } : {}), pair_with: "", study_note, added: day,
    ...(imdb ? { imdb_id: imdb } : {}),
    ...(a.video ? { videos: [{ provider: "youtube", video_id: a.video.id, kind: "trailer", channel: a.video.channel, is_primary: true }] } : {}),
  });
  sources[t.slug] = { source: a.cover.source, tmdb: a.cover.tmdb, image: a.cover.image };
  tagLines += `  ${JSON.stringify(t.slug)}: ${JSON.stringify(tags).replace(/","/g, '", "')},\n`;
  added += 1;
}
fs.writeFileSync(file, JSON.stringify(raw, null, 1) + "\n");
fs.writeFileSync(sourcesFile, JSON.stringify(sources, null, 1) + "\n");
const tagFile = "src/features/explore/tag-data.ts";
fs.writeFileSync(tagFile, fs.readFileSync(tagFile, "utf8").replace(/\};\n$/, `${tagLines}};\n`));
console.log(`${added} added; ${raw.titles.length} titles`);
