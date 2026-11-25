// Nia's service worker. Two jobs: documents you open stay readable offline (FEEDBACK D5), and
// notices arrive when Nia is closed (FEEDBACK D6 step 2, at the end of this file).
//
// Offline (Ika 2026-11-25):
// - Each document page you open is saved on this computer (the page asks: "save"), with the
//   files it needs to draw. The newest 20 are kept.
// - Pages always come from the internet first. Only when that fails does a saved document open
//   (marked as an offline copy, so the editor shows it read-only); any other page shows /offline,
//   the list of saved documents.
// - Nothing else is stored: no other pages, no data, no pictures. Log out deletes it all ("clear").

const DOCS = "nia-docs-v1";
const SHELL = "nia-shell-v1";
const FILES = "nia-files-v1";
const KEEP = 20;
const OFFLINE = "/offline";
const DAY = 24 * 60 * 60 * 1000;

self.addEventListener("install", (event) => {
  event.waitUntil(saveShell().catch(() => undefined).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([DOCS, SHELL, FILES]);
      for (const name of await caches.keys()) if (name.startsWith("nia-") && !keep.has(name)) await caches.delete(name);
      if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  const msg = event.data || {};
  if (msg.type === "save" && typeof msg.url === "string") event.waitUntil(saveDocument(msg.url, msg.title, msg.project).catch(() => undefined));
  if (msg.type === "clear") event.waitUntil(clearAll());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          return (await event.preloadResponse) || (await fetch(req));
        } catch {
          return (await offlineDocument(url)) || (await caches.match(OFFLINE, { cacheName: SHELL })) || Response.error();
        }
      })(),
    );
    return;
  }

  // The build's own files (scripts, styles, fonts) never change once published: a saved copy
  // is as good as the internet's. Only ones a saved page needs are ever stored.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(caches.match(req, { cacheName: FILES }).then((hit) => hit || fetch(req)));
  }
});

/** One address per document: /templates/<code>?doc=<id>, whatever else the address carried. */
function docKey(url) {
  const u = new URL(url, self.location.origin);
  const id = u.searchParams.get("doc");
  if (!/^\/templates\/[^/]+$/.test(u.pathname) || !id || !/^[0-9a-f-]{36}$/.test(id)) return null;
  return `${self.location.origin}${u.pathname}?doc=${id}`;
}

async function offlineDocument(url) {
  const key = docKey(url);
  if (!key) return null;
  const saved = await caches.match(key, { cacheName: DOCS });
  if (!saved) return null;
  // Marks the page as the offline copy, with when it was saved (offline-copies.ts reads it).
  const html = (await saved.text()).replace(/<head[^>]*>/, (head) => `${head}<meta name="nia-offline-copy" content="${saved.headers.get("x-nia-saved") || ""}">`);
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}

/** The files a page needs to draw: scripts, styles and fonts named in it (and in its styles). */
async function filesOf(html) {
  const found = new Set(html.match(/\/_next\/static\/[^"'\s()\\<>]+/g) || []);
  for (const css of [...found].filter((f) => f.endsWith(".css"))) {
    try {
      const text = await (await fetchFile(css)).clone().text();
      for (const f of text.match(/\/_next\/static\/media\/[^"'\s()\\]+/g) || []) found.add(f);
    } catch {}
  }
  return [...found];
}

async function fetchFile(path) {
  const files = await caches.open(FILES);
  const hit = await files.match(path);
  if (hit) return hit;
  const res = await fetch(path);
  if (res.ok) await files.put(path, res.clone());
  return res;
}

/** Fetches a page as it is now and keeps it, with its files. Signed out or an error: nothing. */
async function savePage(cacheName, key, url, extra = {}) {
  const res = await fetch(url, { credentials: "same-origin" });
  if (!res.ok || res.redirected || !(res.headers.get("content-type") || "").includes("text/html")) return false;
  const html = await res.text();
  const files = await filesOf(html);
  await Promise.all(files.map((f) => fetchFile(f).catch(() => undefined)));
  const headers = { "content-type": "text/html; charset=utf-8", "x-nia-saved": String(Date.now()), "x-nia-files": JSON.stringify(files) };
  for (const [k, v] of Object.entries(extra)) if (v) headers[k] = encodeURIComponent(String(v).slice(0, 200));
  await (await caches.open(cacheName)).put(key, new Response(html, { headers }));
  return true;
}

async function saveShell() {
  await savePage(SHELL, OFFLINE, OFFLINE);
}

async function saveDocument(url, title, project) {
  const key = docKey(url);
  if (!key) return;
  if (!(await savePage(DOCS, key, key, { "x-nia-title": title, "x-nia-project": project }))) return;
  // The offline list itself, refreshed once a day so it matches the current build.
  const shell = await caches.match(OFFLINE, { cacheName: SHELL });
  if (!shell || Date.now() - Number(shell.headers.get("x-nia-saved") || 0) > DAY) await saveShell().catch(() => undefined);
  await tidy();
}

/** Keeps the newest documents and only the files saved pages still need. */
async function tidy() {
  const docs = await caches.open(DOCS);
  const entries = await Promise.all((await docs.keys()).map(async (req) => [req, await docs.match(req)]));
  entries.sort((a, b) => Number(b[1].headers.get("x-nia-saved")) - Number(a[1].headers.get("x-nia-saved")));
  for (const [req] of entries.slice(KEEP)) await docs.delete(req);
  const shell = await caches.match(OFFLINE, { cacheName: SHELL });
  const needed = new Set();
  for (const res of [...entries.slice(0, KEEP).map((e) => e[1]), shell].filter(Boolean)) {
    try {
      for (const f of JSON.parse(res.headers.get("x-nia-files") || "[]")) needed.add(new URL(f, self.location.origin).href);
    } catch {}
  }
  const files = await caches.open(FILES);
  for (const req of await files.keys()) if (!needed.has(req.url)) await files.delete(req);
}

async function clearAll() {
  await caches.delete(DOCS);
  await tidy();
}

// Notices (FEEDBACK D6 step 2): Nia's server sends {title, body, href, tag} (src/lib/push.ts).
// Someone looking at Nia sees it in Updates, so nothing pops up then.
self.addEventListener("push", (event) => {
  let notice = null;
  try {
    notice = event.data ? event.data.json() : null;
  } catch {}
  if (!notice || !notice.title) return;
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      if (windows.some((w) => w.focused)) return;
      await self.registration.showNotification(notice.title, {
        body: notice.body || "",
        tag: notice.tag,
        icon: "/app-icons/icon-192.png",
        data: { href: notice.href || "/home" },
      });
    })(),
  );
});

// Clicking a notice: Nia comes forward on that page (or opens on it).
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const href = new URL((event.notification.data && event.notification.data.href) || "/home", self.location.origin).href;
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const nia = windows.find((w) => new URL(w.url).origin === self.location.origin);
      if (nia) {
        await nia.focus();
        try {
          await nia.navigate(href);
          return;
        } catch {}
      }
      await self.clients.openWindow(href);
    })(),
  );
});
