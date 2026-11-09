// The Templates film (Ika, 2026-11-08): find the call sheet by searching, preview it, use it,
// fill it in with its live PDF preview, save it to the demo project "Behind the Lens" and see the
// downloads. Run once: it saves a call sheet to the project.
// Run from video/ with the web app on localhost: node scripts/capture/films/templates.mjs
import { start, wait } from "../lib.mjs";

const c = await start("templates");
const { page, go, shot, mark, byText } = c;

// 1. Templates, and a search.
await go("/templates", 3000);
await shot("gallery");
const search = await mark("search", await page.$("#tpl-search"));
await search.click();
await page.keyboard.type("call sheet", { delay: 40 });
await shot("search", 1500);
await page.keyboard.press("Escape");
await page.evaluate(() => {
  const s = document.querySelector("#tpl-search");
  if (s) s.value = "";
});
await go("/templates", 2500);

// 2. The call sheet's preview, then Use this template.
let card;
for (const el of await page.$$('button[aria-label="Preview the Call Sheet template"]')) {
  const r = await el.boundingBox();
  if (r && r.width > 0 && r.y > 0 && r.y < 810) card = el;
}
if (!card) {
  card = (await page.$$('button[aria-label="Preview the Call Sheet template"]'))[0];
  await card.evaluate((e) => e.scrollIntoView({ block: "center" }));
  await wait(800);
}
await mark("callSheet", card);
await shot("gallery-card", 300);
await card.click();
await shot("preview", 2500);
const use = await mark("use", await byText("[role=dialog] button", "Use this template"));
await Promise.all([page.waitForNavigation({ waitUntil: "networkidle2", timeout: 120000 }), use.click()]);
await shot("editor", 3500);

// 3. Fill it in: the title, with the PDF preview beside it.
const title = await mark("title", await page.$("#daily-shoot-info-title"));
await title.click();
await page.keyboard.type("Behind the Lens, day 1", { delay: 30 });
await page.keyboard.press("Tab");
await shot("filled", 3000);

// 4. Save to the project.
const save = await mark("save", await byText("button", "Save to project"));
await save.click();
await shot("save-dialog", 1500);
const pick = await mark("pick", await byText("[role=dialog] li button", "Behind the Lens"));
await pick.click();
await shot("saved", 2500);

// 5. The downloads.
const more = await mark("downloads", await page.$('[aria-label="Download PDF more actions"]'));
await more.click();
await shot("downloads", 1200);

await c.finish();
