// Builds draft press kits for Explore's titles and films (Ika, 2026-10-28), the same shape as the
// Top 10's (src/components/explore/press-coverage.ts), into scripts/out/press-kit-drafts.json
// plus a report of what's missing. Run from the project root:
//   node scripts/build-press-kits.mjs                 every title and film without a press kit
//   node scripts/build-press-kits.mjs mami-wata hamnet  just these
// Where things come from:
//  • Reviews: the title's English Wikipedia "Reception" (or "Critical response") section, whose
//    editors balance praise and criticism and cite published reviews. Each cited review keeps
//    its publication, headline and link (archived copy when the original is gone), the sentence
//    that cites it (for the verdict), and a draft verdict from that sentence's wording. Links
//    that answer 404/410 are dropped.
//  • Context: cited articles from the Production / Release / Controversy sections.
//  • Videos: YouTube searches kept to official uploaders (studios, streamers, distributors,
//    festivals, major outlets: TRUSTED below) or verified channels for interviews, that name the
//    title and may play on other sites (oEmbed). Sorted trailer, interviews, featurettes, Q&As.
//  • IMDb id and box office: Wikidata (P345) and the infobox's gross.
// Then a person checks the drafts: verdicts, that each video is the right film, and fills gaps by
// hand. scripts/apply-press-kits.mjs (or a careful edit) moves them into
// src/features/explore/press-kits.json, which the app reads.
import { mkdir, readFile, writeFile } from "node:fs/promises";

const UA = "NiaOS/1.0 (nia@niatechnologies.co)";
const BROWSER = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36";
const OUT = "scripts/out";

// Uploaders whose videos count as official or press: studios, streamers, distributors,
// festivals and publications. Matched against the channel name, case-insensitively.
const TRUSTED = [
  /^netflix/i, /africaonnetflix/i, /still watching netflix/i, /^showmax/i, /prime video/i, /amazon mgm/i, /^apple tv/i, /disney/i, /^hbo/i, /^max$/i, /^hulu/i, /peacock/i, /paramount/i,
  /sony pictures/i, /universal pictures/i, /warner bros/i, /^lionsgate/i, /^a24$/i, /^neon$/i, /focus features/i, /searchlight/i, /20th century/i, /mubi/i, /criterion/i, /janus films/i,
  /kino lorber/i, /film movement/i, /strand releasing/i, /grasshopper film/i, /cohen media/i, /magnolia pictures/i, /ifc films/i, /oscilloscope/i, /curzon/i, /^bfi$/i, /altitude/i, /modern films/i,
  /dogwoof/i, /^array/i, /indigenous film distribution/i, /ster-kinekor/i, /nu metro/i, /madman/i, /metrodome/i, /new wave films/i, /picturehouse/i, /artificial eye/i, /mk2/i, /pyramide/i,
  /^tiff$/i, /sundance/i, /berlinale/i, /festival de cannes/i, /biennale/i, /film at lincoln center/i, /new york film festival/i, /bfi london/i, /tribeca/i, /^sxsw/i, /iffr/i, /fespaco/i,
  /joburg film festival/i, /durban/i, /african film festival/i, /new york asian film festival/i, /locarno/i, /karlovy vary/i, /^tiff originals/i,
  /^variety$/i, /hollywood reporter/i, /rotten tomatoes/i, /movieclips/i, /indiewire/i, /^deadline/i, /vanity fair/i, /^gq$/i, /^vogue$/i, /entertainment tonight/i, /^empire/i,
  /al jazeera/i, /^bbc/i, /^cnn/i, /channel 4 news/i, /arise news/i, /^enca/i, /sabc/i, /newzroom afrika/i, /okayafrica/i, /trt world/i, /^dw /i, /france 24/i, /^npr/i, /pbs newshour/i,
  /cbs mornings/i, /good morning america/i, /the daily show/i, /jimmy kimmel/i, /tonight show/i, /kermode and mayo/i, /^ign$/i, /^collider/i, /^fandango/i, /^the guardian$/i,
];
// Verified channels that still aren't press: reactions, recaps and fan edits.
const NOT_PRESS = /react|reaction|recap|explained|ending|breakdown|edit|fan|top 10|review premieres/i;
// A cited piece reads as a review when its headline or the sentence citing it says so; awards,
// deals and lists go to Context instead.
const REVIEWISH = /review|critic|wrote|called|praised|describ|gave it|stars|rated|verdict|calling|labelled|labeled|hailed|panned|criticis|criticiz/i;
const NOT_REVIEW_PIECE = /winners|award|festival lineup|line-up|acquire|deal|lands|box office|list|favou?rite films|best films|nominat|selection|premiere|trailer|first look|poster/i;
// Publications that are listings or aggregators, not reviews.
const NOT_REVIEWS = /rotten ?tomatoes|metacritic|imdb|box ?office ?mojo|the-numbers|the numbers|youtube|twitter|instagram|facebook|wikipedia|letterboxd/i;

