-- Nia OS: profiles, user settings and workspaces.
-- Run in Supabase: Dashboard → SQL Editor → New query → paste → Run.
-- Safe to run more than once.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles: one row per user (Settings → Profile, onboarding answers)
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 80),
  role text not null default '' check (char_length(role) <= 80),
  phone text not null default '' check (char_length(phone) <= 40),
  bio text not null default '' check (char_length(bio) <= 500),
  avatar_url text,
  assistant_name text not null default '' check (char_length(assistant_name) <= 40),
  assistant_traits text[] not null default '{}' check (cardinality(assistant_traits) <= 20),
  communication_style text not null default 'Professional & Concise'
    check (char_length(communication_style) <= 60),
  ai_suggestions boolean not null default true,
  -- Onboarding
  username text unique check (username ~ '^[a-z0-9._]{3,30}$'),
  profession text check (char_length(profession) <= 60),
  heard_about text check (char_length(heard_about) <= 40),
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

grant select, update on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- User settings: preferences from Settings → General / Notifications
-- ---------------------------------------------------------------------------

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  default_view text not null default 'grid' check (default_view in ('grid', 'list')),
  language text not null default 'en-US' check (char_length(language) <= 10),
  -- IANA name, e.g. America/Los_Angeles. Null = use the browser's time zone.
  time_zone text check (char_length(time_zone) <= 64),
  email_notifications boolean not null default true,
  push_notifications boolean not null default true,
  weekly_digest boolean not null default true,
  -- Per-type choices from Settings → Notifications.
  notification_preferences jsonb not null default '{}'::jsonb,
  auto_save_interval integer not null default 5 check (auto_save_interval in (1, 5, 10, 15, 30)),
  version_history boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists user_settings_set_updated_at on public.user_settings;
create trigger user_settings_set_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();

alter table public.user_settings enable row level security;

drop policy if exists "Users can view their own settings" on public.user_settings;
create policy "Users can view their own settings"
  on public.user_settings for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own settings" on public.user_settings;
create policy "Users can update their own settings"
  on public.user_settings for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, update on public.user_settings to authenticated;

-- ---------------------------------------------------------------------------
-- Workspaces and members
-- ---------------------------------------------------------------------------

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  owner_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workspaces_owner_id_idx on public.workspaces (owner_id);

drop trigger if exists workspaces_set_updated_at on public.workspaces;
create trigger workspaces_set_updated_at
  before update on public.workspaces
  for each row execute function public.set_updated_at();

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default '' check (char_length(role) <= 80),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create index if not exists workspace_members_user_id_idx on public.workspace_members (user_id);

-- Security definer so the policies below don't recurse into each other.
create or replace function public.is_workspace_member(ws uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = ws and m.user_id = (select auth.uid())
  );
$$;

create or replace function public.is_workspace_owner(ws uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.workspaces w
    where w.id = ws and w.owner_id = (select auth.uid())
  );
$$;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;

drop policy if exists "Members can view their workspaces" on public.workspaces;
create policy "Members can view their workspaces"
  on public.workspaces for select
  to authenticated
  using (owner_id = (select auth.uid()) or public.is_workspace_member(id));

drop policy if exists "Users can create workspaces they own" on public.workspaces;
create policy "Users can create workspaces they own"
  on public.workspaces for insert
  to authenticated
  with check (owner_id = (select auth.uid()));

drop policy if exists "Owners can update their workspaces" on public.workspaces;
create policy "Owners can update their workspaces"
  on public.workspaces for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "Owners can delete their workspaces" on public.workspaces;
create policy "Owners can delete their workspaces"
  on public.workspaces for delete
  to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists "Members can view fellow members" on public.workspace_members;
create policy "Members can view fellow members"
  on public.workspace_members for select
  to authenticated
  using (public.is_workspace_member(workspace_id) or public.is_workspace_owner(workspace_id));

drop policy if exists "Owners can add members" on public.workspace_members;
create policy "Owners can add members"
  on public.workspace_members for insert
  to authenticated
  with check (public.is_workspace_owner(workspace_id));

drop policy if exists "Members can update their own role" on public.workspace_members;
create policy "Members can update their own role"
  on public.workspace_members for update
  to authenticated
  using (user_id = (select auth.uid()) or public.is_workspace_owner(workspace_id))
  with check (user_id = (select auth.uid()) or public.is_workspace_owner(workspace_id));

drop policy if exists "Owners can remove members" on public.workspace_members;
create policy "Owners can remove members"
  on public.workspace_members for delete
  to authenticated
  using (public.is_workspace_owner(workspace_id) or user_id = (select auth.uid()));

grant select, insert, update, delete on public.workspaces to authenticated;
grant select, insert, update, delete on public.workspace_members to authenticated;

-- ---------------------------------------------------------------------------
-- New users get a profile and settings row automatically
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''), 80),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (id) do nothing;

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill accounts created before this migration.
insert into public.profiles (id, full_name, avatar_url)
select
  u.id,
  left(coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', ''), 80),
  coalesce(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture')
from auth.users u
on conflict (id) do nothing;

insert into public.user_settings (user_id)
select u.id from auth.users u
on conflict (user_id) do nothing;

-- ---------------------------------------------------------------------------
-- Profile photos: public "avatars" bucket, each user writes only to <their id>/
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png'])
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users can update their own avatar" on storage.objects;
create policy "Users can update their own avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users can delete their own avatar" on storage.objects;
create policy "Users can delete their own avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
