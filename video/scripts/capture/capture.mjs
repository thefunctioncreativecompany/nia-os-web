// Re-captures screens for the projects and templates film (2026-10-22): signs in with a test
// account on localhost and saves screenshots plus click positions. Needs puppeteer-core
// (npm i -D puppeteer-core in video/) and Chrome. Run: node capture.mjs <out dir> ../../.env.local <file or folder>
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

// 1. Projects
await p.goto(base + "/projects", { waitUntil: "networkidle2", timeout: 90000 });
await shot("projects", 1500);
const newBtn = await byText("main button, main a", "New project");
await mark("newProject", newBtn);
await newBtn.click();
await shot("dialog");
const blank = await byText("[role=dialog] a", "Blank project");
await mark("blank", blank);
await Promise.all([p.waitForNavigation({ waitUntil: "networkidle2" }), blank.click()]);
await shot("form", 1200);

// 2. The form
await mark("name", await p.$("#project-name"));
const name = "Studio lookbook";
await p.click("#project-name");
for (let i = 0; i < name.length; i++) {
  await p.keyboard.type(name[i]);
  await shot(`name-${i + 1}`, 60);
}
const coverBtn = await byText("form button", "Add cover image");
await mark("cover", coverBtn);
const input = await p.$('form input[type=file]');
await input.uploadFile(coverFile);
await p.waitForSelector("[role=dialog]");
await shot("cropper", 1500);
const apply = await byText("[role=dialog] button", "Apply");
await mark("apply", apply);
await apply.click();
await p.waitForFunction(() => !document.querySelector("[role=dialog]"));
await shot("form-cover", 1200);
const typeBtn = await p.$("#project-type");
await mark("type", typeBtn);
await typeBtn.click();
await shot("type-open");
const option = await byText("[role=option]", "Photo Shoot");
await mark("photoShoot", option);
await option.click();
await shot("form-filled");
const create = await byText("form button[type=submit]", "Create project");
await mark("create", create);
await Promise.all([p.waitForNavigation({ waitUntil: "networkidle2", timeout: 90000 }), create.click()]);
await shot("project", 2500);

// 3. Templates
const tab = await byText("nav[aria-label=Main] a", "Templates");
await mark("templatesTab", tab);
await Promise.all([p.waitForNavigation({ waitUntil: "networkidle2", timeout: 90000 }), tab.click()]);
await shot("templates", 2500);
let card;
for (const c of await p.$$('button[aria-label="Preview the Call Sheet template"]')) {
  const r = await c.boundingBox();
  if (r && r.width > 0 && r.y > 0 && r.y < 810) card = c;
}
await mark("callSheet", card);
await card.click();
await shot("preview", 2500);
const use = await byText("[role=dialog] button", "Use this template");
await mark("use", use);
await Promise.all([p.waitForNavigation({ waitUntil: "networkidle2", timeout: 90000 }), use.click()]);
await shot("editor", 3000);

// 4. The call sheet: a title, then into the project
await mark("title", await p.$("#daily-shoot-info-title"));
await p.click("#daily-shoot-info-title");
const docTitle = "Studio lookbook, day 1";
for (let i = 0; i < docTitle.length; i++) {
  await p.keyboard.type(docTitle[i]);
  await shot(`title-${i + 1}`, 60);
}
await p.keyboard.press("Tab");
await shot("title-preview", 2500);
const save = await byText("button", "Save to project");
await mark("save", save);
await save.click();
await shot("save-dialog", 1200);
const pick = await byText("[role=dialog] li button", "Studio lookbook");
await mark("pick", pick);
await pick.click();
await shot("saved", 2500);
fs.writeFileSync(`${out}/capture.json`, JSON.stringify({ steps, targets }, null, 2));
await b.close();
