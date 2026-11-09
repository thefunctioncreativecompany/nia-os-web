// Stand-in covers (Ika, 2026-10-31): until TMDB's commercial licence allows posters, a title
// waiting for a cover shows a still from its official trailer (the studio's or streamer's own
// YouTube upload, already shown on its page).
//
//   node scripts/trailer-stills.mjs
// Writes src/features/explore/trailer-stills.json ({ slug: { id, size, top, bottom, x } }). Re-run after adding
// titles; a title that gets a real poster (cover-sources.json) uses that instead.
import fs from "node:fs";
import sharp from "sharp";

const data = JSON.parse(fs.readFileSync("src/features/explore/made-in-africa.json", "utf8"));
const posters = new Set(Object.keys(JSON.parse(fs.readFileSync("src/features/explore/cover-sources.json", "utf8"))));
// Frames YouTube takes from inside the video (a quarter, half and three quarters through), at
// 1280×720. Not the channel's own thumbnail: that often has words on it ("TRAILER HD") that look
// broken cropped to a poster. Which frame each film shows was chosen by eye from all three
// (2026-10-31, contact sheets); a title not listed keeps waiting for its cover.
// [frame, where the subject is across the picture (0 left, 1 right), "sd" for 640 × 480 frames],
// for the poster crop.
const CHOSEN = {
  "children-of-blood-and-bone": [2, 0.5], "in-the-heat-of-the-night": [3, 0.48], "the-graduate": [1, 0.4],
  "2001-a-space-odyssey": [2, 0.48], "the-godfather": [1, 0.3], "taxi-driver": [1, 0.35],
  "star-wars": [2, 0.35], "apocalypse-now": [2, 0.45], "ride-along": [3, 0.3],
  "the-matrix": [2, 0.5], "coming-to-america": [3, 0.42], "coming-2-america": [3, 0.62],
  "the-karate-kid-2010": [2, 0.45], "the-pursuit-of-happyness": [1, 0.28], "boyz-n-the-hood": [1, 0.35],
  "malcolm-x": [2, 0.7], "training-day": [2, 0.72], "ray": [3, 0.65],
  "dreamgirls": [3, 0.5], "bad-boys": [3, 0.55], "waiting-to-exhale": [3, 0.6],
  "crouching-tiger-hidden-dragon": [2, 0.56], "get-out": [2, 0.55], "black-panther": [2, 0.27],
  "moonlight": [3, 0.5], "hidden-figures": [2, 0.5], "crazy-rich-asians": [3, 0.48],
  "rocky": [1, 0.4], "the-godfather-part-ii": [2, 0.72], "back-to-the-future": [3, 0.5],
  "die-hard": [3, 0.42], "pulp-fiction": [2, 0.55], "the-shawshank-redemption": [2, 0.5],
  "toy-story": [1, 0.45], "titanic": [2, 0.4], "the-blair-witch-project": [3, 0.5],
  // 2026-11-08 (Mbali, Paballo and Ika's titles)
  "harry-potter-and-the-philosophers-stone": [3, 0.5], "harry-potter-and-the-chamber-of-secrets": [3, 0.38], "harry-potter-and-the-prisoner-of-azkaban": [3, 0.42], "harry-potter-and-the-goblet-of-fire": [2, 0.4], "harry-potter-and-the-order-of-the-phoenix": [2, 0.5], "harry-potter-and-the-half-blood-prince": [1, 0.35], "harry-potter-and-the-deathly-hallows-part-1": [1, 0.45], "harry-potter-and-the-deathly-hallows-part-2": [2, 0.55], "27-dresses": [1, 0.32], "13-going-on-30": [3, 0.5], "baps": [2, 0.5], "charlies-angels": [1, 0.45], "matilda": [1, 0.52], "chicago": [2, 0.5], "nanny-mcphee": [2, 0.52], "bugonia": [2, 0.5], "tenzing": [3, 0.5], "modern-family": [1, 0.36], "love-thy-neighbor": [1, 0.45], "the-last-days-of-ptolemy-grey": [1, 0.45], "ancestral-visions-of-the-future": [1, 0.55],
  // 2026-11-08 (Coodie & Chike's films, and Katrina Babies). "sd": an older video YouTube keeps
  // only 640 × 480 frames for.
  "jeen-yuhs": [2, 0.5], "benji": [2, 0.55], "a-kid-from-coney-island": [3, 0.6], "muhammad-ali-the-peoples-champ": [2, 0.5],
  "the-college-dropout-video-anthology": [2, 0.5, "sd"], "katrina-babies": [3, 0.55],
};

// The black bars above and below the picture, in pixels, so the cover can be cropped to the
// picture alone (src/app/api/explore-still/[slug]/route.ts).
async function bars(url) {
  const r = await fetch(url);
  if (!r.ok) return null;
  const { data, info } = await sharp(Buffer.from(await r.arrayBuffer())).greyscale().raw().toBuffer({ resolveWithObject: true });
  const rowMean = (y) => {
    let sum = 0;
    for (let x = 0; x < info.width; x++) sum += data[y * info.width + x];
    return sum / info.width;
  };
  let top = 0;
  while (top < info.height / 3 && rowMean(top) < 8) top++;
  let bottom = 0;
  while (bottom < info.height / 3 && rowMean(info.height - 1 - bottom) < 8) bottom++;
  // Letterbox bars are pure black and the same top and bottom; a dark scene isn't, so the
  // smaller side counts for both.
  const bar = Math.min(top, bottom);
  return { top: bar, bottom: bar, height: info.height };
}

const out = {};
for (const t of data.titles) {
  if (posters.has(t.slug)) continue;
  // The official trailer, else the studio's or network's own clip or promo (2026-11-08).
  const yt = (t.videos ?? []).filter((v) => v.provider === "youtube");
  const trailer = yt.find((v) => v.kind === "trailer" && v.is_primary) ?? yt.find((v) => v.kind === "trailer") ?? yt.find((v) => v.is_primary);
  if (!trailer) {
    console.log(`${t.slug}: no official video`);
    continue;
  }
  const [frame, x, small] = CHOSEN[t.slug] ?? [];
  if (!frame) {
    console.log(`${t.slug}: no frame chosen, keeps waiting`);
    continue;
  }
  const size = `${small ?? "maxres"}${frame}`;
  const cut = await bars(`https://i.ytimg.com/vi/${trailer.video_id}/${size}.jpg`);
  if (cut) out[t.slug] = { id: trailer.video_id, size, top: cut.top, bottom: cut.bottom, x, ...(small ? { w: 640, h: 480 } : {}), ...(trailer.kind === "trailer" ? {} : { kind: trailer.kind }) };
  if (!out[t.slug]) console.log(`${t.slug}: no frames for ${trailer.video_id}, keeps waiting`);
}
fs.writeFileSync("src/features/explore/trailer-stills.json", JSON.stringify(out, null, 1) + "\n");
console.log(`${Object.keys(out).length} stand-in covers`);
