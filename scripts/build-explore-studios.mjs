// Which of By studio's studios made each Explore title (Ika, 2026-11-11: "sort existing and queued
// projects with consistency"; Netflix titles in Made in Africa weren't under Netflix). The studio
// catalogue (build-studio-catalogue.mjs) only knows the titles it was built from, so this reads
// every Explore title's production companies and, for series, its networks from TMDB, and
// matches them to the studios in studios.json. A title's own `platform` counts too (a Netflix original).
// Writes src/features/explore/title-studios.json: { slug: { studios: [ids], tmdb } }.
// Run from the project root with TMDB_API_KEY loaded, after adding titles:
//   node scripts/build-explore-studios.mjs
import { readFile, writeFile } from "node:fs/promises";

const KEY = process.env.TMDB_API_KEY;
if (!KEY) throw new Error("Load TMDB_API_KEY from .env.local first.");

// The studios, with their TMDB company ids, network ids and platform names (studios.json).
const { studios: STUDIOS } = JSON.parse(await readFile("src/features/explore/studios.json", "utf8"));

const raw = JSON.parse(await readFile("src/features/explore/made-in-africa.json", "utf8"));
const sources = JSON.parse(await readFile("src/features/explore/cover-sources.json", "utf8"));
const prior = JSON.parse(await readFile("src/features/explore/title-studios.json", "utf8").catch(() => "{}"));
const get = async (path, params = "") => {
  const r = await fetch(`https://api.themoviedb.org/3/${path}?api_key=${KEY}${params}`, { signal: AbortSignal.timeout(20000) }).catch(() => null);
  return r?.ok ? r.json() : null;
};
const plain = (s) => (s ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

async function tmdbId(t) {
  if (prior[t.slug]?.tmdb) return prior[t.slug].tmdb;
  if (sources[t.slug]?.tmdb) return sources[t.slug].tmdb;
  const kinds = t.type === "series" ? ["tv", "movie"] : t.type === "documentary" ? ["movie", "tv"] : ["movie"];
  for (const kind of kinds) {
    const yearParam = t.year ? (kind === "tv" ? `&first_air_date_year=${t.year}` : `&year=${t.year}`) : "";
    const hits = (await get(`search/${kind}`, `&query=${encodeURIComponent(t.title)}${yearParam}`))?.results ?? [];
    const near = hits.filter((m) => !t.year || Math.abs(Number((m.release_date ?? m.first_air_date ?? "").slice(0, 4)) - t.year) <= 1);
    const hit = near.find((m) => plain(m.title ?? m.name) === plain(t.title)) ?? near[0];
    if (hit) return `${kind}/${hit.id}`;
  }
  return null;
}

const out = {};
// Every company and network per title, to choose which studios By studio shows (scripts/out).
const all = {};
let found = 0;
for (const t of raw.titles) {
  const tmdb = await tmdbId(t);
  const studios = new Set();
  if (tmdb) {
    const d = await get(tmdb);
    const companies = (d?.production_companies ?? []).map((c) => c.id);
    const networks = (d?.networks ?? []).map((n) => n.id);
    all[t.slug] = [...(d?.production_companies ?? []).map((c) => ({ id: c.id, name: c.name, logo: c.logo_path, country: c.origin_country })), ...(d?.networks ?? []).map((n) => ({ id: `n${n.id}`, name: n.name, logo: n.logo_path, country: n.origin_country }))];
    for (const st of STUDIOS) {
      if (st.tmdb.some((x) => companies.includes(x)) || (st.networks ?? []).some((x) => networks.includes(x))) studios.add(st.id);
    }
  }
  for (const st of STUDIOS) if ((st.platforms ?? []).includes(t.platform)) studios.add(st.id);
  out[t.slug] = { studios: [...studios], tmdb };
  if (studios.size) found += 1;
  await new Promise((r) => setTimeout(r, 120));
}
await writeFile("scripts/out/title-companies.json", JSON.stringify(all, null, 1) + "\n");
await writeFile("src/features/explore/title-studios.json", JSON.stringify(out, null, 1) + "\n");
console.log(`${raw.titles.length} titles; ${found} with a studio; ${raw.titles.filter((t) => !out[t.slug].tmdb).length} not found on TMDB`);
