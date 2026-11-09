// The Projects film (Ika, 2026-11-08): start a project with a cover, its type and the first
// stills, then the project page, its files, and a still marked as a final asset. Makes the demo
// project "Behind the Lens" in test account 2, which the other films use (cover and stills are
// Ika's studio images from the sign-in slideshow).
// Run from video/ with the web app on localhost: node scripts/capture/films/projects.mjs
import path from "node:path";
import { start, wait } from "../lib.mjs";

const HERO = path.resolve(import.meta.dirname, "../../../../src/assets/hero");
const c = await start("projects");
const { page, go, shot, mark, byText } = c;

// 1. Projects, New project, Blank project.
await go("/projects", 2500);
await shot("projects");
const newBtn = await mark("newProject", await byText("main button, main a", "New project"));
await newBtn.click();
await shot("dialog", 1200);
const blank = await mark("blank", await byText("[role=dialog] a, [role=dialog] button", "Blank project"));
await Promise.all([page.waitForNavigation({ waitUntil: "networkidle2", timeout: 120000 }), blank.click()]);
await shot("form", 1500);

// 2. Name, description, cover.
await mark("name", await page.$("#project-name"));
await page.click("#project-name");
await page.keyboard.type("Behind the Lens", { delay: 30 });
await mark("description", await page.$("#project-description"));
await page.click("#project-description");
await page.keyboard.type("A short documentary following a creative studio through one shoot week: the fittings, the showroom and the team behind the pictures.", { delay: 5 });
await shot("form-typed", 800);
const [coverInput, filesInput] = await page.$$('form input[type="file"]');
await mark("cover", await byText("form button", "Add cover"));
await coverInput.uploadFile(path.join(HERO, "12-studio-team.jpg"));
await page.waitForSelector("[role=dialog]");
await shot("cropper", 2000);
const apply = await mark("apply", await byText("[role=dialog] button", "Apply"));
await apply.click();
await page.waitForFunction(() => !document.querySelector("[role=dialog]"));
await shot("form-cover", 1500);

// 3. Type and genre.
const type = await mark("type", await page.$("#project-type"));
await type.evaluate((e) => e.scrollIntoView({ block: "center" }));
await wait(500);
await mark("type", type);
await type.click();
await shot("type-open", 900);
const doc = await mark("documentary", await byText("[role=option]", "Documentary"));
await doc.click();
await wait(400);
const genre = await page.$("#project-genre");
await genre.click();
await wait(600);
await (await byText("[role=option]", "Documentary")).click();
await wait(400);

// 4. The first stills, then Create project.
await filesInput.uploadFile(path.join(HERO, "10-studio-fitting.jpg"), path.join(HERO, "11-showroom.jpg"));
await wait(1200);
await (await page.$("#project-files-label")).evaluate((e) => e.scrollIntoView({ block: "center" }));
await shot("form-files", 1200);
const create = await byText("form button[type=submit]", "Create project");
await create.evaluate((e) => e.scrollIntoView({ block: "center" }));
await wait(500);
await mark("create", create);
await shot("form-ready", 600);
await Promise.all([page.waitForNavigation({ waitUntil: "networkidle2", timeout: 120000 }), create.click()]);
await wait(6000);
await shot("project", 2500);
console.log("project", page.url());

// 5. Files & references, and a still marked as a final asset.
await page.evaluate(() => {
  const h = [...document.querySelectorAll("h2, h3")].find((e) => /files|references/i.test(e.textContent));
  h?.scrollIntoView({ block: "start" });
  window.scrollBy(0, -100);
});
await shot("files", 2500);

await c.finish();
