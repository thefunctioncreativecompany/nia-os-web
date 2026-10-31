// Finds creator films for Explore (Ika, 2026-10-31: "a more automated way to source creator
// videos… strictly creator content"). Proposals only: each candidate is reviewed by Ika before
// it's written up (credits, summary, tags) and added, like every Explore title.
//
// Sources, all official and public:
//   Vimeo Staff Picks   the public RSS feed (no key) plus Vimeo's oEmbed for each video's maker,
//                       length and frame size (no key)
//   YouTube             search for creator work (fashion films, music videos, spec ads, shorts)
//                       when YOUTUBE_API_KEY is set in .env.local (YouTube Data API v3, free
//                       quota); only videos that allow embedding
//   Instagram           not searchable without Meta's approved app (hashtag search); add posts
//                       by hand as now, and run scripts/check-instagram-embeds.mjs
//
// "Strictly creator": no trailers, clips, episodes, reviews or interviews; no studio, streamer or
// network channels; 30 seconds to 25 minutes.
//
//   node --env-file=.env.local scripts/find-creator-films.mjs
// Writes scripts/out/creator-candidates.json.
import fs from "node:fs";

const UA = "NiaExplore/1.0 (https://app.niatechnologies.co)";
const NOT_CREATOR = /\b(trailer|teaser|official clip|clip|episode|ep\.|full movie|reaction|review|podcast|interview|behind the scenes|bts|recap|live stream|livestream)\b/i;
const STUDIO_CHANNELS = /\b(netflix|warner|universal|paramount|sony pictures|columbia|disney|pixar|marvel|lucasfilm|20th century|searchlight|a24|neon|lionsgate|focus features|hbo|max|amazon|prime video|apple tv|hulu|peacock|bbc|showtime|starz|mgm|fandango|movieclips|rotten tomatoes|ign)\b/i;
const MIN_SECONDS = 30;
const MAX_SECONDS = 25 * 60;

// The production type it most likely is, in the projects' list (src/lib/projects.ts).
function typeOf(text) {
  const t = text.toLowerCase();
  if (/music video|\bmv\b|official video/.test(t)) return "Music Video";
  if (/fashion film|lookbook|campaign film|\bss\d{2}|\baw\d{2}|\bfw\d{2}/.test(t)) return "Fashion Film";
  if (/spec ad|commercial|\bad\b|advert|brand film/.test(t)) return "Commercial";
  if (/documentary|\bdoc\b/.test(t)) return "Documentary";
  return "Short Film";
}

const text = (s) => s.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();

async function vimeoStaffPicks() {
  const rss = await (await fetch("https://vimeo.com/channels/staffpicks/videos/rss", { headers: { "User-Agent": UA } })).text();
  const items = [...rss.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
  const out = [];
  for (const item of items) {
    const link = item.match(/<link>([^<]+)<\/link>/)?.[1] ?? "";
    const id = link.match(/(\d{6,})/)?.[1];
    if (!id) continue;
    const r = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(`https://vimeo.com/${id}`)}`, { headers: { "User-Agent": UA } });
    if (!r.ok) continue; // private, or embedding turned off
    const o = await r.json();
    out.push({
      source: "vimeo",
      id,
      url: `https://vimeo.com/${id}`,
      title: o.title,
      maker: o.author_name,
      makerUrl: o.author_url,
      seconds: o.duration,
      aspect: o.width && o.height ? Number((o.width / o.height).toFixed(3)) : null,
      published: item.match(/<pubDate>([^<]+)<\/pubDate>/)?.[1] ?? null,
      about: text(o.description ?? item.match(/<description>([\s\S]*?)<\/description>/)?.[1] ?? "").slice(0, 280),
      why: "Vimeo Staff Pick",
    });
  }
  return out;
}

async function youtube(key) {
  const queries = ["fashion film", "music video directed by", "spec ad", "short film", "brand film", "lookbook film"];
  const since = new Date(Date.now() - 365 * 24 * 3600 * 1000).toISOString();
  const ids = new Map();
  for (const q of queries) {
    const params = new URLSearchParams({ part: "snippet", q, type: "video", videoEmbeddable: "true", videoSyndicated: "true", maxResults: "25", order: "relevance", publishedAfter: since, key });
    const r = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
    if (!r.ok) throw new Error(`YouTube search: ${r.status} ${await r.text()}`);
    for (const it of (await r.json()).items ?? []) ids.set(it.id.videoId, q);
  }
  const out = [];
  const list = [...ids.keys()];
  for (let i = 0; i < list.length; i += 50) {
    const params = new URLSearchParams({ part: "snippet,contentDetails,player", id: list.slice(i, i + 50).join(","), key });
    const r = await fetch(`https://www.googleapis.com/youtube/v3/videos?${params}`);
    if (!r.ok) throw new Error(`YouTube videos: ${r.status}`);
    for (const v of (await r.json()).items ?? []) {
      const d = v.contentDetails.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/) ?? [];
      const seconds = (Number(d[1] ?? 0) * 3600) + (Number(d[2] ?? 0) * 60) + Number(d[3] ?? 0);
      out.push({
        source: "youtube",
        id: v.id,
        url: `https://www.youtube.com/watch?v=${v.id}`,
        title: v.snippet.title,
        maker: v.snippet.channelTitle,
        makerUrl: `https://www.youtube.com/channel/${v.snippet.channelId}`,
        seconds,
        aspect: null,
        published: v.snippet.publishedAt,
        about: text(v.snippet.description ?? "").slice(0, 280),
        why: `YouTube search: “${ids.get(v.id)}”`,
      });
    }
  }
  return out;
}

const found = await vimeoStaffPicks();
if (process.env.YOUTUBE_API_KEY) found.push(...(await youtube(process.env.YOUTUBE_API_KEY)));
else console.log("YouTube skipped: add YOUTUBE_API_KEY to .env.local to search it.");

const kept = found
  .filter((c) => !NOT_CREATOR.test(`${c.title} ${c.about}`))
  .filter((c) => !STUDIO_CHANNELS.test(c.maker ?? ""))
  .filter((c) => c.seconds >= MIN_SECONDS && c.seconds <= MAX_SECONDS)
  .map((c) => ({ ...c, type: typeOf(`${c.title} ${c.about}`) }));

fs.mkdirSync("scripts/out", { recursive: true });
fs.writeFileSync("scripts/out/creator-candidates.json", JSON.stringify(kept, null, 1) + "\n");
console.log(`${found.length} found · ${kept.length} creator films kept for review`);
for (const c of kept) console.log(`  ${c.type.padEnd(12)} ${c.title} — ${c.maker} (${Math.round(c.seconds / 60)} min, ${c.source})`);
