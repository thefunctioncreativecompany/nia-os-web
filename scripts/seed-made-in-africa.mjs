// Seeds the "Made in Africa" Explore category into Supabase.
// Run from the project root:
//   node --env-file=.env.local scripts/seed-made-in-africa.mjs
// Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.
// Safe to re-run: everything is upserted by slug / natural keys.
// Titles are seeded with published=false. Flip them on once reviewed
// (pass --publish to publish everything that has no open review flags).

import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
const publish = process.argv.includes("--publish");
const db = createClient(url, key, { auth: { persistSession: false } });

const data = JSON.parse(
  await readFile(new URL("../src/features/explore/made-in-africa.json", import.meta.url), "utf8")
);

function must({ data, error }, what) {
  if (error) throw new Error(`${what}: ${error.message}`);
  return data;
}

// 1. Categories ("Made in Africa", plus "Explore all" for titles made elsewhere)
const categoryIds = {};
for (const [i, c] of data.categories.entries()) {
  const [row] = must(
    await db.from("explore_categories")
      .upsert({ ...c, sort_order: i }, { onConflict: "slug" })
      .select("id, slug"),
    `category ${c.slug}`
  );
  categoryIds[row.slug] = row.id;
}

// 2. Collections
const collectionIds = {};
for (const [i, c] of data.collections.entries()) {
  const { category, ...fields } = c;
  const [row] = must(
    await db.from("explore_collections")
      .upsert({ ...fields, category_id: categoryIds[category], sort_order: i }, { onConflict: "slug" })
      .select("id, slug"),
    `collection ${c.slug}`
  );
  collectionIds[row.slug] = row.id;
}

// 3. Titles, seasons, videos, collection items
const positions = {};
let videoCount = 0;
for (const t of data.titles) {
  const { collection, pinned_season, seasons = [], videos = [], ...fields } = t;
  const needsReview = fields.needs_review ?? [];
  const [title] = must(
    await db.from("explore_titles")
      .upsert(
        { ...fields, needs_review: needsReview, published: publish && needsReview.length === 0, updated_at: new Date().toISOString() },
        { onConflict: "slug" }
      )
      .select("id"),
    `title ${t.slug}`
  );

  const videoRows = videos.map((v, i) => ({ ...v, title_id: title.id, season_id: null, sort_order: i }));

  for (const s of seasons) {
    const { videos: sv = [], ...seasonFields } = s;
    const [season] = must(
      await db.from("explore_seasons")
        .upsert({ ...seasonFields, title_id: title.id }, { onConflict: "title_id,number" })
        .select("id"),
      `season ${t.slug} S${s.number}`
    );
    sv.forEach((v, i) => videoRows.push({ ...v, title_id: title.id, season_id: season.id, sort_order: i }));
  }

  if (videoRows.length) {
    must(
      await db.from("explore_videos").upsert(
        videoRows.map((v) => ({ is_official: true, is_primary: false, ...v })),
        { onConflict: "provider,video_id,title_id" }
      ),
      `videos ${t.slug}`
    );
    videoCount += videoRows.length;
  }

  positions[collection] = (positions[collection] ?? 0) + 1;
  must(
    await db.from("explore_collection_items").upsert(
      {
        collection_id: collectionIds[collection],
        title_id: title.id,
        pinned_season_no: pinned_season ?? null,
        sort_order: positions[collection],
      },
      { onConflict: "collection_id,title_id" }
    ),
    `collection item ${t.slug}`
  );
  console.log(`✓ ${t.title}`);
}

console.log(`\nSeeded ${data.titles.length} titles and ${videoCount} videos across ${data.categories.map((c) => `"${c.name}"`).join(" and ")}.`);
if (!publish) console.log("Titles are unpublished. Review them, then re-run with --publish.");
