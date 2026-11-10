-- Explore open to everyone signed in (Ika, 2026-11-10: no invite code for now).
-- Run in Supabase: SQL Editor > paste the whole file > Run. Safe to run twice.
-- Run after 20261101000000_explore_access.sql.
--
-- has_explore_access() is what the database's own rules ask before letting someone save a title
-- to a collection, add one to a project's references, or count a view. Until now it said yes
-- only to people with an invite or a code. This makes it say yes to anyone signed in.
-- Nothing is deleted: the invite list, the codes and who used them stay as they are.
--
-- To go back to invite-only, run the has_explore_access() part of
-- 20261101000000_explore_access.sql again (and switch features.exploreUnlocked off in the app).

create or replace function public.has_explore_access()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null;
$$;
revoke execute on function public.has_explore_access() from public, anon;
grant execute on function public.has_explore_access() to authenticated;
