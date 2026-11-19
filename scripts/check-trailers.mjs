// Checks the trailers tmdb-trailers.mjs picked (2026-11-19), through YouTube's privacy-enhanced
// player, the one Explore plays them in (youtube-nocookie.com answers this Mac's command line;
// youtube.com refuses it). The embed page says whether the video can play on other sites and
// which channel posted it. Each checked trailer gets its channel in scripts/out/title-assets.json;
// one that can't be embedded is dropped (the title then has no trailer until one is found).
//
//   node scripts/check-trailers.mjs
//
// Read the channels it prints: they should be the studio's, distributor's or streamer's own.
import fs from "node:fs";

const FILE = "scripts/out/title-assets.json";
const assets = JSON.parse(fs.readFileSync(FILE, "utf8"));
// The embed page needs a referring site, as it has on Explore, or it reports a configuration error.
const REFERER = "https://app.niatechnologies.co/";

async function check(id) {
  const r = await fetch(`https://www.youtube-nocookie.com/embed/${id}`, { headers: { Referer: REFERER, "Accept-Language": "en" } }).catch(() => null);
  if (!r?.ok) return { ok: false, reason: `HTTP ${r?.status ?? "unreachable"}` };
  const html = await r.text();
  const status = html.match(/previewPlayabilityStatus\\":\{\\"status\\":\\"([A-Z_]+)/)?.[1] ?? "UNKNOWN";
  const reason = html.match(/previewPlayabilityStatus\\":\{\\"status\\":\\"[A-Z_]+\\",\\"reason\\":\\"([^\\]+)/)?.[1];
  // Text inside the page's escaped JSON: up to the closing \", with escapes like \u0027 (') decoded.
  const text = (m) => (m ? JSON.parse(`"${m}"`) : null);
  const channel = text(html.match(/ExpandedRenderer\\":\{\\"title\\":\{\\"runs\\":\[\{\\"text\\":\\"((?:[^\\]|\\u[0-9a-fA-F]{4}|\\[^"])*?)\\"/)?.[1]);
  const title = text(html.match(/\\"title\\":\{\\"runs\\":\[\{\\"text\\":\\"((?:[^\\]|\\u[0-9a-fA-F]{4}|\\[^"])*?)\\"/)?.[1]);
  return { ok: status === "OK", reason: status === "OK" ? null : (reason ?? status), channel, title };
}

let checked = 0;
let dropped = 0;
for (const [slug, a] of Object.entries(assets)) {
  if (!a.video?.check) continue;
  // The pick, then TMDB's next official trailers, until one can be embedded.
  let c;
  let id;
  for (const v of [{ id: a.video.id }, ...(a.video.alternates ?? [])]) {
    id = v.id;
    c = await check(id);
    if (c.ok) break;
    console.log(`${slug}: ${id} can't be embedded (${c.reason})`);
  }
  if (c.ok) {
    a.video = { id, title: c.title ?? a.video.title, channel: c.channel };
    checked++;
    console.log(`${slug}: OK, ${c.channel} — "${c.title}"`);
  } else {
    a.video = null;
    dropped++;
    console.log(`${slug}: DROPPED (${c.reason})`);
  }
}
fs.writeFileSync(FILE, JSON.stringify(assets, null, 1) + "\n");
console.log(`${checked} checked, ${dropped} dropped`);
