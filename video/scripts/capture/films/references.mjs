// The References and production details film (Ika, 2026-11-08): add Explore titles to the demo
// project "Behind the Lens" as references (Jeen-Yuhs and Benji, Coodie & Chike's films), then the
// project's production details (a made-up client and a deliverable), its References and the
// Inspiration Nia suggests for it. Run once: it saves the references and details.
// Run from video/ with the web app on localhost: node scripts/capture/films/references.mjs
import { start, wait } from "../lib.mjs";

const c = await start("references");
const { page, go, shot, mark, byText } = c;

// 1. From Explore: add two titles to the project.
for (const [i, slug] of ["jeen-yuhs", "benji"].entries()) {
  await go(`/explore/title/${slug}`, 2500);
  const add = await byText("main button", "Add to project");
  if (i === 0) {
    await mark("addToProject", add);
    await shot("title", 300);
  }
  await add.click();
  await wait(1200);
  // The popover's row for the project (the whole row is the button, "Add" at its end).
  const confirm = await page.evaluateHandle(() => [...document.querySelectorAll("li > button")].find((b) => b.textContent.trim().startsWith("Behind the Lens") && b.getBoundingClientRect().width > 0) ?? null);
  if (!confirm.asElement()) throw new Error("No Behind the Lens row in the popover");
  if (i === 0) {
    await mark("add", confirm);
    await shot("add-popover", 200);
  }
  await confirm.click();
  if (i === 0) await shot("added", 1500);
  else await wait(1500);
}

// 2. The project's production details.
await go("/projects", 2000);
await Promise.all([page.waitForNavigation({ waitUntil: "networkidle2", timeout: 120000 }), (await byText("main a", "Behind the Lens")).click()]);
await wait(2500);
const close = await page.$('[aria-label="Close"]');
if (close) await close.click();
await shot("details", 1000);

// A client: the value beside "Client".
const client = await page.evaluateHandle(() => {
  const label = [...document.querySelectorAll("main dt, main span, main p, main div")].find((e) => e.childElementCount === 0 && e.textContent.trim() === "Client");
  const row = label?.closest("div");
  return row?.querySelector("input, textarea, button, [contenteditable]") ?? row?.nextElementSibling?.querySelector?.("input, textarea, button, [contenteditable]") ?? null;
});
if (client.asElement()) {
  await mark("client", client.asElement());
  await client.asElement().click();
  await wait(300);
  await page.keyboard.press("End");
  for (let k = 0; k < 40; k++) await page.keyboard.press("Backspace");
  await page.keyboard.type("Studio Nine", { delay: 30 });
  await page.keyboard.press("Enter");
  await wait(1200);
}
// A deliverable.
const addDeliverable = await mark("deliverable", await byText("main button", "Add a deliverable"));
const had = await page.$('[aria-label="Deliverable 1: what"]');
if (!had) {
  await addDeliverable.click();
  await wait(600);
}
const what = had ? null : await page.$('[aria-label="Deliverable 1: what"]');
if (what) {
  await what.click();
  await page.keyboard.type("Short documentary, 12 minutes", { delay: 20 });
  await page.keyboard.press("Tab");
}
await shot("details-filled", 2000);

// 3. References and Inspiration.
await page.evaluate(() => {
  document.querySelector("#references")?.scrollIntoView({ block: "start" });
  window.scrollBy(0, -90);
});
await shot("references", 2500);
await page.evaluate(() => {
  const h = [...document.querySelectorAll("h2, h3")].find((e) => /Inspiration for this project/.test(e.textContent));
  h?.scrollIntoView({ block: "start" });
  window.scrollBy(0, -90);
});
await shot("inspiration", 2500);

await c.finish();
