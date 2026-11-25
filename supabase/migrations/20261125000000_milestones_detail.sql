-- Key milestones: who's responsible, and more detail (Ika, 2026-11-24, PR2 in docs/FEEDBACK.md:
-- "assignee next to the date", department, priority and stage in a full-screen view, drag to
-- reorder). Run in Supabase: SQL Editor > paste the whole file > Run. Safe to run twice.
-- Run after 20261119000000_project_milestones.sql and 20261109000000_people.sql.
--
-- Adds to each milestone or action, all optional:
--   assignee   someone on this project's cast & crew (people without a Nia account too)
--   department the crew department it belongs to (the app's list: Direction, Production, …)
--   priority   high, medium or low
--   stage      the production stage it belongs to (the same list as a project's stage)
--   notes      more detail, up to 2,000 characters
-- Drag to reorder uses the `position` column that's already there. Changes no existing data and
-- no access rules: the same people see and change milestones as before.

alter table public.project_milestones
  add column if not exists assignee_id uuid references public.cast_crew (id) on delete set null,
  add column if not exists department text check (department is null or char_length(department) <= 60),
  add column if not exists priority text check (priority is null or priority in ('high', 'medium', 'low')),
  add column if not exists stage text check (stage is null or stage in ('Development', 'Pre-Production', 'In Production', 'Post-Production', 'Wrapped')),
  add column if not exists notes text check (notes is null or char_length(notes) <= 2000);

-- "What's Maya doing this week": a project's items by who they're assigned to.
create index if not exists project_milestones_assignee_idx on public.project_milestones (assignee_id) where deleted_at is null and assignee_id is not null;

-- The assignee must be on this project's cast & crew (not another project's, not removed).
create or replace function public.project_milestones_assignee_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.assignee_id is not null and not exists (
    select 1 from public.cast_crew c
    where c.id = new.assignee_id and c.project_id = new.project_id and c.deleted_at is null
  ) then
    raise exception 'A milestone can only be assigned to someone on this project''s cast & crew'
      using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke execute on function public.project_milestones_assignee_guard() from public, anon, authenticated;

drop trigger if exists project_milestones_assignee_guard on public.project_milestones;
create trigger project_milestones_assignee_guard
  before insert or update of assignee_id on public.project_milestones
  for each row execute function public.project_milestones_assignee_guard();

-- The new fields can be set when adding one and changed afterwards, by people who can edit the
-- project (the existing rules decide who that is).
grant update (assignee_id, department, priority, stage, notes) on public.project_milestones to authenticated;
