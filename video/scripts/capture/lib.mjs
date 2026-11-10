// Shared helpers for capturing a demo film (Ika, 2026-11-08): signs in to the local app in
// headless Chrome with a test account (light mode, reduced motion; the page laid out at 1440 × 810 and
// saved at 3840 × 2160, so push-ins stay sharp; PHASE1_QUICK_UPGRADE.md F, 2026-11-09) and saves a
// screenshot per shot plus where the cursor should be, in 1920 × 1080 video pixels. Each film's
// script (films/<id>.mjs) walks the real app; the film (src/Walkthrough.tsx) moves a camera over
// the shots, draws the cursor and speaks each scene's line.
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

/** Page pixels to video pixels (1440 → 1920): cursor targets and the camera use these. */
export const SCALE = 4 / 3;
/** Page pixels to screenshot pixels (1440 → 3840): twice the video size. */
export const PIXELS = SCALE * 2;
const BASE = "http://localhost:3000";
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Keys live in the web app's .env.local, never in code: the test accounts' sign-in.
function env() {
  const file = path.resolve(import.meta.dirname, "../../../.env.local");
  return Object.fromEntries(
    fs.readFileSync(file, "utf8").split("\n").filter((l) => l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim().replace(/^"|"$/g, "")]),
  );
}

// `keep`: add to the film's shots instead of starting over (re-shooting a few).
export async function start(film, { account = 2, theme = "light", keep = false } = {}) {
  // New shots go to a holding folder (with the old ones copied in when keeping), which replaces
  // the film's folder only once every shot is taken: a failed run never leaves a film half-shot.
  const final = path.resolve(import.meta.dirname, "../../screens", film);
  const out = path.resolve(import.meta.dirname, "../../screens", `.${film}-new`);
  fs.rmSync(out, { recursive: true, force: true });
  if (keep && fs.existsSync(final)) fs.cpSync(final, out, { recursive: true });
  fs.mkdirSync(out, { recursive: true });
  const targetsFile = path.join(out, "targets.json");
  const browser = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 810, deviceScaleFactor: PIXELS });
  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "reduce" },
    { name: "prefers-color-scheme", value: theme },
  ]);
  const cdp = await page.createCDPSession();
  await cdp.send("Emulation.setFocusEmulationEnabled", { enabled: true });
  const keys = env();
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle2", timeout: 120000 });
  await page.type('input[type="email"]', keys[account === 2 ? "TEST_USER2_EMAIL" : "TEST_USER_EMAIL"]);
  await page.type('input[type="password"]', keys[account === 2 ? "TEST_USER2_PASSWORD" : "TEST_USER_PASSWORD"]);
  await Promise.all([page.waitForNavigation({ timeout: 120000 }).catch(() => {}), page.keyboard.press("Enter")]);

  const shots = [];
  const targets = keep && fs.existsSync(targetsFile) ? JSON.parse(fs.readFileSync(targetsFile, "utf8")) : {};
  const api = {
    page,
    /** Where this run saves its shots (for a script that saves one itself). */
    dir: out,
    go: async (url, settle = 1500) => {
      // A page that keeps a connection open never goes quiet: after 45s, take it as it is.
      try {
        await page.goto(BASE + url, { waitUntil: "networkidle2", timeout: 45000 });
      } catch (e) {
        if (e.name !== "TimeoutError") throw e;
        console.log(`(${url} still busy after 45s; carrying on)`);
        await wait(3000);
      }
      await wait(settle);
    },
    /** Saves the screen as `name`, with the cursor kept out of it and the dev badge hidden. */
    shot: async (name, settle = 900) => {
      await wait(settle);
      await page.mouse.move(-10, -10);
      await page.evaluate(() => {
        document.querySelectorAll("nextjs-portal").forEach((e) => (e.style.display = "none"));
        // No red spell-check lines under typed names.
        document.querySelectorAll("input, textarea, [contenteditable]").forEach((e) => (e.spellcheck = false));
      });
      await wait(100);
      await page.screenshot({ path: path.join(out, `${name}.png`) });
      shots.push(name);
      console.log("shot", name);
    },
    /** Where an element's middle is, in video pixels, saved as a cursor target. */
    mark: async (name, el) => {
      const r = await el.boundingBox();
      targets[name] = { x: Math.round((r.x + r.width / 2) * SCALE), y: Math.round((r.y + r.height / 2) * SCALE) };
      return el;
    },
    /** The first visible element matching `selector` whose text starts with `text`. */
    byText: async (selector, text) => {
      for (const el of await page.$$(selector)) {
        const ok = await el.evaluate((e, t) => e.textContent.trim().startsWith(t) && e.getBoundingClientRect().width > 0, text);
        if (ok) return el;
      }
      throw new Error(`No ${selector} starting "${text}"`);
    },
    point: (name, x, y) => (targets[name] = { x: Math.round(x * SCALE), y: Math.round(y * SCALE) }),
    finish: async () => {
      fs.writeFileSync(targetsFile, JSON.stringify(targets, null, 1) + "\n");
      const all = fs.readdirSync(out).filter((f) => f.endsWith(".png")).map((f) => f.slice(0, -4)).sort();
      // An index the film imports, so the bundler includes each screenshot.
      const id = (s) => "s_" + s.replace(/[^a-zA-Z0-9]/g, "_");
      const index = [
        `// Written by scripts/capture/films/${film}.mjs: the ${film} film's screenshots and cursor targets.`,
        ...all.map((s) => `import ${id(s)} from "../../screens/${film}/${s}.png";`),
        `import targets from "../../screens/${film}/targets.json";`,
        "",
        `export const SHOTS: Record<string, string> = { ${all.map((s) => `"${s}": ${id(s)}`).join(", ")} };`,
        "export const TARGETS: Record<string, { x: number; y: number }> = targets;",
        "",
      ].join("\n");
      fs.mkdirSync(path.resolve(import.meta.dirname, "../../src/films"), { recursive: true });
      fs.writeFileSync(path.resolve(import.meta.dirname, `../../src/films/${film}-screens.ts`), index);
      await browser.close();
      fs.rmSync(final, { recursive: true, force: true });
      fs.renameSync(out, final);
      console.log(`${shots.length} shots taken; ${all.length} in screens/${film}`);
    },
  };
  return api;
}
