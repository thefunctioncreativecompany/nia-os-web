// Official trailers from TMDB's API, for new Explore titles whose trailer find-title-assets.mjs
// couldn't find (2026-11-19: YouTube refuses this Mac's command-line connections, though browsers
// reach it). TMDB lists each title's videos with their YouTube ids and whether the studio
// published them ("official"). This script also puts TMDB's IMDb id on each title when the
// Wikipedia search picked a different film (12 12 12 had matched 12 Monkeys), dropping that
// wrong Wikipedia page and Wikidata item.
//
//   node --env-file=.env.local scripts/tmdb-trailers.mjs
//
// Writes the picks into scripts/out/title-assets.json as { id, title, channel: null, check: true }
// and lists them in scripts/out/trailer-check.json. Each pick must then be checked in a browser
// (YouTube's oEmbed: embeddable, and the channel is the studio's), which fills in `channel`.
import fs from "node:fs";

const KEY = process.env.TMDB_API_KEY;
if (!KEY) throw new Error("Needs TMDB_API_KEY in .env.local");
const bearer = KEY.length > 40;
async function tmdb(path) {
  const url = `https://api.themoviedb.org/3${path}${path.includes("?") ? "&" : "?"}${bearer ? "" : `api_key=${KEY}`}`;
  for (let i = 0; i < 3; i++) {
    const r = await fetch(url, { headers: bearer ? { Authorization: `Bearer ${KEY}` } : {} }).catch(() => null);
    if (r?.ok) return r.json();
    await new Promise((s) => setTimeout(s, 1000 * (i + 1)));
  }
  return null;
}

const FILE = "scripts/out/title-assets.json";
const assets = JSON.parse(fs.readFileSync(FILE, "utf8"));
const check = [];
for (const [slug, a] of Object.entries(assets)) {
  const ref = a.cover?.tmdb; // "movie/656908" or "tv/1234"
  if (!ref) continue;
  const [kind] = ref.split("/");
  const d = await tmdb(`/${ref}?append_to_response=videos,external_ids&include_video_language=en,null`);
  if (!d) continue;
  const imdb = d.external_ids?.imdb_id ?? d.imdb_id ?? null;
  if (imdb && a.imdb !== imdb) {
    console.log(`${slug}: IMDb ${a.imdb ?? "none"} -> ${imdb} (TMDB)${a.wikipedia ? `, dropping Wikipedia "${a.wikipedia}"` : ""}`);
    Object.assign(a, { imdb, wikipedia: null, qid: null });
  }
  if (a.video) continue;
  const vids = (d.videos?.results ?? []).filter((v) => v.site === "YouTube" && v.official);
  const score = (v) => (v.type === "Trailer" ? 4 : v.type === "Teaser" ? 2 : 0) + (/official trailer/i.test(v.name) ? 2 : 0) + (/final|main/i.test(v.name) ? 1 : 0) - (/teaser|tv spot|clip/i.test(v.name) ? 1 : 0);
  const ranked = vids.filter((v) => ["Trailer", "Teaser"].includes(v.type)).sort((x, y) => score(y) - score(x) || (y.published_at ?? "").localeCompare(x.published_at ?? ""));
  const pick = ranked[0];
  if (!pick) {
    console.log(`${slug}: no official trailer on TMDB (${kind})`);
    continue;
  }
  // The next ones in line, for when the first can't be embedded (age-restricted, say).
  a.video = { id: pick.key, title: pick.name, channel: null, check: true, alternates: ranked.slice(1, 4).map((v) => ({ id: v.key, title: v.name })) };
  check.push({ slug, id: pick.key, name: pick.name });
  console.log(`${slug}: ${pick.type} "${pick.name}" ${pick.key}`);
}
fs.writeFileSync(FILE, JSON.stringify(assets, null, 1) + "\n");
fs.writeFileSync("scripts/out/trailer-check.json", JSON.stringify(check, null, 1) + "\n");
console.log(`${check.length} trailers to check in a browser (scripts/out/trailer-check.json)`);
