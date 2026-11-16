-- Key milestones and actions on a project (Ika, 2026-11-15: "a key milestones tab under notes on
-- projects, where users/teams can add key milestones/objectives and actions, with a date picker … for
-- now i want to be able to just add action items from meetings, discussions etc"; later the start of
-- a fuller project management view). Run in Supabase: SQL Editor > paste the whole file > Run.
-- Safe to run twice. Run after 20261020000000_projects.sql.
--
-- Each item is a milestone (a goal or a date that matters) or an action (something to do), with an
-- optional date, ticked off when done. Everyone on the project sees them; people who can edit the
-- project add, change, tick and remove them. Removing is a soft delete.

create table if not exists public.project_milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  kind text not null default 'action' check (kind in ('milestone', 'action')),
  title text not null check (char_length(btrim(title)) between 1 and 300),
  due_on date,
  done_at timestamptz,
  position integer,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- A project's open items, the way the page lists them.
create index if not exists project_milestones_project_idx on public.project_milestones (project_id, due_on) where deleted_at is null;

alter table public.project_milestones enable row level security;

drop policy if exists "People on the project see its milestones" on public.project_milestones;
create policy "People on the project see its milestones" on public.project_milestones
  for select to authenticated using (deleted_at is null and public.can_view_project(project_id));

drop policy if exists "Editors add milestones" on public.project_milestones;
create policy "Editors add milestones" on public.project_milestones
  for insert to authenticated with check (created_by = (select auth.uid()) and deleted_at is null and public.can_edit_project(project_id));

drop policy if exists "Editors change milestones" on public.project_milestones;
create policy "Editors change milestones" on public.project_milestones
  for update to authenticated using (deleted_at is null and public.can_edit_project(project_id)) with check (public.can_edit_project(project_id));

-- What may change: the item's words, kind, date, done and order. Never its project.
revoke all on public.project_milestones from anon, authenticated;
grant select, insert on public.project_milestones to authenticated;
grant update (kind, title, due_on, done_at, position, updated_at) on public.project_milestones to authenticated;

-- Removing one (soft). A plain update can't: removed rows are hidden from everyone, so Postgres
-- rejects the update that would hide one (as with references, 20261031010000_collections_remove.sql).
create or replace function public.remove_project_milestone(milestone_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.project_milestones m
    where m.id = milestone_id and m.deleted_at is null and public.can_edit_project(m.project_id)
  ) then
    raise exception 'Only people who can edit this project can remove its milestones' using errcode = '42501';
  end if;
  update public.project_milestones set deleted_at = now(), updated_at = now() where id = milestone_id;
end;
$$;
revoke execute on function public.remove_project_milestone(uuid) from public, anon;
grant execute on function public.remove_project_milestone(uuid) to authenticated;
