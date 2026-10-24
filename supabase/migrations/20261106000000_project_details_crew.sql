-- Better project details, and Crew & talent (Ika, 2026-10-23).
--
-- Details a producer plans with: shoot dates (first and last day), client and agency, what gets
-- delivered (each with a count and a frame shape) and when, special notes, and a few that fit
-- the production type (a logline; where an ad runs and for how long; how many looks and where a
-- shoot is published). The budget lives in its own table so only the owner and editors can read
-- it; people with view access never see it.
--
-- Director, writers and stars move into `crew`: a list of people with a role each
-- ([{"role": "Director", "name": "…"}]). The old columns stay for now, unused by the app.
--
-- The view-only link (shared_project) shows the new details and the crew, never the budget.
-- Safe to run twice.

alter table public.projects
  add column if not exists shoot_start date,
  add column if not exists shoot_end date,
  add column if not exists client text not null default '' check (char_length(client) <= 120),
  add column if not exists agency text not null default '' check (char_length(agency) <= 120),
  add column if not exists due_date date,
  add column if not exists deliverables jsonb not null default '[]'
    check (jsonb_typeof(deliverables) = 'array' and jsonb_array_length(deliverables) <= 30 and pg_column_size(deliverables) <= 8000),
  add column if not exists notes text not null default '' check (char_length(notes) <= 2000),
  add column if not exists logline text not null default '' check (char_length(logline) <= 300),
  add column if not exists usage text not null default '' check (char_length(usage) <= 200),
  add column if not exists looks smallint check (looks between 0 and 999),
  add column if not exists publication text not null default '' check (char_length(publication) <= 120),
  add column if not exists crew jsonb not null default '[]'
    check (jsonb_typeof(crew) = 'array' and jsonb_array_length(crew) <= 200 and pg_column_size(crew) <= 40000);

alter table public.projects drop constraint if exists projects_shoot_dates_order;
alter table public.projects add constraint projects_shoot_dates_order
  check (shoot_start is null or shoot_end is null or shoot_end >= shoot_start);

-- Existing names become crew, and a date already picked becomes the first shoot day. The
-- project triggers are paused so this doesn't change anyone's "edited" time or log activity.
alter table public.projects disable trigger projects_before_write;
alter table public.projects disable trigger projects_after_write;

update public.projects p
set crew = coalesce((
  select jsonb_agg(jsonb_build_object('role', r.role, 'name', r.name) order by r.ord, r.n)
  from (
    select 1 as ord, 'Director' as role, trim(x) as name, n from unnest(string_to_array(p.director, ',')) with ordinality as t(x, n)
    union all
    select 2, 'Writer', trim(x), n from unnest(string_to_array(p.writers, ',')) with ordinality as t(x, n)
    union all
    select 3, 'Talent', trim(x), n from unnest(string_to_array(p.stars, ',')) with ordinality as t(x, n)
  ) r
  where r.name <> ''
), '[]'::jsonb)
where p.crew = '[]'::jsonb and (p.director <> '' or p.writers <> '' or p.stars <> '');

update public.projects
set shoot_start = production_date::date, shoot_end = production_date::date
where shoot_start is null and production_date ~ '^\d{4}-\d{2}-\d{2}$';

alter table public.projects enable trigger projects_before_write;
alter table public.projects enable trigger projects_after_write;

-- Activity: a change to any detail or the crew is logged as "updated details".
create or replace function public.projects_after_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform public.log_activity(new.id, 'created', new.title);
  elsif old.deleted_at is null and new.deleted_at is not null then
    perform public.log_activity(new.id, 'deleted', new.title);
  elsif new.share_token is distinct from old.share_token then
    perform public.log_activity(new.id, case when new.share_token is null then 'link_off' else 'link_on' end);
  elsif new.title is distinct from old.title then
    perform public.log_activity(new.id, 'renamed', new.title);
  elsif new.cover_url is distinct from old.cover_url then
    perform public.log_activity(new.id, 'cover_changed');
  elsif (old.description, old.production_type, old.stage, old.production_date, old.duration,
         old.director, old.writers, old.genres, old.stars, old.shoot_start, old.shoot_end,
         old.client, old.agency, old.due_date, old.deliverables, old.notes, old.logline,
         old.usage, old.looks, old.publication, old.crew)
        is distinct from
        (new.description, new.production_type, new.stage, new.production_date, new.duration,
         new.director, new.writers, new.genres, new.stars, new.shoot_start, new.shoot_end,
         new.client, new.agency, new.due_date, new.deliverables, new.notes, new.logline,
         new.usage, new.looks, new.publication, new.crew) then
    perform public.log_activity(new.id, 'updated');
  end if;
  return null;
end;
$$;

-- The budget: owner and editors only.
create table if not exists public.project_budgets (
  project_id uuid primary key references public.projects (id) on delete cascade,
  amount numeric(14, 2) not null default 0 check (amount >= 0 and amount < 1000000000000),
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  updated_at timestamptz not null default now()
);
alter table public.project_budgets enable row level security;

drop trigger if exists project_budgets_set_updated_at on public.project_budgets;
create trigger project_budgets_set_updated_at
  before update on public.project_budgets
  for each row execute function public.set_updated_at();

drop policy if exists "Editors can see the budget" on public.project_budgets;
create policy "Editors can see the budget" on public.project_budgets
  for select to authenticated using (public.can_edit_project(project_id));
drop policy if exists "Editors can set the budget" on public.project_budgets;
create policy "Editors can set the budget" on public.project_budgets
  for insert to authenticated with check (public.can_edit_project(project_id));
drop policy if exists "Editors can change the budget" on public.project_budgets;
create policy "Editors can change the budget" on public.project_budgets
  for update to authenticated using (public.can_edit_project(project_id)) with check (public.can_edit_project(project_id));

revoke all on public.project_budgets from anon, authenticated;
-- Saving sends the whole row (insert, or update if it's there); the rules above keep it to the
-- project's owner and editors.
grant select, insert, update on public.project_budgets to authenticated;

-- The view-only link: the new details and the crew too (never the budget).
drop function if exists public.shared_project(text);
create function public.shared_project(token text)
returns table (
  title text, description text, cover_url text, production_type text, stage text,
  production_date text, duration text, director text, writers text, genres text,
  stars text, owner_name text, updated_at timestamptz,
  shoot_start date, shoot_end date, client text, agency text, due_date date,
  deliverables jsonb, notes text, logline text, usage text, looks smallint, publication text,
  crew jsonb)
language sql
stable
security definer
set search_path = ''
as $$
  select p.title, p.description, p.cover_url, p.production_type, p.stage,
         p.production_date, p.duration, p.director, p.writers, p.genres, p.stars,
         public.display_name(p.owner_id), p.updated_at,
         p.shoot_start, p.shoot_end, p.client, p.agency, p.due_date,
         p.deliverables, p.notes, p.logline, p.usage, p.looks, p.publication, p.crew
  from public.projects p
  where char_length(token) >= 24 and p.share_token = token and p.deleted_at is null;
$$;
revoke execute on function public.shared_project(text) from public;
grant execute on function public.shared_project(text) to anon, authenticated;
