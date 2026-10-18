-- Nia OS: projects, sharing and activity.
-- Run in Supabase: Dashboard → SQL Editor → New query → paste → Run.
-- Needs the two earlier migrations first. Safe to run more than once.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Every account has a workspace (the team account) that its projects live in.
-- Returns the caller's, creating "My workspace" the first time.
-- ---------------------------------------------------------------------------

create or replace function public.my_workspace_id()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  ws uuid;
begin
  if auth.uid() is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  select id into ws from public.workspaces
  where owner_id = auth.uid() order by created_at limit 1;
  if ws is null then
    insert into public.workspaces (name, owner_id) values ('My workspace', auth.uid())
    returning id into ws;
    insert into public.workspace_members (workspace_id, user_id) values (ws, auth.uid())
    on conflict do nothing;
  end if;
  return ws;
end;
$$;

revoke execute on function public.my_workspace_id() from public, anon;
grant execute on function public.my_workspace_id() to authenticated;

-- Name to show for a person (their profile name, else the start of their email).
create or replace function public.display_name(uid uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(nullif(p.full_name, ''), split_part(u.email, '@', 1), '')
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.id = uid;
$$;

revoke execute on function public.display_name(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Projects
-- ---------------------------------------------------------------------------

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null default '' check (char_length(title) <= 120),
  description text not null default '' check (char_length(description) <= 2000),
  cover_url text check (char_length(cover_url) <= 1000),
  production_type text check (production_type in (
    'Film', 'TV Series', 'Short Film', 'Documentary', 'Music Video', 'Commercial',
    'Interview', 'Behind the Scenes', 'Photo Shoot', 'Live Event')),
  stage text not null default 'Pre-Production' check (stage in (
    'Development', 'Pre-Production', 'In Production', 'Post-Production', 'Wrapped')),
  -- Production Info (free text, as producers write it: "July 2026", "3 minutes").
  production_date text not null default '' check (char_length(production_date) <= 80),
  duration text not null default '' check (char_length(duration) <= 80),
  director text not null default '' check (char_length(director) <= 200),
  writers text not null default '' check (char_length(writers) <= 200),
  genres text not null default '' check (char_length(genres) <= 200),
  stars text not null default '' check (char_length(stars) <= 300),
  -- Set while "Anyone with the link can view" is on.
  share_token text unique,
  updated_by uuid references auth.users (id) on delete set null,
  updated_by_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Soft delete: hidden everywhere, kept for Trash.
  deleted_at timestamptz
);

create index if not exists projects_workspace_id_idx on public.projects (workspace_id);
create index if not exists projects_owner_id_idx on public.projects (owner_id);
create index if not exists projects_updated_at_idx on public.projects (updated_at desc);

create table if not exists public.project_members (
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('editor', 'viewer')),
  invited_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create index if not exists project_members_user_id_idx on public.project_members (user_id);

-- People invited by email who don't have an account yet; they join on sign-up.
create table if not exists public.project_invites (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  email text not null check (char_length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  role text not null check (role in ('editor', 'viewer')),
  invited_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (project_id, email)
);

create index if not exists project_invites_email_idx on public.project_invites (email);

-- One row per change, shown in Recent Activity.
create table if not exists public.activity (
  id bigint generated always as identity primary key,
  project_id uuid not null references public.projects (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  actor_name text not null default '',
  action text not null check (action in (
    'created', 'renamed', 'updated', 'cover_changed', 'shared', 'unshared',
    'link_on', 'link_off', 'deleted')),
  detail text not null default '' check (char_length(detail) <= 200),
  created_at timestamptz not null default now()
);

create index if not exists activity_project_created_idx on public.activity (project_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Who can see and change a project: its workspace, plus the people it's shared with.
-- ---------------------------------------------------------------------------

create or replace function public.can_view_project(pid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.projects p
    where p.id = pid and p.deleted_at is null and (
      p.owner_id = (select auth.uid())
      or public.is_workspace_owner(p.workspace_id)
      or public.is_workspace_member(p.workspace_id)
      or exists (
        select 1 from public.project_members m
        where m.project_id = p.id and m.user_id = (select auth.uid())
      )
    )
  );
$$;

create or replace function public.can_edit_project(pid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.projects p
    where p.id = pid and p.deleted_at is null and (
      p.owner_id = (select auth.uid())
      or public.is_workspace_owner(p.workspace_id)
      or public.is_workspace_member(p.workspace_id)
      or exists (
        select 1 from public.project_members m
        where m.project_id = p.id and m.user_id = (select auth.uid()) and m.role = 'editor'
      )
    )
  );
$$;

create or replace function public.is_project_owner(pid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.projects p
    where p.id = pid and p.deleted_at is null and p.owner_id = (select auth.uid())
  );
$$;

alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.project_invites enable row level security;
alter table public.activity enable row level security;

drop policy if exists "People with access can view projects" on public.projects;
create policy "People with access can view projects"
  on public.projects for select
  to authenticated
  -- The owner check also covers a row being inserted, which the function can't see yet.
  using ((owner_id = (select auth.uid()) and deleted_at is null) or public.can_view_project(id));

drop policy if exists "Workspace members can create projects" on public.projects;
create policy "Workspace members can create projects"
  on public.projects for insert
  to authenticated
  with check (
    owner_id = (select auth.uid())
    and (public.is_workspace_owner(workspace_id) or public.is_workspace_member(workspace_id))
  );

drop policy if exists "Editors can update projects" on public.projects;
create policy "Editors can update projects"
  on public.projects for update
  to authenticated
  using (public.can_edit_project(id))
  with check (public.can_edit_project(id));

drop policy if exists "Members can see who else is on a project" on public.project_members;
create policy "Members can see who else is on a project"
  on public.project_members for select
  to authenticated
  using (public.can_view_project(project_id));

drop policy if exists "Owners can see pending invites" on public.project_invites;
create policy "Owners can see pending invites"
  on public.project_invites for select
  to authenticated
  using (public.is_project_owner(project_id));

drop policy if exists "People with access can view activity" on public.activity;
create policy "People with access can view activity"
  on public.activity for select
  to authenticated
  using (public.can_view_project(project_id));

-- Clients read and edit projects directly; members, invites, deletes and the share
-- link only change through the owner-only functions below.
grant select, insert, update on public.projects to authenticated;
grant select on public.project_members, public.project_invites, public.activity to authenticated;

-- ---------------------------------------------------------------------------
-- Guards and bookkeeping on every project write
-- ---------------------------------------------------------------------------

create or replace function public.projects_before_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.owner_id = auth.uid();
    new.share_token = null;
    new.deleted_at = null;
    new.created_at = now();
  elsif coalesce(current_setting('nia.trusted', true), '') <> 'on' and (
      new.owner_id is distinct from old.owner_id
      or new.workspace_id is distinct from old.workspace_id
      or new.share_token is distinct from old.share_token
      or new.deleted_at is distinct from old.deleted_at
      or new.created_at is distinct from old.created_at) then
    raise exception 'That change isn''t allowed here' using errcode = '42501';
  end if;
  new.updated_at = now();
  new.updated_by = auth.uid();
  new.updated_by_name = coalesce(public.display_name(auth.uid()), '');
  return new;
end;
$$;

drop trigger if exists projects_before_write on public.projects;
create trigger projects_before_write
  before insert or update on public.projects
  for each row execute function public.projects_before_write();

create or replace function public.log_activity(pid uuid, act text, info text default '')
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  recent bigint;
begin
  -- Several quick edits by the same person collapse into one "updated" line.
  if act = 'updated' then
    select id into recent from public.activity
    where project_id = pid and actor_id = auth.uid() and action = 'updated'
      and created_at > now() - interval '10 minutes'
    order by created_at desc limit 1;
    if recent is not null then
      update public.activity set created_at = now() where id = recent;
      return;
    end if;
  end if;
  insert into public.activity (project_id, actor_id, actor_name, action, detail)
  values (pid, auth.uid(), coalesce(public.display_name(auth.uid()), ''), act, left(coalesce(info, ''), 200));
end;
$$;

revoke execute on function public.log_activity(uuid, text, text) from public, anon, authenticated;

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
         old.director, old.writers, old.genres, old.stars)
        is distinct from
        (new.description, new.production_type, new.stage, new.production_date, new.duration,
         new.director, new.writers, new.genres, new.stars) then
    perform public.log_activity(new.id, 'updated');
  end if;
  return null;
end;
$$;

drop trigger if exists projects_after_write on public.projects;
create trigger projects_after_write
  after insert or update on public.projects
  for each row execute function public.projects_after_write();

-- ---------------------------------------------------------------------------
-- Owner-only actions
-- ---------------------------------------------------------------------------

create or replace function public.soft_delete_project(pid uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_project_owner(pid) then
    raise exception 'Only the project owner can delete it' using errcode = '42501';
  end if;
  perform set_config('nia.trusted', 'on', true);
  update public.projects set deleted_at = now() where id = pid;
  perform set_config('nia.trusted', 'off', true);
end;
$$;

-- Turns "Anyone with the link can view" on or off; returns the link's token.
create or replace function public.set_project_link(pid uuid, enabled boolean)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  token text;
begin
  if not public.is_project_owner(pid) then
    raise exception 'Only the project owner can change the link' using errcode = '42501';
  end if;
  select share_token into token from public.projects where id = pid;
  if enabled and token is null then
    token = translate(encode(extensions.gen_random_bytes(24), 'base64'), '+/=', '-_');
  elsif not enabled then
    token = null;
  end if;
  perform set_config('nia.trusted', 'on', true);
  update public.projects set share_token = token where id = pid and share_token is distinct from token;
  perform set_config('nia.trusted', 'off', true);
  return token;
end;
$$;

-- Gives someone access by email. Existing accounts join now ('member'); anyone else
-- is invited and joins when they sign up with that email ('invited').
create or replace function public.share_project(pid uuid, invitee_email text, invitee_role text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  clean text = lower(trim(invitee_email));
  invitee uuid;
begin
  if not public.is_project_owner(pid) then
    raise exception 'Only the project owner can share it' using errcode = '42501';
  end if;
  if invitee_role not in ('editor', 'viewer') then
    raise exception 'Choose Can edit or Can view' using errcode = '22023';
  end if;
  if clean !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Enter a valid email address' using errcode = '22023';
  end if;
  select id into invitee from auth.users where lower(email) = clean;
  if invitee = auth.uid() then
    raise exception 'You already own this project' using errcode = '22023';
  end if;
  if invitee is not null then
    insert into public.project_members (project_id, user_id, role, invited_by)
    values (pid, invitee, invitee_role, auth.uid())
    on conflict (project_id, user_id) do update set role = excluded.role;
    perform public.log_activity(pid, 'shared', coalesce(public.display_name(invitee), clean));
    return 'member';
  end if;
  insert into public.project_invites (project_id, email, role, invited_by)
  values (pid, clean, invitee_role, auth.uid())
  on conflict (project_id, email) do update set role = excluded.role;
  perform public.log_activity(pid, 'shared', clean);
  return 'invited';
end;
$$;

create or replace function public.set_project_role(pid uuid, target_user uuid, target_email text, new_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_project_owner(pid) then
    raise exception 'Only the project owner can change access' using errcode = '42501';
  end if;
  if new_role not in ('editor', 'viewer') then
    raise exception 'Choose Can edit or Can view' using errcode = '22023';
  end if;
  if target_user is not null then
    update public.project_members set role = new_role where project_id = pid and user_id = target_user;
  else
    update public.project_invites set role = new_role where project_id = pid and email = lower(target_email);
  end if;
end;
$$;

create or replace function public.remove_project_access(pid uuid, target_user uuid, target_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_project_owner(pid) then
    raise exception 'Only the project owner can change access' using errcode = '42501';
  end if;
  if target_user is not null then
    delete from public.project_members where project_id = pid and user_id = target_user;
    perform public.log_activity(pid, 'unshared', coalesce(public.display_name(target_user), ''));
  else
    delete from public.project_invites where project_id = pid and email = lower(target_email);
    perform public.log_activity(pid, 'unshared', lower(target_email));
  end if;
end;
$$;

-- Everyone with access, for the Share dialog: owner, members, then pending invites.
create or replace function public.project_people(pid uuid)
returns table (kind text, user_id uuid, name text, email text, avatar_url text, role text)
language sql
stable
security definer
set search_path = ''
as $$
  select * from (
    select 'owner'::text, u.id, public.display_name(u.id), u.email::text, pr.avatar_url, 'owner'::text
    from public.projects p
    join auth.users u on u.id = p.owner_id
    left join public.profiles pr on pr.id = u.id
    where p.id = pid
    union all
    select 'member', u.id, public.display_name(u.id), u.email::text, pr.avatar_url, m.role
    from public.project_members m
    join auth.users u on u.id = m.user_id
    left join public.profiles pr on pr.id = u.id
    where m.project_id = pid
    union all
    select 'invite', null, i.email, i.email, null, i.role
    from public.project_invites i
    where i.project_id = pid and public.is_project_owner(pid)
  ) people
  where public.can_view_project(pid);
$$;

-- The read-only page behind a share link. Open to anyone holding the token.
create or replace function public.shared_project(token text)
returns table (
  title text, description text, cover_url text, production_type text, stage text,
  production_date text, duration text, director text, writers text, genres text,
  stars text, owner_name text, updated_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select p.title, p.description, p.cover_url, p.production_type, p.stage,
         p.production_date, p.duration, p.director, p.writers, p.genres, p.stars,
         public.display_name(p.owner_id), p.updated_at
  from public.projects p
  where char_length(token) >= 24 and p.share_token = token and p.deleted_at is null;
$$;

revoke execute on function public.soft_delete_project(uuid) from public, anon;
revoke execute on function public.set_project_link(uuid, boolean) from public, anon;
revoke execute on function public.share_project(uuid, text, text) from public, anon;
revoke execute on function public.set_project_role(uuid, uuid, text, text) from public, anon;
revoke execute on function public.remove_project_access(uuid, uuid, text) from public, anon;
revoke execute on function public.project_people(uuid) from public, anon;
grant execute on function public.soft_delete_project(uuid) to authenticated;
grant execute on function public.set_project_link(uuid, boolean) to authenticated;
grant execute on function public.share_project(uuid, text, text) to authenticated;
grant execute on function public.set_project_role(uuid, uuid, text, text) to authenticated;
grant execute on function public.remove_project_access(uuid, uuid, text) to authenticated;
grant execute on function public.project_people(uuid) to authenticated;
grant execute on function public.shared_project(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Invites turn into access once the invited email is confirmed
-- ---------------------------------------------------------------------------

create or replace function public.accept_project_invites()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email_confirmed_at is not null
     and (tg_op = 'INSERT' or old.email_confirmed_at is null) then
    insert into public.project_members (project_id, user_id, role, invited_by)
    select i.project_id, new.id, i.role, i.invited_by
    from public.project_invites i
    where i.email = lower(new.email)
    on conflict (project_id, user_id) do nothing;
    delete from public.project_invites where email = lower(new.email);
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_invites_insert on auth.users;
create trigger on_auth_user_invites_insert
  after insert on auth.users
  for each row execute function public.accept_project_invites();

drop trigger if exists on_auth_user_invites_confirm on auth.users;
create trigger on_auth_user_invites_confirm
  after update of email_confirmed_at on auth.users
  for each row execute function public.accept_project_invites();

-- ---------------------------------------------------------------------------
-- Cover stills: public "project-covers" bucket, one folder per project; editors write.
-- ---------------------------------------------------------------------------

create or replace function public.can_edit_project_path(path text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  folder text = (storage.foldername(path))[1];
begin
  if folder is null or folder !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;
  return public.can_edit_project(folder::uuid);
end;
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('project-covers', 'project-covers', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Editors can view project cover files" on storage.objects;
create policy "Editors can view project cover files"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'project-covers' and public.can_edit_project_path(name));

drop policy if exists "Editors can upload project covers" on storage.objects;
create policy "Editors can upload project covers"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'project-covers' and public.can_edit_project_path(name));

drop policy if exists "Editors can replace project covers" on storage.objects;
create policy "Editors can replace project covers"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'project-covers' and public.can_edit_project_path(name));

drop policy if exists "Editors can remove project covers" on storage.objects;
create policy "Editors can remove project covers"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'project-covers' and public.can_edit_project_path(name));