const POSITIVE = /prais|acclaim|lauded|commend|masterpiece|triumph|extraordinary|stunning|brilliant|beautiful|gorgeous|powerful|compelling|excellent|superb|five stars|5 stars|4 out of 5|4\/5|four stars|highly|positive|favou?rabl|celebrat|remarkable|impressive|best/i;
const NEGATIVE = /critici[sz]|panned|negative|disappoint|weak|flaw|tedious|dull|bland|uneven|fail|lacked|lacking|less impressed|unconvinc|one star|1 star|2 out of 5|two stars|mixed|however|but/i;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

async function json(url, headers = { "User-Agent": UA }) {
  for (let i = 0; i < 3; i++) {
    const r = await fetch(url, { headers, signal: AbortSignal.timeout(20000) }).catch(() => null);
    if (r?.ok) return r.json();
    await sleep(800 * (i + 1));
  }
  return null;
}

// ---- What to build for ----
async function items(only) {
  const raw = JSON.parse(await readFile("src/features/explore/made-in-africa.json", "utf8"));
  const { FILM_DETAILS } = await import("../src/components/explore/film-details.ts");
  // The Top 10's hand-made press kits (their keys, read from the file's text).
  const top = await readFile("src/components/explore/press-coverage.ts", "utf8");
  const PRESS = Object.fromEntries([...top.slice(top.indexOf("export const PRESS")).matchAll(/^  "?([a-z0-9-]+)"?: \{/gm)].map((m) => [m[1], true]));
  const existing = JSON.parse(await readFile("src/features/explore/press-kits.json", "utf8").catch(() => "{}"));
  const list = [
    ...raw.titles.map((t) => ({ key: t.slug, title: t.title, year: t.year ?? null, type: t.type, credit: t.credit ?? null, platform: t.platform ?? null, imdb: t.imdb_id ?? null, wikipedia: null, videos: (t.videos ?? []).map((v) => v.video_id) })),
    ...Object.entries(FILM_DETAILS).map(([key, d]) => ({ key, title: null, year: d.year, type: d.kind === "Film" ? "film" : "series", credit: d.createdBy ?? null, platform: null, imdb: d.imdb, wikipedia: d.wikipedia, videos: d.video ? [d.video.id] : [] })),
  ];
  // Film titles come from the Wikipedia page name when the film data has none.
  for (const it of list) if (!it.title) it.title = it.wikipedia.replace(/ \(.*\)$/, "");
  const seen = new Set();
  return list.filter((it) => {
    if (seen.has(it.key)) return false;
    seen.add(it.key);
    if (only.length) return only.includes(it.key);
    return !PRESS[it.key] && !existing[it.key];
  });
}

// ---- Wikipedia ----
async function findPage(it) {
  if (it.wikipedia) return it.wikipedia;
  const kind = it.type === "series" ? "television series" : it.type === "documentary" ? "documentary film" : "film";
  // A title can carry a second name in brackets ("Inxeba (The Wound)"): either may be the page's.
  const names = [it.title.replace(/\s*\(.*\)\s*/, ""), it.title.match(/\(([^)]+)\)/)?.[1]].filter(Boolean).map((n) => norm(n.replace(/[.…]+$/, "")));
  for (const name of names) {
    const r = await json(`https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&srlimit=6&srsearch=${encodeURIComponent(`${name} ${it.year ?? ""} ${kind}`)}`);
    const hit = (r?.query?.search ?? []).find((p) => {
      const page = norm(p.title.replace(/\(.*\)/, ""));
      return page === name || page.startsWith(name) || (name.startsWith(page) && page.length > 3);
    });
    if (hit) return hit.title;
  }
  return null;
}

