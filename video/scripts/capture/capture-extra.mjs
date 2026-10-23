// Re-captures screens for the projects and templates film (2026-10-22): signs in with a test
// account on localhost and saves screenshots plus click positions. Needs puppeteer-core
// (npm i -D puppeteer-core in video/) and Chrome. Run: node capture-extra.mjs <out dir> ../../.env.local <file or folder>
// Goes through the real create-project and templates flow on localhost with the test account,
// saving a screenshot per step and where the cursor should go (in 1920×1080 video pixels).
import puppeteer from "puppeteer-core";
import fs from "node:fs";
const [out, envFile, coverFile] = process.argv.slice(2);
const env = Object.fromEntries(fs.readFileSync(envFile, "utf8").split("\n").filter((l) => l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).replace(/^"|"$/g, "")]));
const SCALE = 4 / 3;
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 810, deviceScaleFactor: SCALE });
const cdp = await p.createCDPSession();
await cdp.send("Emulation.setFocusEmulationEnabled", { enabled: true });
await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
const base = "http://localhost:3000";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const steps = [];
const targets = {};
let n = 0;
const shot = async (name, settle = 900) => {
  await wait(settle);
  await p.mouse.move(-10, -10);
  // Next.js's dev badge isn't part of the app.
  await p.evaluate(() => document.querySelectorAll("nextjs-portal").forEach((e) => (e.style.display = "none")));
  const file = `${String(++n).padStart(2, "0")}-${name}.png`;
  await p.screenshot({ path: `${out}/${file}` });
  steps.push({ name, file, url: p.url() });
  console.log("shot", file);
};
const box = async (el) => {
  const r = await el.boundingBox();
  return { x: Math.round((r.x + r.width / 2) * SCALE), y: Math.round((r.y + r.height / 2) * SCALE), w: Math.round(r.width * SCALE), h: Math.round(r.height * SCALE) };
};
const byText = async (selector, text) => {
  const els = await p.$$(selector);
  for (const el of els) {
    const ok = await el.evaluate((e, t) => e.textContent.trim().startsWith(t) && e.getBoundingClientRect().width > 0, text);
    if (ok) return el;
  }
  throw new Error(`No ${selector} with "${text}"`);
};
const mark = async (name, el) => (targets[name] = await box(el));

await p.goto(base + "/login", { waitUntil: "networkidle2", timeout: 90000 });
await p.type("#email", env.TEST_USER2_EMAIL);
await p.type("#password", env.TEST_USER2_PASSWORD);
await Promise.all([p.waitForNavigation({ waitUntil: "networkidle2", timeout: 90000 }), p.keyboard.press("Enter")]);

await p.goto(base + "/projects/new", { waitUntil: "networkidle2", timeout: 90000 });
await p.click("#project-name");
await p.keyboard.type("Studio lookbook");
await (await p.$("form input[type=file]")).uploadFile(coverFile);
await p.waitForSelector("[role=dialog]");
await wait(1500);
await (await byText("[role=dialog] button", "Apply")).click();
await p.waitForFunction(() => !document.querySelector("[role=dialog]"));
await p.click("#project-type");
await wait(500);
await (await byText("[role=option]", "Photo Shoot")).click();
await wait(500);
// Scroll so the Create project button sits near the bottom of the screen.
const create = await byText("form button[type=submit]", "Create project");
await create.evaluate((e) => e.scrollIntoView({ block: "end" }));
await p.evaluate(() => window.scrollBy(0, 60));
await wait(600);
const scrollY = await p.evaluate(() => window.scrollY);
await mark("create", create);
await shot("form-bottom");
fs.writeFileSync(`${out}/extra.json`, JSON.stringify({ steps, targets, scrollY: Math.round(scrollY * SCALE) }, null, 2));
await b.close();
