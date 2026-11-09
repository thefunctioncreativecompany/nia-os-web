// The Share and collaborate film (Ika, 2026-11-08): on the demo project "Behind the Lens", open
// Share, type an invitation (a made-up example.com address; Invite is never pressed, so no email
// is sent), choose Can edit, turn on the view-only link, open that link as a client would (signed
// out), and the project's activity. The link is turned off again at the end.
// Run from video/ with the web app on localhost: node scripts/capture/films/share.mjs
import puppeteer from "puppeteer-core";
import { SCALE, start, wait } from "../lib.mjs";

const c = await start("share");
const { page, go, shot, mark, byText } = c;

await go("/projects", 2000);
await Promise.all([page.waitForNavigation({ waitUntil: "networkidle2", timeout: 120000 }), (await byText("main a", "Behind the Lens")).click()]);
await wait(2500);
const close = await page.$('[aria-label="Close"]');
if (close) await close.click();

// 1. Manage: the project's actions and its activity.
const manage = await mark("manage", await byText("main button, main [role=tab]", "Manage"));
await manage.click();
await shot("manage", 1800);

// 2. Share: an invitation by email, as Can edit.
const share = await mark("share", await byText("main button", "Share project"));
await share.click();
await shot("dialog", 1500);
const email = await mark("email", await page.$("#share-email"));
await email.click();
await page.keyboard.type("amara@example.com", { delay: 30 });
const access = await mark("access", await page.$('[aria-label="Access for this person"]'));
await access.click();
await shot("access-open", 900);
const edit = await mark("canEdit", await byText('[role="option"]', "Can edit"));
await edit.click();
await shot("invite-ready", 900);

// 3. The view-only link.
const link = await mark("link", await page.$('[aria-label="Anyone with the link can view"]'));
await link.click();
await shot("link-on", 2000);
const url = await page.evaluate(() => {
  const el = [...document.querySelectorAll('[role="dialog"] input, [role="dialog"] code, [role="dialog"] span, [role="dialog"] p')].find((e) => /\/share\//.test(e.value ?? e.textContent));
  return el ? (el.value ?? el.textContent).match(/https?:\/\/\S+\/share\/\S+|\/share\/\S+/)?.[0] : null;
});
console.log("share link", url ? "found" : "missing");

// 4. The link as a client sees it: signed out, in a separate browser.
if (url) {
  const other = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
  const guest = await other.newPage();
  await guest.setViewport({ width: 1440, height: 810, deviceScaleFactor: SCALE });
  await guest.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }, { name: "prefers-reduced-motion", value: "reduce" }]);
  const href = url.startsWith("http") ? url.replace(/^https?:\/\/[^/]+/, "http://localhost:3000") : `http://localhost:3000${url}`;
  await guest.goto(href, { waitUntil: "networkidle2", timeout: 120000 });
  await wait(2500);
  await guest.evaluate(() => document.querySelectorAll("nextjs-portal").forEach((e) => (e.style.display = "none")));
  await guest.screenshot({ path: new URL("../../../screens/share/shared-page.png", import.meta.url).pathname });
  console.log("shot shared-page");
  await other.close();
}

// Tidy up: the link off again.
await link.click();
await wait(1500);
await c.finish();
