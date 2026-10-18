-- Nia OS: onboarding (username check, followed creators, workspace invites).
-- Run in Supabase: Dashboard → SQL Editor → New query → paste → Run.
-- Needs 20261018000000_profiles_settings_workspaces.sql first. Safe to run more than once.

-- ---------------------------------------------------------------------------
-- Creators and studios followed in onboarding (sample list for now)
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists followed_creators text[] not null default '{}'
    check (cardinality(followed_creators) <= 100);

-- ---------------------------------------------------------------------------
-- Username availability. Profiles are private (RLS), so this runs as definer
-- and reveals only which of the given names are free (the caller's own counts).
-- ---------------------------------------------------------------------------

create or replace function public.available_usernames(candidates text[])
returns setof text
language sql
stable
security definer
set search_path = ''
as $$
  select c
  from unnest(candidates[1:20]) as c
  where c ~ '^[a-z0-9._]{3,30}$'
    and not exists (
      select 1 from public.profiles p
      where p.username = c and p.id <> (select auth.uid())
    );
$$;

revoke execute on function public.available_usernames(text[]) from public, anon;
grant execute on function public.available_usernames(text[]) to authenticated;

-- ---------------------------------------------------------------------------
-- Workspace invites: stored now, emails sent in a later update
-- ---------------------------------------------------------------------------

create table if not exists public.workspace_invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  email text not null check (char_length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  invited_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (workspace_id, email)
);

alter table public.workspace_invites enable row level security;

drop policy if exists "Owners can view invites" on public.workspace_invites;
create policy "Owners can view invites"
  on public.workspace_invites for select
  to authenticated
  using (public.is_workspace_owner(workspace_id));

drop policy if exists "Owners can invite" on public.workspace_invites;
create policy "Owners can invite"
  on public.workspace_invites for insert
  to authenticated
  with check (public.is_workspace_owner(workspace_id) and invited_by = (select auth.uid()));

drop policy if exists "Owners can cancel invites" on public.workspace_invites;
create policy "Owners can cancel invites"
  on public.workspace_invites for delete
  to authenticated
  using (public.is_workspace_owner(workspace_id));

grant select, insert, delete on public.workspace_invites to authenticated;

-- ---------------------------------------------------------------------------
-- Accounts that existed before onboarding shipped skip it. The app checks the
-- `onboarded` flag in the sign-in token first and falls back to the profile.
-- ---------------------------------------------------------------------------

update public.profiles p
set onboarding_completed_at = coalesce(p.onboarding_completed_at, now())
from auth.users u
where u.id = p.id and u.created_at < '2026-10-18';

update auth.users
set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || '{"onboarded": true}'::jsonb
where created_at < '2026-10-18';