function field(cite, name) {
  const m = cite.match(new RegExp(`\\|\\s*${name}\\s*=\\s*([^|}]*)`, "i"));
  return m ? m[1].replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, "$1").replace(/''+/g, "").trim() : "";
}

// Plain text of wikitext: links to their words, templates and refs out.
const plain = (w) =>
  w
    .replace(/<ref[^>]*\/>/g, "")
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, "")
    .replace(/\{\{[^{}]*\}\}/g, "")
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, "$1")
    .replace(/''+/g, "")
    .replace(/\s+/g, " ")
    .trim();

function sections(wikitext) {
  const parts = wikitext.split(/\n(==+)\s*([^=]+?)\s*\1\s*\n/);
  const out = [{ heading: "lead", text: parts[0] }];
  for (let i = 1; i < parts.length; i += 3) out.push({ heading: parts[i + 1], text: parts[i + 2] ?? "" });
  return out;
}

// Each cited source in a stretch of wikitext, with the sentence that cites it. References are
// swapped for markers first (named ones may be used before they're written out), then each
// sentence keeps the markers that follow it.
function citations(text) {
  const bodies = [];
  const named = new Map();
  let t = text.replace(/<ref(?:\s+name\s*=\s*"?([^">/]+?)"?)?\s*>([\s\S]*?)<\/ref>/g, (_, name, body) => {
    if (name) named.set(name.trim(), body);
    bodies.push(body);
    return ` ⟦${bodies.length - 1}⟧`;
  });
  t = t.replace(/<ref\s+name\s*=\s*"?([^">/]+?)"?\s*\/>/g, (_, name) => {
    const body = named.get(name.trim());
    if (!body) return "";
    bodies.push(body);
    return ` ⟦${bodies.length - 1}⟧`;
  });
  const out = [];
  for (const sentence of t.split(/(?<=[.!?]["'”]?(?:\s?⟦\d+⟧)*)\s+(?=[A-Z"'“])/)) {
    const words = plain(sentence.replace(/⟦\d+⟧/g, "")).slice(0, 400);
    for (const m of sentence.matchAll(/⟦(\d+)⟧/g)) {
      const body = bodies[Number(m[1])];
      if (!/\{\{\s*cite/i.test(body)) continue;
      const url = field(body, "url");
      const dead = /dead|unfit|usurped/i.test(field(body, "url-status"));
      const archive = field(body, "archive-url");
      const outlet = field(body, "work") || field(body, "website") || field(body, "newspaper") || field(body, "magazine") || field(body, "journal") || field(body, "publisher");
      const title = field(body, "title");
      if (!url || !outlet || !title) continue;
      out.push({ outlet, title, href: dead && archive ? archive : url, sentence: words });
    }
  }
  return out;
}

async function wikipedia(it) {
  const page = await findPage(it);
  if (!page) return { page: null };
  const r = await json(`https://en.wikipedia.org/w/api.php?action=parse&format=json&prop=wikitext|properties&redirects=1&page=${encodeURIComponent(page)}`);
  const wikitext = r?.parse?.wikitext?.["*"] ?? "";
  const qid = (r?.parse?.properties ?? []).find((p) => p.name === "wikibase_item")?.["*"] ?? null;
  const all = sections(wikitext);
  const reception = all.filter((s) => /reception|critical|reviews|response/i.test(s.heading)).map((s) => s.text).join("\n");
  const context = all.filter((s) => /production|development|filming|release|controvers|background|legacy|box office/i.test(s.heading)).map((s) => s.text).join("\n");
  const cinema = /\|\s*gross\s*=\s*[^|\n]*\d/.test(wikitext);
  let imdb = it.imdb;
  if (!imdb && qid) {
    const wd = await json(`https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=claims&ids=${qid}`);
    imdb = wd?.entities?.[qid]?.claims?.P345?.[0]?.mainsnak?.datavalue?.value ?? null;
  }
  return { page: r?.parse?.title ?? page, reception: citations(reception), context: citations(context), receptionText: plain(reception).slice(0, 700), cinema, imdb };
}

// Drops links that are gone (404/410). Sites that block robots (403, 429) are kept.
async function alive(href) {
  const r = await fetch(href, { headers: { "User-Agent": BROWSER }, redirect: "follow", signal: AbortSignal.timeout(15000) }).catch(() => null);
  return !r || ![404, 410].includes(r.status);
}

// ---- YouTube ----
async function youtube(query) {
  const page = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&hl=en&gl=US`, { headers: { "User-Agent": BROWSER, "Accept-Language": "en-US,en;q=0.9" } })
    .then((r) => r.text())
    .catch(() => "");
  const data = page.match(/var ytInitialData = (\{.*?\});<\/script>/s);
  if (!data) return [];
  const out = [];
  const walk = (n) => {
    if (!n || typeof n !== "object") return;
    if (n.videoRenderer) {
      const v = n.videoRenderer;
      out.push({
        id: v.videoId,
        title: v.title?.runs?.map((r) => r.text).join("") ?? "",
        channel: v.ownerText?.runs?.[0]?.text ?? "",
        verified: (v.ownerBadges ?? []).some((b) => /Verified|Official Artist/.test(b.metadataBadgeRenderer?.tooltip ?? "")),
      });
    }
    for (const k in n) walk(n[k]);
  };
  walk(JSON.parse(data[1]));
  return out;
}

function kindOf(title, credit) {
  const t = title.toLowerCase();
  if (/q ?& ?a|q and a/.test(t)) return "Festival Q&A";
  if (/press conference|press call/.test(t)) return "Press conference";
  if (/teaser/.test(t)) return "Teaser";
  if (/trailer/.test(t)) return "Official trailer";
  if (/featurette|behind the scenes|making of|bts|vignette|first look/.test(t)) return "Featurette";
  if (/review/.test(t)) return "Video review";
  if (/interview|talks|on making|discuss|in conversation|conversation|explains|cast|director|star/.test(t)) {
    const surname = credit?.split(/[ ,]/).filter(Boolean).pop()?.toLowerCase();
    return surname && t.includes(surname) && !/cast/.test(t) ? "Filmmaker interview" : "Cast interview";
  }
  return null;
}
const ORDER = ["Official trailer", "Teaser", "Cast interview", "Filmmaker interview", "Featurette", "Press conference", "Festival Q&A", "Video review"];

async function embeddable(id) {
  const r = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`).catch(() => null);
  return r?.status === 200;
}

async function videos(it) {
  const year = it.year ?? "";
  const queries = [
    `${it.title} ${year} official trailer`,
    `${it.title} ${it.credit ?? ""} interview`,
    `${it.title} ${year} cast interview behind the scenes`,
    `${it.title} ${it.platform ?? ""} behind the scenes featurette`,
    `${it.title} ${year} film festival Q&A press conference`,
  ];
  const want = norm(it.title.replace(/[:(].*$/, ""));
  const found = new Map();
  for (const q of queries) {
    for (const v of await youtube(q)) {
      if (found.has(v.id) || it.videos.includes(v.id)) continue;
      if (!norm(v.title).includes(want)) continue;
      const kind = kindOf(v.title, it.credit);
      if (!kind) continue;
      const trusted = TRUSTED.some((re) => re.test(v.channel));
      const pressVerified = v.verified && !NOT_PRESS.test(`${v.channel} ${v.title}`) && !["Official trailer", "Teaser", "Video review"].includes(kind);
      if (!trusted && !pressVerified) continue;
      if (kind === "Video review" && !/kermode and mayo/i.test(v.channel)) continue;
      found.set(v.id, { id: v.id, kind, title: v.title.replace(/\s+/g, " ").trim(), channel: v.channel, trusted });
    }
    await sleep(600);
  }
  const list = [...found.values()].sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind) || Number(b.trusted) - Number(a.trusted));
  const kept = [];
  for (const v of list) {
    if (kept.length >= 6) break;
    // One trailer is enough beside the title's own videos.
    if ((v.kind === "Official trailer" || v.kind === "Teaser") && kept.some((k) => k.kind === v.kind)) continue;
    if (await embeddable(v.id)) kept.push(v);
  }
  return kept.map(({ id, kind, title, channel }) => ({ id, kind, title, channel }));
}

// ---- Build ----
const verdictOf = (sentence) => {
  const pos = POSITIVE.test(sentence);
  const neg = NEGATIVE.test(sentence);
  return pos && !neg ? "Positive" : neg && !pos ? "Critical" : "Mixed";
};

const only = process.argv.slice(2);
const list = await items(only);
console.log(`Building ${list.length} press kit drafts…`);
const drafts = {};
const report = [];
const t0 = Date.now();
const took = (label) => process.env.DEBUG && console.log(`  ${label} ${((Date.now() - t0) / 1000).toFixed(1)}s`);
for (const it of list) {
  const wiki = await wikipedia(it);
  took(`${it.key} wikipedia (${wiki.reception?.length ?? 0} cited reviews)`);
  const reviews = [];
  const asContext = [];
  for (const c of wiki.reception ?? []) {
    if (NOT_REVIEWS.test(`${c.outlet} ${c.href}`) || reviews.some((r) => r.href === c.href || r.outlet === c.outlet)) continue;
    if (NOT_REVIEW_PIECE.test(c.title) || !(REVIEWISH.test(c.title) || REVIEWISH.test(c.sentence))) {
      asContext.push(c);
      continue;
    }
    if (!(await alive(c.href))) continue;
    reviews.push({ outlet: c.outlet, title: c.title, href: c.href, verdict: verdictOf(c.sentence), because: c.sentence });
    if (reviews.length >= 6) break;
  }
  const articles = [];
  for (const c of [...asContext, ...(wiki.context ?? [])]) {
    if (NOT_REVIEWS.test(`${c.outlet} ${c.href}`) || reviews.some((r) => r.href === c.href) || articles.some((a) => a.href === c.href)) continue;
    if (!(await alive(c.href))) continue;
    articles.push({ outlet: c.outlet, title: c.title, href: c.href });
    if (articles.length >= 2) break;
  }
  took(`${it.key} links checked`);
  const vids = await videos(it);
  took(`${it.key} videos`);
  const streaming = it.platform && /netflix|showmax|prime|apple|disney|hbo|max|hulu|peacock|paramount\+|mubi/i.test(it.platform) ? it.platform : undefined;
  drafts[it.key] = { videos: vids, reviews, articles, ...(streaming ? { streaming } : {}), ...(wiki.cinema ? { cinemaRelease: true } : {}), ...(wiki.imdb ? { imdb: wiki.imdb } : {}), wikipedia: wiki.page };
  const gaps = [
    !wiki.page && "no English Wikipedia page",
    wiki.page && !(wiki.reception ?? []).length && "Wikipedia has no cited reviews",
    !reviews.length && "no reviews",
    !vids.length && "no press videos beyond the trailer",
    !articles.length && "no context articles",
  ].filter(Boolean);
  if (gaps.length) report.push(`${it.key}: ${gaps.join("; ")}`);
  console.log(`${it.key}: ${vids.length} videos, ${reviews.length} reviews, ${articles.length} articles${wiki.page ? "" : " (no Wikipedia page)"}`);
}
await mkdir(OUT, { recursive: true });
await writeFile(`${OUT}/press-kit-drafts.json`, `${JSON.stringify(drafts, null, 1)}\n`);
await writeFile(`${OUT}/press-kit-report.txt`, `${report.join("\n")}\n`);
console.log(`\nDrafts in ${OUT}/press-kit-drafts.json; gaps in ${OUT}/press-kit-report.txt (${report.length}).`);
