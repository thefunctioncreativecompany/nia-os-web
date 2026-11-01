-- Cast & crew (Milestone 4, step 1; Ika, 2026-11-01). Two tables:
--
--   people      one directory per workspace: each person once, with how to reach them, their
--               agent, union, a short bio, a photo, and their usual week (Mon–Sun on or off).
--               `user_id` links someone who has a Nia account.
--   cast_crew   who is on which project, and as what: cast or crew, department, role, the
--               character they play, the episodes or days they're on, their status and notes.
--
-- Who can see what:
--   - workspace members see and add to their workspace's directory;
--   - anyone who can open a project sees its cast and crew, and the people on it (so someone
--     invited to one project sees its crew, not the whole directory);
--   - people who can edit a project add, change and remove (soft delete) its cast and crew.
--
-- Each project's existing Crew & talent list is copied in, so nothing has to be typed again.
-- Run in the Supabase SQL Editor (paste the file's contents). Safe to run again.

create table if not exists public.people (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  email text check (email is null or char_length(email) <= 254),
  phone text check (phone is null or char_length(phone) <= 40),
  agent text check (agent is null or char_length(agent) <= 160),
  union_name text check (union_name is null or char_length(union_name) <= 80),
  bio text check (bio is null or char_length(bio) <= 2000),
  photo_url text check (photo_url is null or char_length(photo_url) <= 1000),
  -- Mon to Sun: true when they're usually available.
  availability boolean[] check (availability is null or array_length(availability, 1) = 7),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists people_workspace_idx on public.people (workspace_id) where deleted_at is null;
create index if not exists people_user_idx on public.people (user_id);
create index if not exists people_created_by_idx on public.people (created_by);

create table if not exists public.cast_crew (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  person_id uuid not null references public.people (id) on delete cascade,
  kind text not null default 'crew' check (kind in ('cast', 'crew')),
  -- Empty means worked out from the role (src/features/crew/directory.ts).
  department text check (department is null or char_length(department) <= 60),
  role text not null check (char_length(btrim(role)) between 1 and 80),
  "character" text check ("character" is null or char_length("character") <= 120),
  episodes text[] not null default '{}' check (cardinality(episodes) <= 60),
  status text not null default 'pending' check (status in ('confirmed', 'pending', 'on-hold', 'wrapped', 'cancelled')),
  notes text check (notes is null or char_length(notes) <= 2000),
  position integer not null default 0,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists cast_crew_project_idx on public.cast_crew (project_id) where deleted_at is null;
create index if not exists cast_crew_person_idx on public.cast_crew (person_id);
create index if not exists cast_crew_created_by_idx on public.cast_crew (created_by);
-- The same person once per role on a project.
create unique index if not exists cast_crew_one_role on public.cast_crew (project_id, person_id, lower(role)) where deleted_at is null;

drop trigger if exists people_updated_at on public.people;
create trigger people_updated_at before update on public.people for each row execute function public.set_updated_at();
drop trigger if exists cast_crew_updated_at on public.cast_crew;
create trigger cast_crew_updated_at before update on public.cast_crew for each row execute function public.set_updated_at();

alter table public.people enable row level security;
alter table public.cast_crew enable row level security;

-- People: the workspace's members, or anyone who can open a project they're on.
drop policy if exists "people: read" on public.people;
create policy "people: read" on public.people for select to authenticated using (
  public.is_workspace_member(workspace_id)
  or exists (
    select 1 from public.cast_crew c
    where c.person_id = people.id and c.deleted_at is null and public.can_view_project(c.project_id)
  )
);
drop policy if exists "people: add" on public.people;
create policy "people: add" on public.people for insert to authenticated with check (public.is_workspace_member(workspace_id));
drop policy if exists "people: change" on public.people;
create policy "people: change" on public.people for update to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

-- Cast & crew: read with the project, change with edit access; the person must be in the
-- project's workspace.
drop policy if exists "cast_crew: read" on public.cast_crew;
create policy "cast_crew: read" on public.cast_crew for select to authenticated using (public.can_view_project(project_id));
drop policy if exists "cast_crew: add" on public.cast_crew;
create policy "cast_crew: add" on public.cast_crew for insert to authenticated with check (
  public.can_edit_project(project_id)
  and exists (
    select 1 from public.people pe join public.projects pr on pr.id = cast_crew.project_id
    where pe.id = cast_crew.person_id and pe.workspace_id = pr.workspace_id
  )
);
drop policy if exists "cast_crew: change" on public.cast_crew;
create policy "cast_crew: change" on public.cast_crew for update to authenticated
  using (public.can_edit_project(project_id))
  with check (public.can_edit_project(project_id));

-- Copy each project's Crew & talent list in: one person per name per workspace, one row per role.
insert into public.people (workspace_id, user_id, name, created_by)
select distinct on (p.workspace_id, lower(btrim(m->>'name')))
  p.workspace_id,
  nullif(m->>'userId', '')::uuid,
  btrim(m->>'name'),
  p.owner_id
from public.projects p, jsonb_array_elements(coalesce(p.crew, '[]'::jsonb)) m
where p.deleted_at is null
  and char_length(btrim(coalesce(m->>'name', ''))) between 1 and 120
  and not exists (
    select 1 from public.people x
    where x.workspace_id = p.workspace_id and lower(x.name) = lower(btrim(m->>'name')) and x.deleted_at is null
  );

insert into public.cast_crew (project_id, person_id, kind, role, status, position, created_by)
select
  p.id,
  pe.id,
  case when m->>'role' ~* '^(talent|model|actor|actress|cast|lead|supporting|featured|starring|performer|artist)$' then 'cast' else 'crew' end,
  left(btrim(m->>'role'), 80),
  'confirmed',
  (ord - 1)::integer,
  p.owner_id
from public.projects p
cross join lateral jsonb_array_elements(coalesce(p.crew, '[]'::jsonb)) with ordinality as e(m, ord)
join public.people pe on pe.workspace_id = p.workspace_id and lower(pe.name) = lower(btrim(m->>'name')) and pe.deleted_at is null
where p.deleted_at is null
  and char_length(btrim(coalesce(m->>'role', ''))) between 1 and 80
on conflict do nothing;
