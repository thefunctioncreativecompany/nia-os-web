// Checks that Instagram's player shows each creator film on other sites (Ika, 2026-10-31: a
// No Scene Girls post showed "The link to this photo or video may be broken"). Opens every
// film's reel player, then the post player, in headless Chrome like a normal visitor, and lists
// the ones that fail both: mark those `embeds: false` in src/features/explore/creators.ts so
// their page links to Instagram instead.
//
//   npm i --no-save puppeteer-core && node scripts/check-instagram-embeds.mjs [code ...]
import fs from "node:fs";

const { default: puppeteer } = await import("puppeteer-core").catch(() => {
  console.error("Needs puppeteer-core: npm i --no-save puppeteer-core");
  process.exit(1);
});

const source = fs.readFileSync("src/features/explore/creators.ts", "utf8");
// YouTube films (`platform: "youtube"` right after the code) play in YouTube's player: skipped.
const all = [...source.matchAll(/^ {4}code: "([\w-]+)",\n(\s+platform: "youtube",)?(\s+embeds: false,)?/gm)]
  .filter((m) => !m[2])
  .map((m) => ({ code: m[1], marked: Boolean(m[3]) }));
const wanted = process.argv.slice(2);
const films = wanted.length ? all.filter((f) => wanted.includes(f.code)) : all;

const browser = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const page = await browser.newPage();

async function plays(url) {
  await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 1200));
  return page.evaluate(() => !/may be broken|been removed/i.test(document.body.innerText));
}

const broken = [];
for (const f of films) {
  const ok = (await plays(`https://www.instagram.com/reel/${f.code}/embed/`)) || (await plays(`https://www.instagram.com/p/${f.code}/embed/`));
  if (!ok) broken.push(f);
  if (!ok !== f.marked) console.log(`${f.code}: ${ok ? "plays again, remove embeds: false" : "doesn't play, add embeds: false"}`);
}
console.log(`${films.length - broken.length} of ${films.length} play; not playable: ${broken.map((f) => f.code).join(", ") || "none"}`);
await browser.close();
