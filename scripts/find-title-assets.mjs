// Finds what a new Explore title needs (Ika, 2026-10-28): its TMDB page and official poster
// (downloaded, up to 1600 wide, to public/explore/made-in-africa/<slug>.jpg, the folder every
// Explore title's cover lives in), its official trailer on YouTube (uploaders on the TRUSTED
// list that allow embedding), and its IMDb id from Wikidata. Writes scripts/out/title-assets.json
// for the title data, cover-sources.json and a person's check. Run from the project root with a
// JSON list of titles:
//   node scripts/find-title-assets.mjs scripts/out/new-titles.json
// where the file is [{ "slug": "casablanca", "title": "Casablanca", "year": 1942 }, …].
// Check each poster and trailer by eye before adding the titles.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sharp = require("sharp");
const BROWSER = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36";
const UA = "NiaOS/1.0 (nia@niatechnologies.co)";
// Studios, distributors and the official trailer channels.
const TRUSTED = /^(warner bros|paramount|universal pictures|sony pictures|20th century|mgm|metro-goldwyn|united artists|lionsgate|criterion|janus|disney|lucasfilm|star wars|focus features|searchlight|columbia|rotten tomatoes classic trailers|rotten tomatoes trailers|movieclips|bfi|kino lorber|park circus|studiocanal|a24|neon|netflix|amazon mgm)/i;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const get = (url, ua = BROWSER) => fetch(url, { headers: { "User-Agent": ua, "Accept-Language": "en-US,en;q=0.9" }, signal: AbortSignal.timeout(20000) }).catch(() => null);

// Posters, from the official TMDB API when TMDB_API_KEY is set (TMDB refuses automated page
// requests, so its website isn't used), otherwise from Wikimedia Commons through Wikidata's
// "film poster" (P3383), which holds free-licence or public-domain posters.
async function tmdb(title, year) {
  const key = process.env.TMDB_API_KEY;
  if (!key) return null;
  const bearer = key.length > 40;
  const url = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(title)}${year ? `&year=${year}` : ""}${bearer ? "" : `&api_key=${key}`}`;
  const r = await fetch(url, { headers: bearer ? { Authorization: `Bearer ${key}` } : {}, signal: AbortSignal.timeout(20000) }).catch(() => null);
  const hit = r?.ok ? (await r.json()).results?.find((m) => m.poster_path) : null;
  return hit ? { source: "TMDB", tmdb: `movie/${hit.id}`, image: `https://image.tmdb.org/t/p/original${hit.poster_path}` } : null;
}

async function commons(qid) {
  if (!qid) return null;
  const wd = await (await get(`https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=claims&ids=${qid}`, UA))?.json().catch(() => null);
  const file = wd?.entities?.[qid]?.claims?.P3383?.[0]?.mainsnak?.datavalue?.value;
  return file ? { source: "Wikimedia Commons", file, image: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}` } : null;
}

async function trailer(title, year, retry = true) {
  const page = await (await get(`https://www.youtube.com/results?search_query=${encodeURIComponent(`${title} ${year} official trailer`)}&hl=en&gl=US`))?.text();
  const data = page?.match(/var ytInitialData = (\{.*?\});<\/script>/s);
  // YouTube slows down quick repeat searches: wait and try once more.
  if (!data) return retry ? (await sleep(5000), trailer(title, year, false)) : null;
  const found = [];
  const walk = (n) => {
    if (!n || typeof n !== "object") return;
    if (n.videoRenderer) found.push({ id: n.videoRenderer.videoId, title: n.videoRenderer.title?.runs?.map((r) => r.text).join("") ?? "", channel: n.videoRenderer.ownerText?.runs?.[0]?.text ?? "" });
    for (const k in n) walk(n[k]);
  };
  walk(JSON.parse(data[1]));
  const want = norm(title.replace(/[:(].*$/, ""));
  for (const v of found) {
    if (!TRUSTED.test(v.channel) || !/trailer/i.test(v.title) || !norm(v.title).includes(want)) continue;
    const ok = (await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${v.id}&format=json`).catch(() => null))?.status === 200;
    if (ok) return v;
  }
  return null;
}

async function imdb(title, year) {
  const s = await (await get(`https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&srlimit=3&srsearch=${encodeURIComponent(`${title} ${year} film`)}`, UA))?.json().catch(() => null);
  const page = s?.query?.search?.[0]?.title;
  if (!page) return { wikipedia: null, imdb: null, qid: null };
  const p = await (await get(`https://en.wikipedia.org/w/api.php?action=query&prop=pageprops&format=json&titles=${encodeURIComponent(page)}`, UA))?.json().catch(() => null);
  const qid = Object.values(p?.query?.pages ?? {})[0]?.pageprops?.wikibase_item;
  if (!qid) return { wikipedia: page, imdb: null, qid: null };
  const wd = await (await get(`https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=claims&ids=${qid}`, UA))?.json().catch(() => null);
  return { wikipedia: page, imdb: wd?.entities?.[qid]?.claims?.P345?.[0]?.mainsnak?.datavalue?.value ?? null, qid };
}

const list = JSON.parse(await readFile(process.argv[2], "utf8"));
await mkdir("scripts/out", { recursive: true });
const prior = JSON.parse(await readFile("scripts/out/title-assets.json", "utf8").catch(() => "{}"));
const out = {};
for (const t of list) {
  // Titles already found keep what they have (re-runs only fill gaps).
  const had = prior[t.slug] ?? {};
  const [video, ids] = await Promise.all([had.video ? had.video : trailer(t.title, t.year), had.qid ? had : imdb(t.title, t.year)]);
  const found = (await tmdb(t.title, t.year)) ?? (await commons(ids.qid));
  let cover = had.cover ?? null;
  if (!cover && found) {
    const r = await get(found.image, UA);
    if (r?.ok) {
      const info = await sharp(Buffer.from(await r.arrayBuffer())).resize({ width: 1600, withoutEnlargement: true }).jpeg({ quality: 90, mozjpeg: true }).toFile(`public/explore/made-in-africa/${t.slug}.jpg`);
      cover = { ...found, size: `${info.width}x${info.height}` };
    }
  }
  out[t.slug] = { cover, video, wikipedia: ids.wikipedia, imdb: ids.imdb, qid: ids.qid };
  console.log(`${t.slug}: poster ${cover ? cover.size : "MISSING"}, trailer ${video ? `${video.channel}` : "MISSING"}, imdb ${ids.imdb ?? "MISSING"}`);
  await sleep(2500);
}
await writeFile("scripts/out/title-assets.json", `${JSON.stringify(out, null, 1)}\n`);
