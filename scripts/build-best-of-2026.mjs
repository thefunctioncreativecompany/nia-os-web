// Best of 2026 on Explore (Ika, 2026-11-14: "based on popularity, box office performance, festival
// appearances, views on Nia"). Ranks the films and series released in 2026 (up to today) and
// writes the order Explore shows to src/features/explore/best-of-2026.json. Titles already on
// Explore are ranked in place; ones not yet on Explore are listed in scripts/out/best-of-2026.json
// as the next titles to add (each through the usual pipeline, with a press kit), then picked up on
// the next run. Rerun weekly as the year goes on.
//
// Signals, each turned into a 0 to 1 rank among the candidates, then averaged by weight:
//   popularity   TMDB's popularity and vote count (the official API, TMDB_API_KEY)      0.30
//   box office   TMDB's reported worldwide gross (films only; series skip it)          0.25
//   festivals    awards and nominations on Wikidata, plus a festival line in the
//                title's recognition on Explore                                        0.25
//   views on Nia how often people open it on Explore (explore_views, read with the
//                server key)                                                           0.20
//
//   node --env-file=.env.local scripts/build-best-of-2026.mjs
import fs from "node:fs";

const YEAR = "2026";
const TODAY = new Date().toISOString().slice(0, 10);
const KEY = process.env.TMDB_API_KEY;
if (!KEY) throw new Error("Needs TMDB_API_KEY in .env.local");
const bearer = KEY.length > 40;
const UA = "NiaOS/1.0 (https://app.niatechnologies.co)";

async function tmdb(path) {
  const url = `https://api.themoviedb.org/3${path}${path.includes("?") ? "&" : "?"}${bearer ? "" : `api_key=${KEY}`}`;
  for (let i = 0; i < 3; i++) {
    const r = await fetch(url, { headers: bearer ? { Authorization: `Bearer ${KEY}` } : {} }).catch(() => null);
    if (r?.ok) return r.json();
    await new Promise((s) => setTimeout(s, 1000 * (i + 1)));
  }
  return null;
}

const slugify = (s) =>
  s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/&/g, "and").replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// ---- Candidates: TMDB's most popular and highest-grossing 2026 releases, and 2026 titles on Explore ----
const raw = JSON.parse(fs.readFileSync("src/features/explore/made-in-africa.json", "utf8"));
const dates = JSON.parse(fs.readFileSync("src/features/explore/release-dates.json", "utf8"));
const covers = new Set([
  ...Object.keys(JSON.parse(fs.readFileSync("src/features/explore/cover-sources.json", "utf8"))),
  ...Object.keys(JSON.parse(fs.readFileSync("src/features/explore/trailer-stills.json", "utf8"))),
]);
const onExplore = new Map(raw.titles.map((t) => [t.slug, t]));
const released = (d) => d && d.startsWith(YEAR) && d <= TODAY;

const found = new Map(); // key "movie:123" -> candidate
const add = (kind, r) => {
  const date = kind === "movie" ? r.release_date : r.first_air_date;
  if (!released(date) || r.adult) return;
  const title = kind === "movie" ? r.title : r.name;
  found.set(`${kind}:${r.id}`, { kind, id: r.id, title, date, slug: slugify(title), popularity: r.popularity, votes: r.vote_count });
};
// Enough pages for a fair top 100 (Ika, 2026-11-19: "top 100").
for (const page of [1, 2, 3, 4, 5, 6]) {
  for (const sort of ["popularity.desc", "revenue.desc"]) {
    const m = await tmdb(`/discover/movie?primary_release_year=${YEAR}&sort_by=${sort}&page=${page}&include_adult=false`);
    m?.results.forEach((r) => add("movie", r));
  }
  const s = await tmdb(`/discover/tv?first_air_date_year=${YEAR}&sort_by=popularity.desc&page=${page}&without_genres=10763,10764,10767&with_original_language=en`);
  s?.results.forEach((r) => add("tv", r));
}
// Critics' and audiences' favourites, so smaller films aren't drowned out by the blockbusters.
for (const page of [1, 2, 3, 4]) {
  const m = await tmdb(`/discover/movie?primary_release_year=${YEAR}&sort_by=vote_average.desc&vote_count.gte=150&page=${page}&include_adult=false`);
  m?.results.forEach((r) => add("movie", r));
}

