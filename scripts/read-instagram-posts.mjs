// Reads Instagram posts for Explore's creator films (Ika, 2026-11-14: links from the Notion
// "Nia Explore inbox" or pasted in chat). For each reel or post code it opens Instagram's public
// embed page in headless Chrome, like a visitor, and writes what the write-up needs:
//   the caption (credits come from it), the account, the posting day (worked out from the code),
//   and the cover, saved full size to public/explore/creators/<code>.jpg (at most 1920px), with
//   its width and height (the film's shape; check it by eye for black bars).
// Prints a summary and writes scripts/out/instagram-posts.json. Then write each film into
// src/features/explore/creators.ts and its tags into tag-data.ts, and run
// measure-explore-covers.mjs, check-instagram-embeds.mjs and build-explore-timeline-data.mjs.
//
//   npm i --no-save puppeteer-core && node scripts/read-instagram-posts.mjs <code|link> ...
// Chrome: CHROME_PATH, else the Mac app; elsewhere `npm i --no-save puppeteer` brings its own.
import fs from "node:fs";
import sharp from "sharp";

const codes = process.argv.slice(2).map((a) => a.match(/(?:reel|p|tv)\/([\w-]+)/)?.[1] ?? a);
if (!codes.length) throw new Error("Give one or more Instagram links or codes.");

const MAC = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const executablePath = process.env.CHROME_PATH || (fs.existsSync(MAC) ? MAC : undefined);
const { default: puppeteer } = executablePath ? await import("puppeteer-core") : await import("puppeteer");
const browser = await puppeteer.launch({ executablePath, headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 540, height: 1200 });

// A post's code is its id in base 64; the id's top bits are milliseconds since Instagram's epoch.
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
const postedOn = (code) => {
  let id = 0n;
  for (const ch of code.slice(0, 11)) id = id * 64n + BigInt(ALPHABET.indexOf(ch));
  return new Date(Number(id >> 23n) + 1314220021721).toISOString().slice(0, 10);
};

const out = {};
for (const code of codes) {
  await page.goto(`https://www.instagram.com/reel/${code}/embed/captioned/`, { waitUntil: "networkidle2", timeout: 60000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 1500));
  const seen = await page.evaluate(() => ({
    text: document.body.innerText,
    cover: [...document.querySelectorAll("img")].find((i) => i.naturalWidth > 200)?.src ?? null,
  }));
  const lines = seen.text.split("\n").map((l) => l.trim()).filter(Boolean);
  const account = lines[0] ?? null;
  // The caption runs from the account's name after the like count to "View all … comments".
  const likes = lines.findIndex((l) => /^[\d,.]+[KM]? likes?$/.test(l));
  const from = likes >= 0 ? likes + 2 : lines.indexOf(account, 1) + 1;
  const to = lines.findIndex((l, i) => i > from && /^(View all [\d,]+ comments|Add a comment)/.test(l));
  const caption = lines.slice(from, to > 0 ? to : undefined).join("\n");
  const audio = lines.find((l, i) => i < 4 && l.includes(" · ")) ?? null;
  let size = null;
  if (seen.cover) {
    const buf = Buffer.from(await (await fetch(seen.cover)).arrayBuffer());
    const info = await sharp(buf).resize(1920, 1920, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toFile(`public/explore/creators/${code}.jpg`);
    size = { width: info.width, height: info.height };
  }
  const broken = /may be broken|been removed|isn't available/i.test(seen.text);
  out[code] = { account, date: postedOn(code), audio, caption, cover: size, broken };
  console.log(`\n=== ${code}  @${account}  posted ${out[code].date}  cover ${size ? `${size.width}x${size.height}` : "none"}${broken ? "  NOT AVAILABLE" : ""}`);
  if (audio) console.log(`audio: ${audio}`);
  console.log(caption);
}
await browser.close();
fs.mkdirSync("scripts/out", { recursive: true });
fs.writeFileSync("scripts/out/instagram-posts.json", JSON.stringify(out, null, 1));
