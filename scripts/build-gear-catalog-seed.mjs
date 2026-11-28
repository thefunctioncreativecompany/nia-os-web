// Writes the gear catalogue's seed migration from src/data/gear/catalog.json (docs/GEAR_SPEC.md,
// step G1). The JSON is the source: change it, run this, and paste the new migration into the
// Supabase SQL Editor. Items keep their id forever; an item taken out of the JSON is retired
// (kept, so kit that points at it still reads), not deleted.
//
//   node scripts/build-gear-catalog-seed.mjs            writes the v<version> migration
//   node scripts/build-gear-catalog-seed.mjs --check    checks the JSON only

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const catalog = JSON.parse(readFileSync(join(root, "src/data/gear/catalog.json"), "utf8"));
const taxonomy = JSON.parse(readFileSync(join(root, "src/data/gear/taxonomy.json"), "utf8"));

// Check: ids readable and unique, every item in a known department and category.
const places = new Set(taxonomy.departments.flatMap((d) => d.categories.map((c) => `${d.name}|${c}`)));
const ids = new Set();
const problems = [];
for (const item of catalog.items) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(item.id) || item.id.length > 100) problems.push(`${item.id}: id must be lower-case words joined by hyphens`);
  if (ids.has(item.id)) problems.push(`${item.id}: id used twice`);
  ids.add(item.id);
  if (!places.has(`${item.department}|${item.category}`)) problems.push(`${item.id}: "${item.department} / ${item.category}" is not in taxonomy.json`);
  if (!item.name?.trim()) problems.push(`${item.id}: no name`);
  if (!["branded", "generic"].includes(item.kind)) problems.push(`${item.id}: kind must be branded or generic`);
}
if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
if (process.argv.includes("--check")) {
  console.log(`catalog.json is fine: ${catalog.items.length} items in ${taxonomy.departments.length} departments.`);
  process.exit(0);
}

const q = (v) => (v === null || v === undefined || v === "" ? "null" : `'${String(v).replace(/'/g, "''")}'`);
const arr = (xs) => (xs?.length ? `array[${xs.map(q).join(", ")}]` : "'{}'::text[]");

// Position: the order the catalogue lists items in (department, then category, as taxonomy.json).
const order = new Map(taxonomy.departments.flatMap((d, i) => d.categories.map((c, j) => [`${d.name}|${c}`, i * 100 + j])));
const items = catalog.items.toSorted((a, b) => order.get(`${a.department}|${a.category}`) - order.get(`${b.department}|${b.category}`));

const rows = items.map((it, i) => `  (${[q(it.id), q(it.name), q(it.brand), q(it.department), q(it.category), q(it.kind), q(it.variants), q(it.image_url), arr(it.sources), i].join(", ")})`);

const sql = `-- Gear catalogue v${catalog.version} (${catalog.updated}): ${items.length} items. Written by
-- scripts/build-gear-catalog-seed.mjs from src/data/gear/catalog.json; change the JSON, not this file.
-- Run after 20261128000000_gear.sql, in the Supabase SQL Editor (paste the file's contents).
-- Safe to run again: items are added or brought up to date by id, and items no longer in the
-- list are retired (kept, so kit that points at them still reads).

insert into public.gear_catalog (id, name, brand, department, category, kind, variants, image_url, sources, position)
values
${rows.join(",\n")}
on conflict (id) do update set
  name = excluded.name,
  brand = excluded.brand,
  department = excluded.department,
  category = excluded.category,
  kind = excluded.kind,
  variants = excluded.variants,
  image_url = coalesce(excluded.image_url, public.gear_catalog.image_url),
  sources = excluded.sources,
  position = excluded.position,
  retired_at = null;

update public.gear_catalog set retired_at = now()
where retired_at is null and id not in (${items.map((it) => q(it.id)).join(", ")});
`;

// Each version is its own migration with its own timestamp (Supabase knows a migration by it):
// rewriting a version keeps its file; a new version is stamped now, so it runs after the last.
const migrations = join(root, "supabase/migrations");
const existing = readdirSync(migrations).find((f) => f.endsWith(`_gear_catalog_v${catalog.version}.sql`));
const stamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
const out = join(migrations, existing ?? `${stamp}_gear_catalog_v${catalog.version}.sql`);
writeFileSync(out, sql);
console.log(`Wrote ${out.replace(root + "/", "")}: ${items.length} items.`);