// The year's festivals, from their Wikipedia pages: every film in the line-up, and the prize winners.
const FESTIVALS = [
  "2026 Cannes Film Festival",
  "76th Berlin International Film Festival",
  "83rd Venice International Film Festival",
  "2026 Sundance Film Festival",
  "2026 Toronto International Film Festival",
];
const lineup = new Map(); // film name (lower case) -> { name, festivals, prizes }
const linkName = (l) => l.split("|").pop().replace(/\s*\((\d{4} )?(film|TV series|miniseries)\)$/i, "").trim();
for (const page of FESTIVALS) {
  const j = await fetch(`https://en.wikipedia.org/w/api.php?action=parse&format=json&prop=wikitext&redirects=1&page=${encodeURIComponent(page)}`, { headers: { "User-Agent": UA } })
    .then((r) => r.json())
    .catch(() => null);
  const text = j?.parse?.wikitext?.["*"] ?? "";
  const sections = text.split(/^==+\s*(.+?)\s*==+\s*$/m);
  for (let i = 0; i < sections.length; i += 2) {
    const heading = i ? sections[i - 1] : "";
    const prizes = /award|prize|winner/i.test(heading);
    for (const m of (sections[i] ?? "").matchAll(/''\[\[([^\]]+)\]\]''/g)) {
      const name = linkName(m[1]);
      const k = name.toLowerCase();
      const e = lineup.get(k) ?? { name, festivals: new Set(), prizes: 0 };
      e.festivals.add(page);
      if (prizes) e.prizes++;
      lineup.set(k, e);
    }
  }
}
// Prize winners join the candidates (a festival premiere this year makes it a 2026 film).
for (const e of [...lineup.values()].filter((e) => e.prizes > 0)) {
  if ([...found.values()].some((c) => c.title.toLowerCase() === e.name.toLowerCase())) continue;
  const hit = (await tmdb(`/search/movie?query=${encodeURIComponent(e.name)}`))?.results?.find((r) => (r.release_date ?? "") >= "2025-09-01");
  if (hit) found.set(`movie:${hit.id}`, { kind: "movie", id: hit.id, title: hit.title, date: hit.release_date, slug: slugify(hit.title), popularity: hit.popularity, votes: hit.vote_count });
}

// 2026 titles already on Explore, found on TMDB by name.
for (const t of raw.titles) {
  const d = dates[t.slug]?.date ?? (t.year ? String(t.year) : "");
  if (!d.startsWith(YEAR) || [...found.values()].some((c) => c.slug === t.slug)) continue;
  const kind = t.type === "series" ? "tv" : "movie";
  const hit = (await tmdb(`/search/${kind}?query=${encodeURIComponent(t.title)}&${kind === "movie" ? "primary_release_year" : "first_air_date_year"}=${YEAR}`))?.results?.[0];
  if (hit) found.set(`${kind}:${hit.id}`, { kind, id: hit.id, title: t.title, date: d, slug: t.slug, popularity: hit.popularity, votes: hit.vote_count });
  else found.set(`local:${t.slug}`, { kind, id: null, title: t.title, date: d, slug: t.slug, popularity: 0, votes: 0 });
}

// ---- Box office and IMDb ids (TMDB details) ----
const candidates = [...found.values()];
for (const c of candidates) {
  if (!c.id) continue;
  const d = await tmdb(`/${c.kind}/${c.id}?append_to_response=external_ids`);
  c.revenue = c.kind === "movie" ? d?.revenue || 0 : null;
  c.imdb = d?.external_ids?.imdb_id ?? d?.imdb_id ?? null;
  c.language = d?.original_language;
  c.genres = (d?.genres ?? []).map((g) => g.name);
  // Match Explore's own slug when the title is already there under its IMDb id.
  const local = raw.titles.find((t) => t.imdb_id && t.imdb_id === c.imdb);
  if (local) c.slug = local.slug;
}

// ---- Festivals and awards (Wikidata, by IMDb id) ----
const ids = candidates.map((c) => c.imdb).filter(Boolean);
const sparql = `SELECT ?imdb (COUNT(DISTINCT ?a) AS ?awards) (COUNT(DISTINCT ?n) AS ?noms) WHERE {
  VALUES ?imdb { ${ids.map((i) => `"${i}"`).join(" ")} } ?w wdt:P345 ?imdb.
  OPTIONAL { ?w wdt:P166 ?a } OPTIONAL { ?w wdt:P1411 ?n } } GROUP BY ?imdb`;
