// Cast & crew for Explore's films and series (Ika, 2026-11-01: every Explore project shows its
// Cast & Crew row, as creator films do). Reads each title's credits from Wikidata (free to reuse,
// CC0): director or creator, writers, producers, director of photography, editor, music,
// production and costume design, and the first twelve cast members with the character they play.
// A person's picture is their free photo on Wikimedia Commons (Wikidata's "image"), credited to
// its author with its licence; everyone else shows initials (agreed with Ika). Writes
// src/features/explore/film-credits.json and film-people.json. Run from the project root, after
// adding titles:
//   node scripts/build-explore-credits.mjs            (only titles not done yet)
//   node scripts/build-explore-credits.mjs --all      (everything again)
import { readFile, writeFile } from "node:fs/promises";

const UA = "NiaOS/1.0 (nia@niatechnologies.co)";
const CREDITS = "src/features/explore/film-credits.json";
const PEOPLE = "src/features/explore/film-people.json";
const CAST_LIMIT = 12;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function json(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    const r = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(30000) }).catch(() => null);
    if (r?.ok) return r.json();
    await sleep(2000 * (i + 1));
  }
  return null;
}

// Crew in the order a credit block reads. Series use "creator" where films have a director.
const CREW = [
  ["P170", "Creator"],
  ["P57", "Director"],
  ["P58", "Writer"],
  ["P162", "Producer"],
  ["P344", "Director of Photography"],
  ["P1040", "Editor"],
  ["P86", "Music"],
  ["P2554", "Production Designer"],
  ["P2515", "Costume Designer"],
];

// ---- The titles: Explore's library and the press-kit films ----
const library = JSON.parse(await readFile("src/features/explore/made-in-africa.json", "utf8"));
const titles = library.titles.map((t) => ({ slug: t.slug, title: t.title, year: t.year, series: /series/i.test(t.type), imdb: t.imdb_id ?? null, wikipedia: null }));
const filmSource = await readFile("src/components/explore/film-details.ts", "utf8");
const consts = Object.fromEntries([...filmSource.matchAll(/^const ([A-Z_]+): FilmDetails = \{([\s\S]*?)^\};/gm)].map((m) => [m[1], m[2]]));
const filmBlock = filmSource.slice(filmSource.indexOf("export const FILM_DETAILS"));
for (const m of filmBlock.matchAll(/^ {2}("?[a-z0-9-]+"?): (?:\{([\s\S]*?)^ {2}\}|([A-Z_]+)),$/gm)) {
  const body = m[2] ?? consts[m[3]] ?? "";
  const id = m[1].replaceAll('"', "");
  titles.push({
    slug: `film-${id}`,
    title: null,
    year: Number(body.match(/year: (\d{4})/)?.[1]) || null,
    series: /kind: "[^"]*series/i.test(body),
    imdb: body.match(/imdb: "(tt\d+)"/)?.[1] ?? null,
    wikipedia: body.match(/wikipedia: "([^"]+)"/)?.[1] ?? null,
  });
}

// Items checked by hand where the search can't confirm them (no English label on Wikidata).
const CHECKED = { "shaka-ilembe": "Q121796698" };

