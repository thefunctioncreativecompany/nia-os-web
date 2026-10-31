-- Top 10 on Explore (Ika, 2026-10-31): replaces "Top 10 director's notes" with what people on
-- Nia actually open, save and add to their projects. Each person's own rows stay private (the
-- tables' rules don't change); this function returns only totals per title, never who did what.
--
-- For each Explore title or creator film with any activity in the last `days` days:
--   viewers         people who opened it (each person once)
--   recent_viewers  of those, the ones who opened it in the last 7 days
--   saves           times it was saved to a collection
--   adds            times it was added to a project as a reference
-- The app weighs these into a ranking (src/features/explore/top.ts).
--
-- Run in the Supabase SQL Editor. Safe to run again.

create or replace function public.explore_top(days integer default 30)
returns table (slug text, viewers integer, recent_viewers integer, saves integer, adds integer)
language sql
stable
security definer
set search_path = ''
as $$
  with since as (
    select now() - make_interval(days => least(greatest(days, 1), 365)) as at
  ),
  viewed as (
    select v.slug,
           count(*)::integer as viewers,
           count(*) filter (where v.viewed_at > now() - interval '7 days')::integer as recent_viewers
    from public.explore_views v, since
    where v.viewed_at > since.at
    group by v.slug
  ),
  saved as (
    select i.title_slug as slug, count(*)::integer as saves
    from public.collection_items i, since
    where i.deleted_at is null and i.created_at > since.at
    group by i.title_slug
  ),
  added as (
    select r.title_slug as slug, count(*)::integer as adds
    from public.project_references r, since
    where r.deleted_at is null and r.created_at > since.at
    group by r.title_slug
  )
  select s.slug,
         coalesce(v.viewers, 0),
         coalesce(v.recent_viewers, 0),
         coalesce(sv.saves, 0),
         coalesce(a.adds, 0)
  from (select viewed.slug from viewed union select saved.slug from saved union select added.slug from added) s
  left join viewed v on v.slug = s.slug
  left join saved sv on sv.slug = s.slug
  left join added a on a.slug = s.slug
  -- Only people who can see Explore get its rankings.
  where public.has_explore_access()
$$;

revoke all on function public.explore_top(integer) from public, anon;
grant execute on function public.explore_top(integer) to authenticated;
