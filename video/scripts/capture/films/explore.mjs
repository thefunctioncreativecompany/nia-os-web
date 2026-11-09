// The Explore film (Ika, 2026-11-08, for Coodie): Explore, the Explore all canvas, the timeline,
// searching "documentary" and then Coodie & Chike's films, a title page with its press kit, the
// timeline around Jeen-Yuhs, and adding a title to a project.
// Run from video/ with the web app on localhost: node scripts/capture/films/explore.mjs
import { start, wait } from "../lib.mjs";

const c = await start("explore");
const { page, go, shot, mark, byText, point } = c;

// 1. Explore.
await go("/explore", 2500);
await shot("explore");
await page.evaluate(() => window.scrollTo(0, 900));
await shot("explore-scrolled", 1500);
await page.evaluate(() => window.scrollTo(0, 0));
await wait(500);
await mark("exploreAll", await byText("main a", "Explore all"));

// 2. Explore all: the canvas, then dragged across.
await go("/explore/all", 3000);
await shot("canvas");
point("dragFrom", 900, 450);
point("dragTo", 520, 300);
await page.mouse.move(900, 450);
await page.mouse.down();
for (let i = 1; i <= 20; i++) await page.mouse.move(900 - 19 * i, 450 - 7.5 * i);
await page.mouse.up();
await shot("canvas-dragged", 1800);
await mark("timelineTab", await byText("a, button", "Timeline"));

// 3. The timeline: the year around today, then the century.
await go("/explore/all/timeline", 3500);
await shot("timeline");
const century = await mark("century", await byText('[aria-label="Zoom level"] button', "Century"));
await century.click();
await shot("timeline-century", 2500);

// 4. Search: "documentary", then Coodie & Chike's films.
await go("/explore", 2000);
point("search", 720, 32);
await page.keyboard.down("Meta");
await page.keyboard.press("k");
await page.keyboard.up("Meta");
await wait(2500);
await page.keyboard.type("documentary", { delay: 30 });
await shot("search-documentary", 2500);
await page.keyboard.press("Home");
await page.keyboard.type("Coodie ", { delay: 30 });
await shot("search-coodie", 2500);
await mark("jeenYuhs", await byText('[role="dialog"] [role="option"], [role="dialog"] a, [role="dialog"] li', "Jeen-Yuhs"));
await page.keyboard.press("Escape");

// 5. Jeen-Yuhs: the page, its cast and crew, its press kit.
await go("/explore/title/jeen-yuhs", 3000);
await shot("title");
await page.evaluate(() => {
  const h = [...document.querySelectorAll("h2, h3")].find((e) => /cast/i.test(e.textContent));
  h?.scrollIntoView({ block: "start" });
  window.scrollBy(0, -90);
});
await shot("title-cast", 1500);
await page.evaluate(() => {
  const h = [...document.querySelectorAll("h2, h3")].find((e) => /press/i.test(e.textContent));
  h?.scrollIntoView({ block: "start" });
  window.scrollBy(0, -90);
});
await shot("title-press", 1800);

// 6. The timeline around Jeen-Yuhs.
await go("/explore/all/timeline?from=2003-01-01&to=2025-01-01&focus=t:jeen-yuhs", 3500);
await shot("timeline-coodie");

// 7. Add to project.
await go("/explore/title/jeen-yuhs", 2500);
const add = await mark("addToProject", await byText("main button", "Add to project"));
await add.click();
await shot("add-to-project", 1500);

await c.finish();
