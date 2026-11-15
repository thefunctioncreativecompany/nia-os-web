// By festival on Explore (Ika, 2026-11-15: "only with festivals where content on Explore
// appeared"). Works out which festivals each title on Explore screened at or won at, and writes
// src/features/explore/festivals.json with each festival's logo (public/explore/festivals/<id>.png,
// from its Wikidata logo on Commons) and titles. A festival shows on Explore only when it has a
// title there. Three sources, so nothing is guessed:
//   1. the title's own recognition line on Explore (written and checked by hand),
//   2. Wikidata: awards, nominations and events recorded for the title (P166, P1411, P1344),
//   3. the festival's line-up and prizes on Wikipedia, for the recent editions (titles matched by
//      name and year).
// Rerun after adding titles:
//   node scripts/build-explore-festivals.mjs
import fs from "node:fs";
import sharp from "sharp";

const UA = "NiaOS/1.0 (https://app.niatechnologies.co)";

// The festivals Nia knows, with how each is named in a recognition line (`text`) and on Wikidata
// (`wd`), and its recent Wikipedia pages. Add a festival here when a title needs it.
const FESTIVALS = [
  { id: "cannes", name: "Cannes Film Festival", text: /Cannes(?! Lions)/i, wd: /Cannes|Palme d.Or|Caméra d.Or/i, pages: ["2026 Cannes Film Festival", "2025 Cannes Film Festival"] },
  { id: "berlinale", name: "Berlin International Film Festival", text: /Berlinale|Berlin International Film Festival|Golden Bear|Silver Bear/i, wd: /Berlin International|Berlinale|Golden Bear|Silver Bear|Teddy Award/i, pages: ["76th Berlin International Film Festival", "75th Berlin International Film Festival"] },
  { id: "venice", name: "Venice Film Festival", text: /Venice|Golden Lion|Silver Lion/i, wd: /Venice|Golden Lion|Silver Lion|Volpi Cup/i, pages: ["83rd Venice International Film Festival", "82nd Venice International Film Festival"] },
  { id: "sundance", name: "Sundance Film Festival", text: /Sundance/i, wd: /Sundance/i, pages: ["2026 Sundance Film Festival", "2025 Sundance Film Festival"] },
  { id: "tiff", name: "Toronto International Film Festival", text: /\bTIFF\b|Toronto International Film Festival/i, wd: /Toronto International Film Festival|TIFF People/i, pages: ["2026 Toronto International Film Festival", "2025 Toronto International Film Festival"] },
  { id: "tribeca", name: "Tribeca Festival", text: /Tribeca/i, wd: /Tribeca/i },
  { id: "telluride", name: "Telluride Film Festival", text: /Telluride/i, wd: /Telluride/i },
  { id: "sxsw", name: "SXSW", text: /\bSXSW\b|South by Southwest/i, wd: /South by Southwest|SXSW/i },
  { id: "rotterdam", name: "International Film Festival Rotterdam", text: /Rotterdam/i, wd: /Rotterdam|Tiger Award/i },
  { id: "locarno", name: "Locarno Film Festival", text: /Locarno/i, wd: /Locarno|Golden Leopard/i },
  { id: "san-sebastian", name: "San Sebastián Film Festival", text: /San Sebasti[aá]n/i, wd: /San Sebasti[aá]n|Golden Shell/i },
  { id: "new-york", name: "New York Film Festival", text: /New York Film Festival/i, wd: /New York Film Festival/i },
  { id: "london", name: "BFI London Film Festival", text: /London Film Festival/i, wd: /London Film Festival/i },
  { id: "fespaco", name: "FESPACO", text: /FESPACO/i, wd: /FESPACO|Panafrican Film and Television Festival|Étalon/i },
  { id: "durban", name: "Durban International Film Festival", text: /Durban International Film Festival|\bDIFF\b/i, wd: /Durban International Film Festival/i },
  { id: "carthage", name: "Carthage Film Festival", text: /Carthage Film Festival|Journées cinématographiques de Carthage/i, wd: /Carthage Film Festival|Tanit d.Or/i },
  { id: "marrakech", name: "Marrakech International Film Festival", text: /Marrakech (International )?Film Festival/i, wd: /Marrakech International Film Festival/i },
  { id: "red-sea", name: "Red Sea International Film Festival", text: /Red Sea (International )?Film Festival/i, wd: /Red Sea International Film Festival/i },
  { id: "afriff", name: "Africa International Film Festival", text: /AFRIFF|Africa International Film Festival/i, wd: /Africa International Film Festival/i },
  { id: "encounters", name: "Encounters South African International Documentary Festival", text: /Encounters (South African )?(International )?Documentary/i, wd: /Encounters South African/i },
  { id: "idfa", name: "IDFA", text: /\bIDFA\b|International Documentary Film Festival Amsterdam/i, wd: /International Documentary Film Festival Amsterdam/i },
  { id: "hot-docs", name: "Hot Docs", text: /Hot Docs/i, wd: /Hot Docs/i },
  { id: "annecy", name: "Annecy International Animation Film Festival", text: /Annecy/i, wd: /Annecy/i },
  { id: "busan", name: "Busan International Film Festival", text: /Busan International Film Festival/i, wd: /Busan International Film Festival/i },
];

