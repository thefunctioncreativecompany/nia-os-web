-- Early access to Marketplace (Ika, 2026-10-22). Run in Supabase: SQL Editor > paste the whole file > Run.
-- Safe to run twice.
--
-- Marketplace isn't open yet. Someone can see the store (with its sample listings) once they've
-- entered an invite code on Marketplace's coming-soon screen; everyone else sees coming soon.
-- Codes are stored only as a fingerprint (sha256), never in plain text, and this file holds none
-- (the repository is public). Add a code in the SQL Editor:
--   insert into public.marketplace_codes (code_hash, label)
--   values (encode(extensions.digest('YOUR-CODE', 'sha256'), 'hex'), 'What this code is for');
-- Codes are checked in capitals, so type YOUR-CODE in capitals. Turn one off with
--   update public.marketplace_codes set active = false where label = 'What this code is for';
-- Ten wrong codes an hour, then wait.

create extension if not exists pgcrypto with schema extensions;

-- People who unlocked Marketplace with a code.
create table if not exists public.marketplace_access (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Invite codes, as fingerprints. `active = false` turns a code off.
create table if not exists public.marketplace_codes (
  code_hash text primary key,
  label text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Wrong codes, to slow down guessing.
create table if not exists public.marketplace_code_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists marketplace_code_attempts_user_idx on public.marketplace_code_attempts (user_id, created_at);

alter table public.marketplace_access enable row level security;
alter table public.marketplace_codes enable row level security;
alter table public.marketplace_code_attempts enable row level security;

-- Nobody reads or writes these directly; only the functions below do (and Ika in the SQL Editor).
revoke all on public.marketplace_access, public.marketplace_codes, public.marketplace_code_attempts from anon, authenticated;

create or replace function public.has_marketplace_access()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.marketplace_access a where a.user_id = (select auth.uid()));
$$;
revoke execute on function public.has_marketplace_access() from public, anon;
grant execute on function public.has_marketplace_access() to authenticated;

-- Enter an invite code. Returns true when it unlocks Marketplace (or it was already unlocked).
create or replace function public.redeem_marketplace_code(code text)
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
  if (select count(*) from public.marketplace_code_attempts t where t.user_id = me and t.created_at > now() - interval '1 hour') >= 10 then
    raise exception 'Too many tries. Try again in an hour.' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from public.marketplace_codes c
    where c.active and c.code_hash = encode(extensions.digest(upper(btrim(code)), 'sha256'), 'hex')
  ) then
    insert into public.marketplace_access (user_id) values (me) on conflict (user_id) do nothing;
    return true;
  end if;
  insert into public.marketplace_code_attempts (user_id) values (me);
  return false;
end;
$$;
revoke execute on function public.redeem_marketplace_code(text) from public, anon;
grant execute on function public.redeem_marketplace_code(text) to authenticated;
