// Re-shoots the start of the Templates film without saving another call sheet: search "call
// sheet", pick Call Sheet from the suggestions, its preview.
// Run from video/ with the web app on localhost: node scripts/capture/films/templates-search.mjs
import { start } from "../lib.mjs";

const c = await start("templates", { keep: true });
const { page, go, shot, mark, byText } = c;
await go("/templates", 3000);
const search = await mark("search", await page.$("#tpl-search"));
await search.click();
await page.keyboard.type("call sheet", { delay: 40 });
await shot("search", 1500);
let pick = null;
for (const el of await page.$$('[role="option"], [role="listbox"] button, [role="listbox"] a')) {
  const t = await el.evaluate((e) => e.textContent.trim());
  if (t.startsWith("Call Sheet") && !/Detailed/.test(t)) {
    pick = el;
    break;
  }
}
if (!pick) throw new Error("No Call Sheet suggestion");
await mark("callSheet", pick);
await pick.click();
await shot("preview", 2500);
await mark("use", await byText("[role=dialog] button", "Use this template"));
await c.finish();
