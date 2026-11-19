-- Google Calendar and Meet (docs/MEETINGS_SPEC.md, step 3; Ika 2026-11-18): a producer connects
-- their Google Calendar once, then books production meetings from a project: Nia creates the
-- Calendar event with a Google Meet link and the invites. Run in Supabase: SQL Editor > paste the
-- whole file > Run. Safe to run twice. Run after 20261121000000_meeting_proposals.sql.

-- 1. Who has connected Google, and the key that lets Nia act for them. The key (a Google refresh
-- token) is encrypted by the app before it's stored, and only the server writes or reads it (with
-- the secret key, which passes these rules). People see only that they're connected, and as whom.
create table if not exists public.google_connections (
  user_id uuid primary key references auth.users (id) on delete cascade,
  google_email text not null check (char_length(google_email) <= 320),
  scopes text not null default '' check (char_length(scopes) <= 1000),
  refresh_token_enc text not null check (char_length(refresh_token_enc) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.google_connections enable row level security;

drop policy if exists "People see their own Google connection" on public.google_connections;
create policy "People see their own Google connection" on public.google_connections
  for select to authenticated using (user_id = (select auth.uid()));

revoke all on public.google_connections from anon, authenticated;
-- Never the key: only whether, as whom and since when.
grant select (user_id, google_email, scopes, created_at) on public.google_connections to authenticated;

-- 2. A meeting booked through Google: when it starts and ends, its Calendar event and Meet link.
alter table public.meetings add column if not exists starts_at timestamptz;
alter table public.meetings add column if not exists ends_at timestamptz;
alter table public.meetings add column if not exists calendar_event_id text check (char_length(calendar_event_id) <= 1024);
alter table public.meetings add column if not exists meet_link text check (meet_link ~ '^https://meet\.google\.com/[a-z0-9-]+$');

-- The booking is saved first (the rules check the person can edit the project), then the Calendar
-- event's details are added to it.
grant update (starts_at, ends_at, calendar_event_id, meet_link) on public.meetings to authenticated;
