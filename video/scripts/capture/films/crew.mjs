// The Cast & crew film (Ika, 2026-11-08): on the demo project "Behind the Lens", open Cast & crew,
// add people (made-up names, example.com addresses), confirm one in a tap, open a profile, and
// see the whole team as a grid. Run once: it adds the people to the project.
// Run from video/ with the web app on localhost: node scripts/capture/films/crew.mjs
import { start, wait } from "../lib.mjs";

const PEOPLE = [
  { name: "Amara Okafor", kind: "Crew", role: "Director", email: "amara@example.com" },
  { name: "Lebo Mokoena", kind: "Crew", role: "Director of Photography", email: "lebo@example.com" },
  { name: "Jonah Reyes", kind: "Crew", role: "Editor", email: "jonah@example.com" },
  { name: "Zanele Dube", kind: "Cast", role: "Lead", character: "Herself", email: "zanele@example.com" },
];

const c = await start("crew");
const { page, go, shot, mark, byText } = c;

// 1. The project page, then Cast & crew.
await go("/projects", 2000);
await Promise.all([page.waitForNavigation({ waitUntil: "networkidle2", timeout: 120000 }), (await byText("main a", "Behind the Lens")).click()]);
await wait(2500);
const close = await page.$('[aria-label="Close"]');
if (close) await close.click();
const manage = await byText("main a", "Manage cast & crew");
await manage.evaluate((e) => e.scrollIntoView({ block: "center" }));
await wait(800);
await mark("manage", manage);
await shot("project-crew-row", 300);
await Promise.all([page.waitForNavigation({ waitUntil: "networkidle2", timeout: 120000 }), manage.click()]);
await shot("empty", 2000);

// 2. Add people: the first one shown step by step, the rest quickly.
for (const [i, p] of PEOPLE.entries()) {
  const add = await byText("main button", i === 0 ? "Add first person" : "Add person").catch(() => byText("main button", "Add person"));
  if (i === 0) await mark("add", add);
  await add.click();
  await page.waitForSelector('[role="dialog"] form');
  await wait(600);
  const nameInput = await page.$('[role="dialog"] input[id$="-name"]');
  if (i === 0) await mark("name", nameInput);
  await nameInput.type(p.name, { delay: i === 0 ? 30 : 0 });
  await (await byText('[role="dialog"] [aria-label="Cast or crew"] button', p.kind)).click();
  await wait(300);
  const role = await page.$('[role="dialog"] input[id$="-role"]');
  await role.type(p.role, { delay: i === 0 ? 30 : 0 });
  if (p.character) await (await page.$('[role="dialog"] input[id$="-character"]')).type(p.character);
  await (await page.$('[role="dialog"] input[id$="-email"]')).type(p.email);
  await wait(400);
  if (i === 1) {
    await page.evaluate(() => document.querySelector('[role="dialog"] input[id$="-name"]')?.scrollIntoView({ block: "start" }));
    await shot("add-form", 600);
    await mark("save", await page.$('[role="dialog"] button[type="submit"]'));
  }
  await (await page.$('[role="dialog"] button[type="submit"]')).click();
  await page.waitForFunction(() => !document.querySelector('[role="dialog"]'), { timeout: 20000 });
  await wait(1500);
}
await page.evaluate(() => window.scrollTo(0, 0));
await shot("list", 1500);

// 3. Confirm the director in one tap.
const status = await mark("status", await page.$('[aria-label^="Amara Okafor:"]'));
await status.click();
await shot("status-open", 900);
const confirmed = await mark("confirmed", await byText('[role="menuitem"], [role="option"], [role="menuitemradio"]', "Confirmed"));
await confirmed.click();
await shot("confirmed", 1500);

// 4. A profile, then the grid.
const row = await byText("main button, main a, main [role=button]", "Lebo Mokoena");
await mark("person", row);
await row.click();
await shot("profile", 1500);
await page.keyboard.press("Escape");
await wait(600);
const grid = await mark("grid", await page.$('[aria-label="Grid"]'));
await grid.click();
await shot("grid", 1500);

await c.finish();