// ---- Wikidata ----
async function qidByImdb(imdb) {
  const r = await json(`https://www.wikidata.org/w/api.php?action=query&list=search&format=json&srsearch=haswbstatement:P345=${imdb}`);
  return r?.query?.search?.[0]?.title ?? null;
}
async function qidByWikipedia(page) {
  const r = await json(`https://en.wikipedia.org/w/api.php?action=query&prop=pageprops&redirects=1&format=json&titles=${encodeURIComponent(page)}`);
  return Object.values(r?.query?.pages ?? {})[0]?.pageprops?.wikibase_item ?? null;
}
async function qidBySearch(t) {
  const r = await json(`https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&srlimit=1&srsearch=${encodeURIComponent(`${t.title} ${t.year ?? ""} ${t.series ? "television series" : "film"}`)}`);
  const page = r?.query?.search?.[0]?.title;
  return page ? qidByWikipedia(page) : null;
}
async function entities(ids, props) {
  const out = {};
  for (let i = 0; i < ids.length; i += 50) {
    const r = await json(`https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&languages=en&props=${props}&ids=${ids.slice(i, i + 50).join("|")}`);
    Object.assign(out, r?.entities ?? {});
    await sleep(200);
  }
  return out;
}
const itemId = (snak) => snak?.datavalue?.value?.id ?? null;
const label = (e) => e?.labels?.en?.value ?? null;
const strip = (html) => (html ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

const all = process.argv.includes("--all");
const credits = all ? {} : JSON.parse(await readFile(CREDITS, "utf8").catch(() => "{}"));
const people = all ? {} : JSON.parse(await readFile(PEOPLE, "utf8").catch(() => "{}"));
const todo = titles.filter((t) => !credits[t.slug]);
console.log(`${todo.length} of ${titles.length} titles to read`);

// 1. Each title's Wikidata item: by its IMDb id or Wikipedia page, else a search.
const qids = {};
const searched = new Set();
for (const t of todo) {
  qids[t.slug] = CHECKED[t.slug] ?? ((t.imdb && (await qidByImdb(t.imdb))) || (t.wikipedia && (await qidByWikipedia(t.wikipedia))) || null);
  if (!qids[t.slug] && t.title) {
    qids[t.slug] = await qidBySearch(t);
    if (qids[t.slug]) searched.add(t.slug);
  }
  await sleep(150);
}

// 2. Their credits. A searched item counts only when it is the same work: the same name, or a
// film or series from the same year (a search for "iNumber Number" finds "I Am Number Four").
const works = await entities([...new Set(Object.values(qids).filter(Boolean))], "labels|claims");
const plainName = (s) => (s ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const yearOf = (e) => Number((e?.claims?.P577?.[0]?.mainsnak?.datavalue?.value?.time ?? "").slice(1, 5)) || null;
const isPerson = (e) => (e?.claims?.P31 ?? []).some((c) => itemId(c.mainsnak) === "Q5");
for (const t of todo) {
  const e = works[qids[t.slug]];
  if (!searched.has(t.slug) || !e) continue;
  const a = plainName(label(e));
  const b = plainName(t.title);
  const sameName = a && (a === b || b.startsWith(a) || a.startsWith(b));
  const sameYear = t.year && yearOf(e) === t.year;
  if (isPerson(e) || !(sameName || sameYear)) {
    console.log(`  not the same work: ${t.slug} → ${label(e) ?? qids[t.slug]}`);
    qids[t.slug] = null;
  }
}
for (const t of todo) if (!qids[t.slug]) console.log(`  no Wikidata item: ${t.slug}`);
const characters = new Set();
const raw = {};
for (const t of todo) {
  const claims = works[qids[t.slug]]?.claims;
  if (!claims) continue;
  const list = [];
  for (const c of (claims.P161 ?? []).slice(0, CAST_LIMIT)) {
    const id = itemId(c.mainsnak);
    if (!id) continue;
    const q = c.qualifiers ?? {};
    const charItem = itemId(q.P453?.[0]);
    const charText = q.P4633?.[0]?.datavalue?.value ?? null;
    if (charItem) characters.add(charItem);
    list.push({ id, role: "Cast", charItem, charText });
  }
  for (const [prop, role] of CREW) {
    for (const c of claims[prop] ?? []) {
      const id = itemId(c.mainsnak);
      if (id) list.push({ id, role });
    }
  }
  raw[t.slug] = { qid: qids[t.slug], list };
}

// 3. Names, photos and characters' names.
const personIds = [...new Set(Object.values(raw).flatMap((r) => r.list.map((p) => p.id)))].filter((id) => !people[id]);
const found = await entities([...personIds, ...characters], "labels|claims");
const files = {};
for (const id of personIds) {
  const e = found[id];
  if (!e || !label(e)) continue;
  // Only people (instance of human); a band or a company credited as music stays out.
  const human = (e.claims?.P31 ?? []).some((c) => itemId(c.mainsnak) === "Q5");
  if (!human) continue;
  people[id] = { name: label(e) };
  const file = e.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
  if (file) files[file] = id;
}

// 4. Each photo's author and licence from Commons, and a 500-wide copy's address (Commons
// serves standard widths only), on upload.wikimedia.org without the tracking query.
const names = Object.keys(files);
for (let i = 0; i < names.length; i += 50) {
  const batch = names.slice(i, i + 50);
  const r = await json(`https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=500&titles=${encodeURIComponent(batch.map((f) => `File:${f}`).join("|"))}`);
  const norm = Object.fromEntries((r?.query?.normalized ?? []).map((n) => [n.to, n.from]));
  for (const page of Object.values(r?.query?.pages ?? {})) {
    const info = page.imageinfo?.[0];
    if (!info?.thumburl) continue;
    const file = (norm[page.title] ?? page.title).replace(/^File:/, "");
    const id = files[file] ?? files[page.title.replace(/^File:/, "")];
    if (!id || !people[id]) continue;
    const meta = info.extmetadata ?? {};
    const licence = strip(meta.LicenseShortName?.value) || "see Commons";
    if (/fair use|non-free/i.test(licence)) continue;
    people[id].photo = {
      src: info.thumburl.split("?")[0].replace("https://thumb.wikimedia.org/", "https://upload.wikimedia.org/"),
      page: info.descriptionurl,
      author: strip(meta.Artist?.value).slice(0, 120) || "Unknown author",
      licence,
    };
  }
  await sleep(200);
}

// 5. Each title's row: cast first (with who they play), then crew; someone credited twice once.
for (const [slug, r] of Object.entries(raw)) {
  const rows = [];
  for (const p of r.list) {
    if (!people[p.id]) continue;
    const character = p.charText || (p.charItem && label(found[p.charItem])) || undefined;
    const hit = rows.find((x) => x.id === p.id);
    if (hit) {
      if (!hit.role.split(", ").includes(p.role)) hit.role = `${hit.role}, ${p.role}`;
      continue;
    }
    rows.push({ id: p.id, role: p.role, ...(character ? { character } : {}) });
  }
  credits[slug] = { qid: r.qid, people: rows };
}

const sorted = (o) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));
await writeFile(CREDITS, JSON.stringify(sorted(credits), null, 1) + "\n");
await writeFile(PEOPLE, JSON.stringify(sorted(people), null, 1) + "\n");
const withPeople = Object.values(credits).filter((c) => c.people.length).length;
const photos = Object.values(people).filter((p) => p.photo).length;
console.log(`${withPeople} titles with cast & crew; ${Object.keys(people).length} people, ${photos} with a Commons photo`);
