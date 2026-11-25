-- Desktop notifications when Nia is closed (FEEDBACK D6 step 2, Ika 2026-11-25). Run in Supabase:
-- SQL Editor > paste the whole file > Run. Safe to run twice. Changes no existing data.
--
-- When someone turns on Desktop notifications (Settings → General), their browser gives Nia an
-- address to send notices to on that computer (its "push subscription"). This keeps those
-- addresses, one row per computer and browser. Nia's server reads them (with its secret key) when
-- a notification is made, and sends the notice there.
-- People never read or change the table directly: two functions save and remove their own.
-- Rows are deleted, not soft-deleted: an address that's turned off is useless and personal.

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique check (endpoint like 'https://%' and char_length(endpoint) <= 1000),
  p256dh text not null check (char_length(p256dh) <= 200),
  auth text not null check (char_length(auth) <= 100),
  created_at timestamptz not null default now()
);
create index if not exists push_subscriptions_user on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;
revoke all on public.push_subscriptions from anon, authenticated;
-- No policies: only the functions below (and Nia's server) touch it.

-- Saves this browser's address for the signed-in person. A browser has one address: if another
-- account on the same computer turned notices on before, the address moves to this one.
create or replace function public.save_push_subscription(sub_endpoint text, sub_p256dh text, sub_auth text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in first' using errcode = '42501';
  end if;
  insert into public.push_subscriptions (user_id, endpoint, p256dh, auth)
  values ((select auth.uid()), sub_endpoint, sub_p256dh, sub_auth)
  on conflict on constraint push_subscriptions_endpoint_key do update
    set user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth, created_at = now();
end;
$$;
revoke execute on function public.save_push_subscription(text, text, text) from public, anon;
grant execute on function public.save_push_subscription(text, text, text) to authenticated;

-- Removes it (turning notices off, or Log out). Only your own.
create or replace function public.remove_push_subscription(sub_endpoint text)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.push_subscriptions s
  where s.endpoint = sub_endpoint and s.user_id = (select auth.uid());
$$;
revoke execute on function public.remove_push_subscription(text) from public, anon;
grant execute on function public.remove_push_subscription(text) to authenticated;
