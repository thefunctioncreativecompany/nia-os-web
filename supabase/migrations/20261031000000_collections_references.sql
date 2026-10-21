-- Collections and project references (Ika, 2026-10-21).
-- Run in Supabase: SQL Editor > paste the whole file > Run. Safe to run twice.
--
-- 1. collections: each person's named groups of saved Explore titles ("Saved", "Moodboard"...).
--    Only the person who made a collection can see or change it.
-- 2. collection_items: the titles in a collection.
-- 3. project_references: an Explore title added to a project's Files & references. Everyone who
--    can see the project sees them; people who can edit it can add and remove them.
-- Titles are stored by their Explore slug (e.g. "atlantics"). `kind` leaves room for other
-- saved things later (people's own projects). Nothing is deleted: removing sets deleted_at.

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists collections_owner_idx on public.collections (owner_id) where deleted_at is null;

create table if not exists public.collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections (id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null default 'explore' check (kind in ('explore')),
  title_slug text not null check (char_length(title_slug) between 1 and 120),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create unique index if not exists collection_items_once on public.collection_items (collection_id, kind, title_slug) where deleted_at is null;
create index if not exists collection_items_owner_idx on public.collection_items (owner_id) where deleted_at is null;

create table if not exists public.project_references (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  added_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null default 'explore' check (kind in ('explore')),
  title_slug text not null check (char_length(title_slug) between 1 and 120),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create unique index if not exists project_references_once on public.project_references (project_id, kind, title_slug) where deleted_at is null;
create index if not exists project_references_project_idx on public.project_references (project_id) where deleted_at is null;

drop trigger if exists collections_updated_at on public.collections;
create trigger collections_updated_at before update on public.collections
  for each row execute function public.set_updated_at();

alter table public.collections enable row level security;
alter table public.collection_items enable row level security;
alter table public.project_references enable row level security;

do $$
begin
  -- Collections: yours only.
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'collections' and policyname = 'You see your collections') then
    create policy "You see your collections" on public.collections
      for select to authenticated using (deleted_at is null and owner_id = (select auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'collections' and policyname = 'You make your collections') then
    create policy "You make your collections" on public.collections
      for insert to authenticated with check (owner_id = (select auth.uid()) and deleted_at is null);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'collections' and policyname = 'You rename and remove your collections') then
    create policy "You rename and remove your collections" on public.collections
      for update to authenticated using (deleted_at is null and owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
  end if;

  -- Collection items: yours, in your own collections.
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'collection_items' and policyname = 'You see what you saved') then
    create policy "You see what you saved" on public.collection_items
      for select to authenticated using (deleted_at is null and owner_id = (select auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'collection_items' and policyname = 'You save into your collections') then
    create policy "You save into your collections" on public.collection_items
      for insert to authenticated with check (
        owner_id = (select auth.uid())
        and deleted_at is null
        and exists (select 1 from public.collections c where c.id = collection_id and c.owner_id = (select auth.uid()) and c.deleted_at is null)
      );
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'collection_items' and policyname = 'You remove what you saved') then
    create policy "You remove what you saved" on public.collection_items
      for update to authenticated using (deleted_at is null and owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
  end if;

  -- Project references: the project's own access rules.
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'project_references' and policyname = 'People on the project see its references') then
    create policy "People on the project see its references" on public.project_references
      for select to authenticated using (deleted_at is null and public.can_view_project(project_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'project_references' and policyname = 'Editors add references') then
    create policy "Editors add references" on public.project_references
      for insert to authenticated with check (added_by = (select auth.uid()) and deleted_at is null and public.can_edit_project(project_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'project_references' and policyname = 'Editors remove references') then
    create policy "Editors remove references" on public.project_references
      for update to authenticated using (deleted_at is null and public.can_edit_project(project_id)) with check (public.can_edit_project(project_id));
  end if;
end $$;

-- What may change after saving: a collection's name, and removing things.
revoke all on public.collections, public.collection_items, public.project_references from anon, authenticated;
grant select, insert on public.collections, public.collection_items, public.project_references to authenticated;
grant update (name, deleted_at) on public.collections to authenticated;
grant update (deleted_at) on public.collection_items, public.project_references to authenticated;
