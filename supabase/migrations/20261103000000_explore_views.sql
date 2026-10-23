-- Recently viewed on Explore (Ika, 2026-10-22). Run in Supabase: SQL Editor > paste the whole file > Run.
-- Safe to run twice. Run after 20261101000000_explore_access.sql.
--
-- Explore remembers which titles and creators' films each person opens, so its "Recently viewed"
-- sort can bring them back first, on any device. One row per person and item: when they last
-- opened it and how many times. People see only their own views. Views are recorded through
-- record_explore_view(), never written to the table directly.

create table if not exists public.explore_views (
  user_id uuid not null references auth.users (id) on delete cascade,
  -- An Explore item's slug: a Made in Africa title ("atlantics") or a creator's film
  -- ("creator-DDzBw_xKbKm").
  slug text not null check (char_length(slug) between 1 and 120),
  viewed_at timestamptz not null default now(),
  views integer not null default 1 check (views > 0),
  primary key (user_id, slug)
);

-- "Recently viewed" reads a person's views newest first.
create index if not exists explore_views_recent on public.explore_views (user_id, viewed_at desc);

alter table public.explore_views enable row level security;

-- Read your own views; nothing else, and no direct writes.
revoke all on public.explore_views from anon, authenticated;
grant select on public.explore_views to authenticated;

drop policy if exists "You see your own views" on public.explore_views;
create policy "You see your own views" on public.explore_views
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- Records that the signed-in person opened an item: adds it, or moves it to the top and counts
-- the visit. Only for people with Explore access.
create or replace function public.record_explore_view(item text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not public.has_explore_access() then
    return;
  end if;
  if item is null or char_length(item) not between 1 and 120 then
    raise exception 'That item name isn''t valid.';
  end if;
  insert into public.explore_views (user_id, slug)
  values ((select auth.uid()), item)
  on conflict (user_id, slug) do update
    set viewed_at = now(), views = public.explore_views.views + 1;
end;
$$;

revoke execute on function public.record_explore_view(text) from public, anon;
grant execute on function public.record_explore_view(text) to authenticated;
