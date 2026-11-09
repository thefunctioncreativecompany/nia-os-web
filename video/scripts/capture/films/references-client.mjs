// Puts the demo project's client back to "Studio Nine" and re-shoots the filled details.
// Run from video/ with the web app on localhost: node scripts/capture/films/references-client.mjs
import { start, wait } from "../lib.mjs";

const c = await start("references", { keep: true });
const { page, go, shot, byText } = c;
await go("/projects", 2000);
await Promise.all([page.waitForNavigation({ waitUntil: "networkidle2", timeout: 120000 }), (await byText("main a", "Behind the Lens")).click()]);
await wait(2500);
const close = await page.$('[aria-label="Close"]');
if (close) await close.click();
const client = await page.evaluateHandle(() => {
  const label = [...document.querySelectorAll("main dt, main span, main p, main div")].find((e) => e.childElementCount === 0 && e.textContent.trim() === "Client");
  const row = label?.closest("div");
  return row?.querySelector("input, textarea, button, [contenteditable]") ?? row?.nextElementSibling?.querySelector?.("input, textarea, button, [contenteditable]") ?? null;
});
await client.asElement().click();
await wait(400);
await page.keyboard.press("End");
for (let i = 0; i < 40; i++) await page.keyboard.press("Backspace");
await page.keyboard.type("Studio Nine", { delay: 30 });
await page.keyboard.press("Enter");
await wait(1500);
const text = await page.evaluate(() => document.querySelector("main")?.innerText.match(/Studio Nine[^\n]*/)?.[0]);
console.log("client now:", text);
await shot("details-filled", 1500);
await c.finish();
