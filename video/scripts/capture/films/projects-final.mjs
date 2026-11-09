// Re-shoots the end of the Projects film on the existing demo project (no second project): the
// project page and its files without the pilot's feedback card, then a still marked as a final
// asset and the final assets under the description.
// Run from video/ with the web app on localhost: node scripts/capture/films/projects-final.mjs
import { start, wait } from "../lib.mjs";

const c = await start("projects", { keep: true });
const { page, go, shot, mark, byText } = c;

await go("/projects", 2000);
const card = await byText("main a", "Behind the Lens");
await Promise.all([page.waitForNavigation({ waitUntil: "networkidle2", timeout: 120000 }), card.click()]);
await wait(2500);
const close = await page.$('[aria-label="Close"]');
if (close) await close.click();
await shot("project", 1500);

await page.evaluate(() => {
  const h = [...document.querySelectorAll("h2, h3")].find((e) => /files|references/i.test(e.textContent));
  h?.scrollIntoView({ block: "start" });
  window.scrollBy(0, -100);
});
await wait(1500);
const tag = await mark("tag", await page.$('[aria-label^="Tag for 12-studio-team"], [aria-label^="Tag for 11-showroom"]'));
await shot("files", 300);
await tag.click();
await shot("tag-open", 900);
const final = await mark("final", await byText("[role=option]", "Final asset"));
await final.click();
await shot("tagged", 1500);
await page.evaluate(() => window.scrollTo(0, 0));
await shot("project-final", 2000);

await c.finish();
