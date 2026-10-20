-- "Notify me" on coming-soon screens (Explore first, Ika's design 2026-10-19): who asked to hear
-- when a feature opens. Each person sees and changes only their own rows. Safe to run twice.

create table if not exists public.feature_waitlist (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  feature text not null check (feature in ('explore', 'inbox', 'pro')),
  created_at timestamptz not null default now(),
  primary key (user_id, feature)
);
alter table public.feature_waitlist enable row level security;

drop policy if exists "Own waitlist rows" on public.feature_waitlist;
create policy "Own waitlist rows" on public.feature_waitlist
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

revoke all on public.feature_waitlist from anon;
grant select, insert, delete on public.feature_waitlist to authenticated;
