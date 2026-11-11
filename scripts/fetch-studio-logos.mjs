// Fetches the logo of every studio in studios.json that doesn't have one yet (Ika, 2026-11-10: By
// studio is picked by logo), from TMDB: the studio's first company id, or its network when the
// company has none. Trims the empty edges, saves public/explore/studios/<id>.png (320px) and
// records the source in studio-logos.json. Check each by eye on a white plate afterwards.
//   node scripts/fetch-studio-logos.mjs      (TMDB_API_KEY loaded)
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import sharp from "sharp";

const KEY = process.env.TMDB_API_KEY;
if (!KEY) throw new Error("Load TMDB_API_KEY from .env.local first.");
const { studios } = JSON.parse(await readFile("src/features/explore/studios.json", "utf8"));
const file = "src/features/explore/studio-logos.json";
const logos = JSON.parse(await readFile(file, "utf8"));
const get = async (path) => (await fetch(`https://api.themoviedb.org/3/${path}?api_key=${KEY}`)).json();

for (const s of studios) {
  if (logos[s.id] && existsSync(`public/explore/studios/${s.id}.png`)) continue;
  const tries = [...s.tmdb.map((id) => `company/${id}`), ...(s.networks ?? []).map((id) => `network/${id}`)];
  let done = false;
  for (const path of tries) {
    const d = await get(path);
    if (!d.logo_path) continue;
    const buf = Buffer.from(await (await fetch(`https://image.tmdb.org/t/p/original${d.logo_path}`)).arrayBuffer());
    await sharp(buf).trim().resize(320, 320, { fit: "inside", withoutEnlargement: true }).png({ compressionLevel: 9 }).toFile(`public/explore/studios/${s.id}.png`);
    logos[s.id] = { source: "TMDB", tmdb: path };
    console.log(`${s.id}: ${d.name}`);
    done = true;
    break;
  }
  if (!done) console.log(`${s.id}: NO LOGO on TMDB`);
}
await writeFile(file, JSON.stringify(logos, null, 1) + "\n");