const raw = JSON.parse(fs.readFileSync("src/features/explore/made-in-africa.json", "utf8"));
const credits = JSON.parse(fs.readFileSync("src/features/explore/film-credits.json", "utf8"));
const found = new Map(FESTIVALS.map((f) => [f.id, new Set()]));
const add = (id, slug) => found.get(id).add(slug);

// 1. Recognition lines.
for (const t of raw.titles) for (const f of FESTIVALS) if (t.recognition && f.text.test(t.recognition)) add(f.id, t.slug);

// 2. Wikidata.
const qids = Object.entries(credits).filter(([, v]) => v.qid).map(([slug, v]) => [v.qid, slug]);
const bySlug = new Map(qids);
const sparql = `SELECT ?film ?xLabel WHERE { VALUES ?film { ${qids.map(([q]) => `wd:${q}`).join(" ")} }
  VALUES ?p { wdt:P166 wdt:P1411 wdt:P1344 } ?film ?p ?x .
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } }`;
const wd = await fetch("https://query.wikidata.org/sparql?format=json", {
  method: "POST",
  headers: { "User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded" },
  body: `query=${encodeURIComponent(sparql)}`,
}).then((r) => (r.ok ? r.json() : null));
for (const b of wd?.results.bindings ?? []) {
  const slug = bySlug.get(b.film.value.split("/").pop());
  for (const f of FESTIVALS) if (slug && f.wd.test(b.xLabel.value)) add(f.id, slug);
}

// 3. Recent line-ups on Wikipedia: a linked, italicised title matched to Explore by name and year.
const norm = (s) => s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const byName = new Map();
for (const t of raw.titles) byName.set(norm(t.title), [...(byName.get(norm(t.title)) ?? []), t]);
for (const f of FESTIVALS) {
  for (const page of f.pages ?? []) {
    const year = Number(page.match(/\d{4}/)?.[0] ?? (page.startsWith("76th") || page.startsWith("83rd") ? 2026 : 2025));
    const j = await fetch(`https://en.wikipedia.org/w/api.php?action=parse&format=json&prop=wikitext&redirects=1&page=${encodeURIComponent(page)}`, { headers: { "User-Agent": UA } })
      .then((r) => r.json())
      .catch(() => null);
    const text = j?.parse?.wikitext?.["*"] ?? "";
    for (const m of text.matchAll(/''\[\[([^\]]+)\]\]''/g)) {
      const name = m[1].split("|").pop().replace(/\s*\((\d{4} )?(film|TV series|miniseries)\)$/i, "");
      for (const t of byName.get(norm(name)) ?? []) if (t.year && Math.abs(t.year - year) <= 1) add(f.id, t.slug);
    }
  }
}

// ---- Logos: each festival's Wikidata logo (P154), from Commons, on a white plate ----
fs.mkdirSync("public/explore/festivals", { recursive: true });
// A logo already in public/explore/festivals is kept. Four were picked by hand (Ika, 2026-11-15:
// "official logos for all"), because Wikidata's was an edition's poster or a banner too thin for a
// round plate: Cannes, its Palme d'Or palm (Commons, "Palme d'Or gold silhouette.svg"); Sundance,
// the Sundance Institute logo (Commons); FESPACO, "Logo du FESPACO.jpg" (Commons); Telluride, the
// wordmark from its own site's 2026 banner, without the edition's dates. Don't refetch these.
const HAND_PICKED = new Set(["cannes", "sundance", "fespaco", "telluride"]);
async function logo(f) {
  const out = `public/explore/festivals/${f.id}.png`;
  if (fs.existsSync(out)) return true;
  if (HAND_PICKED.has(f.id)) return false;
  const search = await fetch(`https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=en&type=item&limit=3&search=${encodeURIComponent(f.name)}`, { headers: { "User-Agent": UA } }).then((r) => r.json());
  for (const hit of search.search ?? []) {
    const e = await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${hit.id}.json`, { headers: { "User-Agent": UA } }).then((r) => r.json());
    const file = e.entities[hit.id]?.claims?.P154?.[0]?.mainsnak?.datavalue?.value;
    if (!file) continue;
    const img = await fetch(`https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=480`, { headers: { "User-Agent": UA } });
    if (!img.ok) continue;
    await sharp(Buffer.from(await img.arrayBuffer())).resize(480, 480, { fit: "inside" }).png().toFile(out);
    return true;
  }
  return false;
}

const festivals = [];
for (const f of FESTIVALS) {
  const slugs = [...found.get(f.id)];
  if (!slugs.length) continue;
  festivals.push({ id: f.id, name: f.name, logo: await logo(f), slugs });
}
festivals.sort((a, b) => b.slugs.length - a.slugs.length);
fs.writeFileSync(
  "src/features/explore/festivals.json",
  JSON.stringify({ $comment: "By festival on Explore: written by scripts/build-explore-festivals.mjs. Don't edit by hand; add a festival to the script's list.", festivals }, null, 1) + "\n",
);
for (const f of festivals) console.log(`${f.name}: ${f.slugs.length}${f.logo ? "" : " (no logo)"} · ${f.slugs.slice(0, 6).join(", ")}`);
