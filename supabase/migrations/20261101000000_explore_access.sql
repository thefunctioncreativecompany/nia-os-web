-- Early access to Explore (Ika, 2026-10-21). Run in Supabase: SQL Editor > paste the whole file > Run.
-- Safe to run twice. Run after 20261031000000_collections_references.sql.
--
-- Someone can use Explore (browse it, save titles to collections, add them to projects'
-- references) when any of these is true:
--   1. They accepted an email invite from Supabase (Authentication > Users > Invite user) and
--      confirmed their email.
--   2. Their confirmed email is on the invite list (explore_invites). Add people with:
--        insert into public.explore_invites (email) values ('name@example.com');
--   3. They entered an invite code. Codes are stored only as a
--      fingerprint (sha256), never in plain text. Ten wrong codes an hour, then wait.
-- has_explore_access() answers the question for the app and for the database rules below.

create extension if not exists pgcrypto with schema extensions;

-- People who unlocked Explore with a code (invites are checked live, so they aren't stored here).
create table if not exists public.explore_access (
  user_id uuid primary key references auth.users (id) on delete cascade,
  via text not null check (via in ('code', 'invite')),
  created_at timestamptz not null default now()
);

-- Emails invited to Explore, added by Ika in the SQL Editor.
create table if not exists public.explore_invites (
  email text primary key check (email = lower(btrim(email))),
  created_at timestamptz not null default now()
);

-- Invite codes, as fingerprints. `active = false` turns a code off.
create table if not exists public.explore_codes (
  code_hash text primary key,
  label text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Wrong codes, to slow down guessing.
create table if not exists public.explore_code_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists explore_code_attempts_user_idx on public.explore_code_attempts (user_id, created_at);

alter table public.explore_access enable row level security;
alter table public.explore_invites enable row level security;
alter table public.explore_codes enable row level security;
alter table public.explore_code_attempts enable row level security;

-- Nobody reads or writes these directly; only the functions below do (and Ika in the SQL Editor).
revoke all on public.explore_access, public.explore_invites, public.explore_codes, public.explore_code_attempts from anon, authenticated;

-- Add codes in the SQL Editor, never in this file (the repo is public; security review 2026-10-28):
--   insert into public.explore_codes (code_hash, label)
--   values (encode(extensions.digest('YOUR-CODE', 'sha256'), 'hex'), 'What the code is for');

create or replace function public.has_explore_access()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.explore_access a where a.user_id = (select auth.uid()))
      or exists (
        select 1 from auth.users u
        where u.id = (select auth.uid())
          and u.email_confirmed_at is not null
          and (u.invited_at is not null or exists (select 1 from public.explore_invites i where i.email = lower(u.email)))
      );
$$;
revoke execute on function public.has_explore_access() from public, anon;
grant execute on function public.has_explore_access() to authenticated;

-- Enter an invite code. Returns true when it unlocks Explore (or it was already unlocked).
create or replace function public.redeem_explore_code(code text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
begin
  if me is null then
    raise exception 'Sign in to enter a code' using errcode = '42501';
  end if;
  if (select count(*) from public.explore_code_attempts t where t.user_id = me and t.created_at > now() - interval '1 hour') >= 10 then
    raise exception 'Too many tries. Try again in an hour.' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from public.explore_codes c
    where c.active and c.code_hash = encode(extensions.digest(upper(btrim(code)), 'sha256'), 'hex')
  ) then
    insert into public.explore_access (user_id, via) values (me, 'code') on conflict (user_id) do nothing;
    return true;
  end if;
  insert into public.explore_code_attempts (user_id) values (me);
  return false;
end;
$$;
revoke execute on function public.redeem_explore_code(text) from public, anon;
grant execute on function public.redeem_explore_code(text) to authenticated;

-- Saving and adding references need Explore access.
drop policy if exists "You make your collections" on public.collections;
create policy "You make your collections" on public.collections
  for insert to authenticated with check (owner_id = (select auth.uid()) and deleted_at is null and public.has_explore_access());

drop policy if exists "You save into your collections" on public.collection_items;
create policy "You save into your collections" on public.collection_items
  for insert to authenticated with check (
    owner_id = (select auth.uid())
    and deleted_at is null
    and public.has_explore_access()
    and exists (select 1 from public.collections c where c.id = collection_id and c.owner_id = (select auth.uid()) and c.deleted_at is null)
  );

drop policy if exists "Editors add references" on public.project_references;
create policy "Editors add references" on public.project_references
  for insert to authenticated with check (
    added_by = (select auth.uid()) and deleted_at is null and public.can_edit_project(project_id) and public.has_explore_access()
  );
