// Builds Explore's studio catalogue (Ika, 2026-10-31: "a category that sorts content by studio").
// For each studio, its most notable films and series from Wikidata (ranked by how many Wikipedia
// languages cover them), with year, kind, studio group and whether Wikimedia Commons has a free
// poster. Titles already on Explore are marked. Nothing is copied from any studio's or
// streamer's site, and TMDB is never scraped (CLAUDE.md).
//
//   node scripts/build-studio-catalogue.mjs [perStudio=26]
// Writes src/features/explore/studio-catalogue.json. Re-run to refresh; the update script
// (scripts/explore-update.mjs) takes titles from it in batches.
import fs from "node:fs";

const PER_STUDIO = Number(process.argv[2] || 26);
const UA = "NiaExploreCatalogue/1.0 (https://app.niatechnologies.co)";

// Wikidata's own entries for each studio (checked 2026-10-31), the group that owns it today, and
// how a title is linked to it: P272 production company, P750 distributor, P449 original network.
export const STUDIOS = [
  { id: "paramount", name: "Paramount Pictures", group: "Paramount Skydance", qid: "Q159846", via: ["P272"] },
  { id: "universal", name: "Universal Pictures", group: "NBCUniversal", qid: "Q168383", via: ["P272"] },
  { id: "focus", name: "Focus Features", group: "NBCUniversal", qid: "Q649649", via: ["P272", "P750"] },
  { id: "columbia", name: "Columbia Pictures", group: "Sony Pictures", qid: "Q186941", via: ["P272"] },
  { id: "warner", name: "Warner Bros. Pictures", group: "Warner Bros. Discovery", qid: "Q8016302", via: ["P272"] },
  { id: "disney", name: "Walt Disney Pictures", group: "Disney", qid: "Q191224", via: ["P272"] },
  { id: "20th-century", name: "20th Century Studios", group: "Disney", qid: "Q434841", via: ["P272"] },
  { id: "mgm", name: "Metro-Goldwyn-Mayer", group: "Amazon MGM Studios", qid: "Q179200", via: ["P272"] },
  // Netflix as maker or first network only: as a distributor it also licenses others' shows.
  { id: "netflix", name: "Netflix", group: "Netflix", qid: "Q907311", via: ["P272", "P449"] },
  { id: "lionsgate", name: "Lionsgate", group: "Lionsgate", qid: "Q17076072", via: ["P272", "P750"] },
  { id: "a24", name: "A24", group: "A24", qid: "Q16248298", via: ["P272", "P750"] },
  { id: "neon", name: "Neon", group: "Neon", qid: "Q30603559", via: ["P272", "P750"] },
];

// Films, television series and miniseries.
const KINDS = { Q11424: "Film", Q5398426: "TV Series", Q1259759: "TV Series" };

async function sparql(query) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const r = await fetch("https://query.wikidata.org/sparql?format=json&query=" + encodeURIComponent(query), {
      headers: { "User-Agent": UA, Accept: "application/sparql-results+json" },
    });
    if (r.ok) return (await r.json()).results.bindings;
    await new Promise((done) => setTimeout(done, 3000 * (attempt + 1)));
  }
  throw new Error("Wikidata didn't answer");
}

function query(studio) {
  const links = studio.via.map((p) => `{ ?item wdt:${p} wd:${studio.qid} }`).join(" UNION ");
  return `SELECT ?item ?itemLabel ?kind ?links (MIN(YEAR(?date)) AS ?year) (SAMPLE(?img) AS ?poster) (SAMPLE(?wiki) AS ?enwiki) WHERE {
    ${links}
    VALUES ?kind { ${Object.keys(KINDS).map((k) => `wd:${k}`).join(" ")} }
    ?item wdt:P31 ?kind ; wikibase:sitelinks ?links .
    # A film's release date, or a series' start.
    OPTIONAL { ?item wdt:P577|wdt:P580 ?date }
    OPTIONAL { ?item wdt:P3383 ?img }
    OPTIONAL { ?wiki schema:about ?item ; schema:isPartOf <https://en.wikipedia.org/> }
    SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
  } GROUP BY ?item ?itemLabel ?kind ?links ORDER BY DESC(?links) LIMIT ${PER_STUDIO * 3}`;
}

const slugify = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const key = (title, year) => `${slugify(title)}|${year ?? ""}`;

// What's already on Explore, by title and year.
const explore = JSON.parse(fs.readFileSync("src/features/explore/made-in-africa.json", "utf8"));
const onExplore = new Map(explore.titles.map((t) => [key(t.title, t.year), t.slug]));
const onExploreByTitle = new Map(explore.titles.map((t) => [slugify(t.title), t.slug]));

const titles = new Map();
for (const studio of STUDIOS) {
  const rows = await sparql(query(studio));
  let taken = 0;
  for (const row of rows) {
    if (taken >= PER_STUDIO) break;
    const qid = row.item.value.split("/").pop();
    const title = row.itemLabel.value;
    // Items with no English name come back as their Q-number: skip them.
    if (/^Q\d+$/.test(title)) continue;
    const year = row.year ? Number(row.year.value) : null;
    // No date at all usually means it hasn't come out (e.g. Batgirl, shelved): leave it out.
    if (!year) continue;
    const existing = titles.get(qid);
    if (existing) {
      if (!existing.studios.includes(studio.id)) existing.studios.push(studio.id);
      continue;
    }
    const slug = onExplore.get(key(title, year)) ?? onExploreByTitle.get(slugify(title)) ?? null;
    titles.set(qid, {
      qid,
      title,
      year,
      type: KINDS[row.kind.value.split("/").pop()],
      studios: [studio.id],
      notability: Number(row.links.value),
      freePoster: row.poster ? decodeURIComponent(row.poster.value.split("/").pop()) : null,
      wikipedia: row.enwiki?.value ?? null,
      onExplore: slug,
    });
    taken += 1;
  }
  console.log(`${studio.name}: ${taken}`);
  await new Promise((done) => setTimeout(done, 1500));
}

const list = [...titles.values()].toSorted((a, b) => b.notability - a.notability);
const out = {
  built: new Date().toISOString().slice(0, 10),
  source: "Wikidata (CC0): production company, distributor or original network; ranked by Wikipedia language editions",
  studios: STUDIOS.map(({ id, name, group, qid }) => ({ id, name, group, qid })),
  titles: list,
};
fs.writeFileSync("src/features/explore/studio-catalogue.json", JSON.stringify(out, null, 1) + "\n");
console.log(`${list.length} titles; ${list.filter((t) => t.onExplore).length} already on Explore; ${list.filter((t) => t.freePoster).length} with a free poster on Commons`);
