-- Reference folders on a project (Ika, 2026-11-24, PR1 in docs/FEEDBACK.md: "teams sort references
-- into named folders instead of one endless gallery"). Run in Supabase: SQL Editor > paste the whole
-- file > Run. Safe to run twice. Run after 20261118000000_project_references_arrange.sql.
--
-- A project gets named folders (Lighting, Wardrobe, Location…), in an order the team sets. Every
-- reference can sit in one folder: an uploaded picture (project_files) or a linked one (an Explore
-- title or an Instagram post, project_references). Without a folder it's "Unsorted".
-- Everyone on the project sees the folders; people who can edit the project make, rename, reorder
-- and remove them, and move references between them. Removing a folder keeps what was in it:
-- those references go back to Unsorted. Changes no existing data.

create table if not exists public.project_reference_folders (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  position integer,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- One folder of each name on a project (Lighting and lighting are the same folder).
create unique index if not exists project_reference_folders_name on public.project_reference_folders (project_id, lower(btrim(name))) where deleted_at is null;
create index if not exists project_reference_folders_project on public.project_reference_folders (project_id, position) where deleted_at is null;

alter table public.project_reference_folders enable row level security;

drop policy if exists "People on the project see its folders" on public.project_reference_folders;
create policy "People on the project see its folders" on public.project_reference_folders
  for select to authenticated using (deleted_at is null and public.can_view_project(project_id));

drop policy if exists "Editors make folders" on public.project_reference_folders;
create policy "Editors make folders" on public.project_reference_folders
  for insert to authenticated with check (created_by = (select auth.uid()) and deleted_at is null and public.can_edit_project(project_id));

drop policy if exists "Editors rename and reorder folders" on public.project_reference_folders;
create policy "Editors rename and reorder folders" on public.project_reference_folders
  for update to authenticated using (deleted_at is null and public.can_edit_project(project_id)) with check (public.can_edit_project(project_id));

-- What may change: the name and the order. Never the project.
revoke all on public.project_reference_folders from anon, authenticated;
grant select, insert on public.project_reference_folders to authenticated;
grant update (name, position, updated_at) on public.project_reference_folders to authenticated;

-- The folder each reference sits in (none: Unsorted).
alter table public.project_files
  add column if not exists folder_id uuid references public.project_reference_folders (id) on delete set null;
alter table public.project_references
  add column if not exists folder_id uuid references public.project_reference_folders (id) on delete set null;
create index if not exists project_files_folder on public.project_files (folder_id) where deleted_at is null and folder_id is not null;
create index if not exists project_references_folder on public.project_references (folder_id) where deleted_at is null and folder_id is not null;

-- Moving a reference into a folder: editors, under the existing rules for changing a file or a reference.
grant update (folder_id) on public.project_files, public.project_references to authenticated;

-- The folder must be one of this project's own (not another project's, not removed).
create or replace function public.reference_folder_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.folder_id is not null and not exists (
    select 1 from public.project_reference_folders f
    where f.id = new.folder_id and f.project_id = new.project_id and f.deleted_at is null
  ) then
    raise exception 'A reference can only go in one of this project''s own folders'
      using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke execute on function public.reference_folder_guard() from public, anon, authenticated;

drop trigger if exists project_files_folder_guard on public.project_files;
create trigger project_files_folder_guard
  before insert or update of folder_id on public.project_files
  for each row execute function public.reference_folder_guard();
drop trigger if exists project_references_folder_guard on public.project_references;
create trigger project_references_folder_guard
  before insert or update of folder_id on public.project_references
  for each row execute function public.reference_folder_guard();

-- Removing a folder (soft): what was in it goes back to Unsorted. A plain update can't hide a row
-- (removed rows are hidden from everyone, so Postgres rejects it; as with references,
-- 20261031010000_collections_remove.sql), so this checks you may, then does both.
create or replace function public.remove_reference_folder(folder_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.project_reference_folders f
    where f.id = folder_id and f.deleted_at is null and public.can_edit_project(f.project_id)
  ) then
    raise exception 'Only people who can edit this project can remove its folders' using errcode = '42501';
  end if;
  update public.project_files set folder_id = null where project_files.folder_id = remove_reference_folder.folder_id;
  update public.project_references set folder_id = null where project_references.folder_id = remove_reference_folder.folder_id;
  update public.project_reference_folders set deleted_at = now(), updated_at = now() where id = remove_reference_folder.folder_id;
end;
$$;
revoke execute on function public.remove_reference_folder(uuid) from public, anon;
grant execute on function public.remove_reference_folder(uuid) to authenticated;
