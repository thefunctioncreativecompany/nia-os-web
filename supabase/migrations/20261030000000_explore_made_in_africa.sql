-- nOS Explore: "Made in Africa" data model
-- Run in Supabase: SQL Editor > paste the whole file > Run. Then seed with
--   node --env-file=.env.local scripts/seed-made-in-africa.mjs
-- (needs SUPABASE_SERVICE_ROLE_KEY in .env.local). Until then Explore reads the same list from
-- src/features/explore/made-in-africa.json.

-- 1. Categories (top-level Explore groupings, e.g. "Made in Africa")
create table if not exists explore_categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  description text,
  sort_order  int default 0,
  created_at  timestamptz default now()
);

-- 2. Collections (rows inside a category, e.g. "Light & Landscape")
create table if not exists explore_collections (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid references explore_categories(id) on delete cascade,
  slug        text unique not null,
  name        text not null,
  description text,
  sort_order  int default 0,
  created_at  timestamptz default now()
);

-- 3. Titles (one row per film or series)
create table if not exists explore_titles (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  title        text not null,
  type         text not null check (type in ('film','series','short','documentary')),
  genres       text[] default '{}',  -- the projects' genre list (Drama, Action, ...), from TMDB
  year         int,
  year_end     int,                -- for ongoing / finished series
  countries    text[] default '{}',
  credit       text,               -- director or creator line, as displayed
  platform     text,               -- e.g. Netflix, Showmax, MUBI (where it streams / who released it)
  recognition  text,               -- festivals and awards line
  pair_with    text,               -- the global pairing (learning hook)
  study_note   text,               -- "What to study"
  synopsis     text,               -- written by Nia; never copied
  wikidata_id  text,               -- Q-number, filled by the Wikidata enrichment step
  imdb_id      text,               -- tt-number, for "View on IMDb" link-outs only
  needs_review text[] default '{}',-- fields still marked "to confirm"
  published    boolean default false, -- only published titles show to users
  deleted_at   timestamptz,          -- soft delete: hidden, never removed
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- 4. Seasons (series only)
create table if not exists explore_seasons (
  id            uuid primary key default gen_random_uuid(),
  title_id      uuid references explore_titles(id) on delete cascade,
  number        int not null,
  label         text,              -- e.g. "The Wedding" for How to Ruin Christmas
  year          int,
  synopsis      text,
  episode_count int,
  unique (title_id, number)
);

-- 5. Videos (trailers, teasers, clips). Store IDs only, never full share links.
create table if not exists explore_videos (
  id          uuid primary key default gen_random_uuid(),
  title_id    uuid references explore_titles(id) on delete cascade,
  season_id   uuid references explore_seasons(id) on delete cascade, -- null for films
  provider    text not null check (provider in ('youtube','vimeo')),
  video_id    text not null,
  kind        text not null default 'trailer' check (kind in ('trailer','teaser','clip','promo','announcement')),
  label       text,
  channel     text,              -- who posted it, used in the attribution line
  is_official boolean default true,
  is_primary  boolean default false, -- the hero trailer for this title / season
  sort_order  int default 0,
  unique (provider, video_id, title_id)
);

-- 6. Which titles sit in which collection, with an optional pinned season
create table if not exists explore_collection_items (
  collection_id    uuid references explore_collections(id) on delete cascade,
  title_id         uuid references explore_titles(id) on delete cascade,
  pinned_season_no int,
  sort_order       int default 0,
  primary key (collection_id, title_id)
);

-- Read access for signed-in users; writes only via the service role (seed script / admin)
alter table explore_categories       enable row level security;
alter table explore_collections      enable row level security;
alter table explore_titles           enable row level security;
alter table explore_seasons          enable row level security;
alter table explore_videos           enable row level security;
alter table explore_collection_items enable row level security;

create policy "read categories"  on explore_categories       for select to authenticated using (true);
create policy "read collections" on explore_collections      for select to authenticated using (true);
create policy "read titles"      on explore_titles           for select to authenticated using (published and deleted_at is null);
create policy "read seasons"     on explore_seasons          for select to authenticated using (true);
create policy "read videos"      on explore_videos           for select to authenticated using (true);
create policy "read items"       on explore_collection_items for select to authenticated using (true);

create index if not exists explore_videos_title_idx on explore_videos(title_id);
create index if not exists explore_items_collection_idx on explore_collection_items(collection_id, sort_order);
