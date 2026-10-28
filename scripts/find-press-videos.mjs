// Finds press-kit videos on YouTube (Ika, 2026-10-28): lists the top results for a search with
// the channel, a ✓ for verified channels, length, age and views, and whether each video may play
// on other sites (YouTube oEmbed), so official trailers and interviews from studios, streamers,
// festivals and major outlets are quick to pick for src/components/explore/press-coverage.ts.
// Run from the project root, one search per run:
//   node scripts/find-press-videos.mjs "The Woman King cast interview"
// Still check each pick by eye: the uploader must be the studio, streamer, festival or outlet.
const query = process.argv.slice(2).join(" ");
if (!query) {
  console.log('Usage: node scripts/find-press-videos.mjs "<title> official trailer"');
  process.exit(1);
}
const page = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&hl=en&gl=US`, {
  headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36", "Accept-Language": "en-US,en;q=0.9" },
}).then((r) => r.text());
const data = page.match(/var ytInitialData = (\{.*?\});<\/script>/s);
if (!data) {
  console.log("YouTube didn't return results. Try again in a moment.");
  process.exit(1);
}
const videos = [];
const walk = (node) => {
  if (!node || typeof node !== "object") return;
  if (node.videoRenderer) videos.push(node.videoRenderer);
  for (const key in node) walk(node[key]);
};
walk(JSON.parse(data[1]));

for (const v of videos.slice(0, 10)) {
  const verified = (v.ownerBadges ?? []).some((b) => /Verified|Official Artist/.test(b.metadataBadgeRenderer?.tooltip ?? ""));
  const embed = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${v.videoId}&format=json`).then((r) => r.status);
  console.log(
    [
      v.videoId,
      `${verified ? "✓" : " "} ${v.ownerText?.runs?.[0]?.text ?? "?"}`,
      v.title?.runs?.map((r) => r.text).join("") ?? "",
      v.lengthText?.simpleText ?? "",
      v.publishedTimeText?.simpleText ?? "",
      v.viewCountText?.simpleText ?? "",
      embed === 200 ? "plays on other sites" : "won't play on other sites",
    ].join(" | "),
  );
}
