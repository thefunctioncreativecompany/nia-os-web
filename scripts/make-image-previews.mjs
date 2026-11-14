// Makes the smaller copy (1,600px on its longest side, JPEG) for pictures uploaded before uploads
// made one themselves (2026-11-14), so grids, viewers, the share page and portfolios stop fetching
// the originals (Supabase's free plan: 5 GB of egress a month).
//
// Each original is downloaded once to make its copy, which counts as egress: run it after the
// billing cycle resets (17 of the month), not while the allowance is used up.
//
// Run from the project root:
//   node --env-file=.env.local scripts/make-image-previews.mjs --dry   (count them and their size)
//   node --env-file=.env.local scripts/make-image-previews.mjs         (make the copies)
// Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local.

import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

const dry = process.argv.includes("--dry");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY. Run with --env-file=.env.local.");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });
const BUCKET = "project-files";
const SKIP = new Set(["image/gif", "image/svg+xml"]);

const { data, error } = await db
  .from("project_files")
  .select("id, project_id, path, mime, size, name")
  .eq("kind", "image")
  .is("thumb_path", null)
  .is("deleted_at", null);
if (error) throw error;
const todo = data.filter((f) => !SKIP.has(f.mime) && f.size >= 500_000);
const mb = (n) => `${(n / 1024 / 1024).toFixed(1)} MB`;
console.log(`${todo.length} pictures need a smaller copy; downloading them uses about ${mb(todo.reduce((n, f) => n + f.size, 0))} of egress.`);
if (dry) process.exit(0);

let made = 0;
for (const f of todo) {
  const { data: blob, error: getError } = await db.storage.from(BUCKET).download(f.path);
  if (getError || !blob) {
    console.warn(`Skipped ${f.name}: ${getError?.message ?? "no file"}`);
    continue;
  }
  try {
    const small = await sharp(Buffer.from(await blob.arrayBuffer()))
      .rotate() // upright, as the camera recorded it
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 82 })
      .toBuffer();
    const key = f.path.split("/")[1]?.slice(0, 36) ?? crypto.randomUUID();
    const thumbPath = `${f.project_id}/${key}-preview.jpg`;
    const { error: putError } = await db.storage.from(BUCKET).upload(thumbPath, small, { contentType: "image/jpeg", upsert: true });
    if (putError) throw putError;
    const { error: rowError } = await db.from("project_files").update({ thumb_path: thumbPath }).eq("id", f.id);
    if (rowError) throw rowError;
    made += 1;
    console.log(`${f.name}: ${mb(f.size)} → ${mb(small.length)}`);
  } catch (e) {
    console.warn(`Skipped ${f.name}: ${e.message}`);
  }
}
console.log(`Made ${made} of ${todo.length}.`);