const wd = await fetch(`https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(sparql)}`, { headers: { "User-Agent": UA } })
  .then((r) => (r.ok ? r.json() : null))
  .catch(() => null);
const honours = new Map((wd?.results.bindings ?? []).map((b) => [b.imdb.value, 2 * Number(b.awards.value) + Number(b.noms.value)]));
const FESTIVAL = /festival|cannes|berlinale|venice|sundance|toronto|tiff|sxsw|award|oscar|academy|emmy|golden globe|bafta/i;
for (const c of candidates) {
  const fest = lineup.get(c.title.toLowerCase());
  c.festivalNames = fest ? [...fest.festivals].map((f) => f.replace(/^(\d{4}|\d+(st|nd|rd|th)) /, "")) : [];
  c.festivals = (honours.get(c.imdb) ?? 0) + (fest ? 2 * fest.festivals.size + 3 * fest.prizes : 0) + (FESTIVAL.test(onExplore.get(c.slug)?.recognition ?? "") ? 3 : 0);
}

// ---- Views on Nia ----
const views = new Map();
if (process.env.SUPABASE_SECRET_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL) {
  const r = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/explore_views?select=slug,views`, {
    headers: { apikey: process.env.SUPABASE_SECRET_KEY, Authorization: `Bearer ${process.env.SUPABASE_SECRET_KEY}` },
  }).catch(() => null);
  for (const row of r?.ok ? await r.json() : []) views.set(row.slug, (views.get(row.slug) ?? 0) + row.views);
}
for (const c of candidates) c.views = views.get(c.slug) ?? 0;

// ---- Score: each signal as a rank from 0 to 1 among the candidates that have it ----
function ranker(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return (v) => (sorted.length < 2 ? 0 : sorted.findLastIndex((x) => x <= v) / (sorted.length - 1));
}
const pop = ranker(candidates.map((c) => c.popularity + c.votes / 50));
const box = ranker(candidates.filter((c) => c.revenue != null).map((c) => c.revenue));
const fest = ranker(candidates.map((c) => c.festivals));
const seen = ranker(candidates.map((c) => c.views));
for (const c of candidates) {
  const parts = [[0.3, pop(c.popularity + c.votes / 50)], [0.25, fest(c.festivals)], [0.2, seen(c.views)]];
  if (c.revenue != null) parts.push([0.25, box(c.revenue)]);
  const w = parts.reduce((s, [x]) => s + x, 0);
  c.score = Math.round((parts.reduce((s, [x, v]) => s + x * v, 0) / w) * 1000) / 1000;
}
candidates.sort((a, b) => b.score - a.score);

// ---- Write ----
// The category is the year's top 100 (Ika, 2026-11-19; top 20 until then); the ones not on Explore
// yet are the next titles to add.
const TOP = 100;
const live = (slug) => onExplore.has(slug) && covers.has(slug);
const top = candidates.slice(0, TOP);
const ranked = top.filter((c) => live(c.slug)).map((c) => c.slug);
const toAdd = top.filter((c) => !live(c.slug)).map((c) => c.slug);
fs.writeFileSync("src/features/explore/best-of-2026.json", JSON.stringify({ updated: TODAY, slugs: ranked, toAdd }, null, 1) + "\n");
fs.mkdirSync("scripts/out", { recursive: true });
fs.writeFileSync(
  "scripts/out/best-of-2026.json",
  JSON.stringify(candidates.map(({ kind, title, date, slug, score, popularity, votes, revenue, festivals, festivalNames, views, imdb, language, genres }) => ({ slug, title, kind, date, score, onExplore: live(slug), popularity: Math.round(popularity), votes, revenue, festivals, festivalNames, views, imdb, language, genres })), null, 1),
);
console.log(`${candidates.length} candidates; top ${TOP}: ${ranked.length} on Explore (${ranked.join(", ")}), ${toAdd.length} to add`);
console.log(`Top ${TOP}:`);
for (const c of candidates.slice(0, TOP)) console.log(`${c.score.toFixed(3)}  ${live(c.slug) ? "on Explore " : "to add     "} ${c.title} (${c.kind}, ${c.date}) box ${c.revenue ?? "-"} fest ${c.festivals} [${c.festivalNames.join(", ")}] views ${c.views}`);
