-- Gear (docs/GEAR_SPEC.md, step G1; Ika, 2026-11-27: "for projects: planning a new shoot,
-- managing gear on set"). Built like cast & crew (20261109000000_people.sql). Three tables:
--
--   gear_catalog   Nia's reference list of production gear, the same for everyone: cameras,
--                  lenses, lighting, grip, sound and the rest, by department and category
--                  (ShareGrid's rental categories; items from Glow Hire, Magic Lightbox and B&H).
--                  Read-only in the app; filled by 20261128010000_gear_catalog_v1.sql, which
--                  scripts/build-gear-catalog-seed.mjs writes from src/data/gear/catalog.json.
--   gear           one kit list per workspace: each piece of gear the team has used once, with
--                  who owns it, the rental house it usually comes from, a serial number, how many
--                  the team owns, and a photo of their own. `catalog_id` links it to the catalogue.
--   project_gear   what's on which project: how many, where it comes from (own kit, rental,
--                  borrowed, the client's), the rental house, the days it's needed, who is
--                  responsible, its status (needed, booked, packed, returned) and notes.
--
-- Who can see what (the same as cast & crew):
--   - everyone signed in reads the catalogue;
--   - workspace members see and add to their workspace's kit list;
--   - anyone who can open a project sees its gear, and the kit on it;
--   - people who can edit a project add, change and remove (soft delete) its gear.
--
-- Run in the Supabase SQL Editor (paste the file's contents). Safe to run again. Then run
-- 20261128010000_gear_catalog_v1.sql to fill the catalogue.

-- The catalogue ------------------------------------------------------------------------------

create table if not exists public.gear_catalog (
  -- A readable key that never changes: "sony-fx3", "c-stand-40-inch".
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(id) <= 100),
  name text not null check (char_length(btrim(name)) between 1 and 160),
  -- Empty for generic gear (a C-stand, a sandbag).
  brand text check (brand is null or char_length(brand) <= 80),
  department text not null check (char_length(department) <= 60),
  category text not null check (char_length(category) <= 60),
  kind text not null default 'branded' check (kind in ('branded', 'generic')),
  -- Sizes, colours and lengths folded into this one item: "6x6 to 20x20", "1m, 3m, 5m".
  variants text check (variants is null or char_length(variants) <= 300),
  -- A licensed picture only (manufacturer press assets, Nia's own photos). Empty until then.
  image_url text check (image_url is null or char_length(image_url) <= 1000),
  -- Lists the item was seen in: "Glow Hire", "Magic Lightbox", "B&H essentials".
  sources text[] not null default '{}',
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Taken out of the catalogue: kept so kit that points at it still reads.
  retired_at timestamptz
);
create index if not exists gear_catalog_department_idx on public.gear_catalog (department, category, position) where retired_at is null;
create index if not exists gear_catalog_name_idx on public.gear_catalog (lower(name));

drop trigger if exists gear_catalog_updated_at on public.gear_catalog;
create trigger gear_catalog_updated_at before update on public.gear_catalog for each row execute function public.set_updated_at();

alter table public.gear_catalog enable row level security;
drop policy if exists "gear_catalog: read" on public.gear_catalog;
create policy "gear_catalog: read" on public.gear_catalog for select to authenticated using (true);
-- No add, change or delete rules: only the SQL Editor (or the service key) changes the catalogue.

-- The workspace's kit list -------------------------------------------------------------------

create table if not exists public.gear (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  catalog_id text references public.gear_catalog (id) on delete set null,
  name text not null check (char_length(btrim(name)) between 1 and 160),
  brand text check (brand is null or char_length(brand) <= 80),
  -- Empty means taken from the catalogue item (src/features/gear/catalog.ts).
  department text check (department is null or char_length(department) <= 60),
  category text check (category is null or char_length(category) <= 60),
  -- How many the team owns (empty: none, it's rented or borrowed each time).
  quantity_owned integer check (quantity_owned is null or quantity_owned between 0 and 9999),
  -- Who it belongs to: "Function Studios", "Tshiamo".
  owner text check (owner is null or char_length(owner) <= 120),
  -- Where it usually comes from when it isn't owned: "Magic Lightbox".
  vendor text check (vendor is null or char_length(vendor) <= 120),
  serial_number text check (serial_number is null or char_length(serial_number) <= 120),
  -- The team's own picture of their kit.
  photo_url text check (photo_url is null or char_length(photo_url) <= 1000),
  notes text check (notes is null or char_length(notes) <= 2000),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists gear_workspace_idx on public.gear (workspace_id) where deleted_at is null;
create index if not exists gear_catalog_idx on public.gear (catalog_id);
create index if not exists gear_created_by_idx on public.gear (created_by);
-- A catalogue item once per workspace (several of it are a quantity, not copies).
create unique index if not exists gear_one_per_catalog_item on public.gear (workspace_id, catalog_id) where deleted_at is null and catalog_id is not null;

-- Gear on a project --------------------------------------------------------------------------

create table if not exists public.project_gear (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  gear_id uuid not null references public.gear (id) on delete cascade,
  quantity integer not null default 1 check (quantity between 1 and 999),
  source text not null default 'rental' check (source in ('owned', 'rental', 'borrowed', 'client')),
  -- The rental house for this project (else the kit list's usual one).
  vendor text check (vendor is null or char_length(vendor) <= 120),
  -- The days it's needed (prep and wrap included); empty: the whole shoot.
  needed_from date,
  needed_to date check (needed_to is null or needed_from is null or needed_to >= needed_from),
  -- Who looks after it on this project (a person on its cast & crew).
  responsible_id uuid references public.people (id) on delete set null,
  status text not null default 'needed' check (status in ('needed', 'booked', 'packed', 'returned')),
  notes text check (notes is null or char_length(notes) <= 2000),
  position integer not null default 0,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists project_gear_project_idx on public.project_gear (project_id) where deleted_at is null;
create index if not exists project_gear_gear_idx on public.project_gear (gear_id);
create index if not exists project_gear_responsible_idx on public.project_gear (responsible_id);
create index if not exists project_gear_created_by_idx on public.project_gear (created_by);
-- The same kit once per project (more of it is a quantity).
create unique index if not exists project_gear_one_line on public.project_gear (project_id, gear_id) where deleted_at is null;

drop trigger if exists gear_updated_at on public.gear;
create trigger gear_updated_at before update on public.gear for each row execute function public.set_updated_at();
drop trigger if exists project_gear_updated_at on public.project_gear;
create trigger project_gear_updated_at before update on public.project_gear for each row execute function public.set_updated_at();

alter table public.gear enable row level security;
alter table public.project_gear enable row level security;

-- Kit: the workspace's members, or anyone who can open a project it's on.
drop policy if exists "gear: read" on public.gear;
create policy "gear: read" on public.gear for select to authenticated using (
  public.is_workspace_member(workspace_id)
  or exists (
    select 1 from public.project_gear g
    where g.gear_id = gear.id and g.deleted_at is null and public.can_view_project(g.project_id)
  )
);
drop policy if exists "gear: add" on public.gear;
create policy "gear: add" on public.gear for insert to authenticated with check (public.is_workspace_member(workspace_id));
drop policy if exists "gear: change" on public.gear;
create policy "gear: change" on public.gear for update to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

-- Project gear: read with the project, change with edit access; the kit must be in the project's
-- workspace, and the person responsible on the project's cast & crew.
drop policy if exists "project_gear: read" on public.project_gear;
create policy "project_gear: read" on public.project_gear for select to authenticated using (public.can_view_project(project_id));
drop policy if exists "project_gear: add" on public.project_gear;
create policy "project_gear: add" on public.project_gear for insert to authenticated with check (
  public.can_edit_project(project_id)
  and exists (
    select 1 from public.gear k join public.projects pr on pr.id = project_gear.project_id
    where k.id = project_gear.gear_id and k.workspace_id = pr.workspace_id
  )
  and (
    responsible_id is null
    or exists (select 1 from public.cast_crew c where c.project_id = project_gear.project_id and c.person_id = project_gear.responsible_id and c.deleted_at is null)
  )
);
drop policy if exists "project_gear: change" on public.project_gear;
create policy "project_gear: change" on public.project_gear for update to authenticated
  using (public.can_edit_project(project_id))
  with check (
    public.can_edit_project(project_id)
    and (
      responsible_id is null
      or exists (select 1 from public.cast_crew c where c.project_id = project_gear.project_id and c.person_id = project_gear.responsible_id and c.deleted_at is null)
    )
  );
