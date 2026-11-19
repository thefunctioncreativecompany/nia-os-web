-- Portfolios show only the workspace's own work (platform audit 2026-11-18, PA1 and PA2 in
-- docs/FEEDBACK.md). Run in Supabase: SQL Editor > paste the whole file > Run. Safe to run twice.
-- Run after 20261114000000_portfolios.sql.
--
-- Before: a project could go on a portfolio if the person could see it, so someone shared on a
-- project as "Can view" could put another team's project on their own portfolio, publish it, and
-- its final pictures and films showed on the public page. A portfolio's cover could also be any
-- file, from any project. Now both must come from the portfolio's own workspace.

-- 1. Projects on a portfolio: only the portfolio's own workspace's projects.
drop policy if exists "Workspace members add portfolio projects" on public.portfolio_projects;
create policy "Workspace members add portfolio projects" on public.portfolio_projects
  for insert to authenticated with check (
    exists (
      select 1
      from public.portfolios f
      join public.projects p on p.id = portfolio_projects.project_id
      where f.id = portfolio_projects.portfolio_id
        and f.deleted_at is null
        and p.deleted_at is null
        and p.workspace_id = f.workspace_id
        and public.is_workspace_member(f.workspace_id)
    )
  );

-- Take off any project that's already on a portfolio from another workspace.
delete from public.portfolio_projects pp
using public.portfolios f, public.projects p
where f.id = pp.portfolio_id
  and p.id = pp.project_id
  and p.workspace_id <> f.workspace_id;

-- 2. A portfolio's cover: a file from one of its own workspace's projects.
create or replace function public.portfolios_cover_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.cover_file_id is not null and not exists (
    select 1
    from public.project_files pf
    join public.projects p on p.id = pf.project_id
    where pf.id = new.cover_file_id
      and pf.deleted_at is null
      and p.deleted_at is null
      and p.workspace_id = new.workspace_id
  ) then
    raise exception 'A portfolio''s cover must come from one of its own projects'
      using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke execute on function public.portfolios_cover_guard() from public, anon, authenticated;

-- Clear any cover that isn't from the portfolio's own workspace (the page then uses its first picture).
update public.portfolios f
set cover_file_id = null
where f.cover_file_id is not null
  and not exists (
    select 1
    from public.project_files pf
    join public.projects p on p.id = pf.project_id
    where pf.id = f.cover_file_id
      and p.workspace_id = f.workspace_id
  );

drop trigger if exists portfolios_cover_guard on public.portfolios;
create trigger portfolios_cover_guard
  before insert or update of cover_file_id on public.portfolios
  for each row execute function public.portfolios_cover_guard();
