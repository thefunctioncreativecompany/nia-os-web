-- Meetings on a project (docs/MEETINGS_SPEC.md, step 1; Ika 2026-11-18): notes from a production
-- meeting (pre-production, recce, client call), uploaded from any notetaker (Otter, Fireflies,
-- Granola, Gemini, Zoom, Teams) or pasted. Each meeting keeps a summary (Markdown, editable, with
-- the original kept for "Restore original") and a transcript (who said what, and when; read-only).
-- Run in Supabase: SQL Editor > paste the whole file > Run. Safe to run twice. Run after
-- 20261020000000_projects.sql.
--
-- Who sees them (Ika, 2026-11-18): only people who can edit the project. Notes are often personal
-- (money, health, visas), so viewers and view-only share links never see them. Removing is a
-- soft delete.

create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  -- The day it happened, as "2026-11-18" (like every date in Nia); null when the notes didn't say.
  -- Meetings booked through Google Meet (step 3) add their start time.
  held_on date,
  -- How it got here: uploaded or pasted notes now; meetings booked through Google Meet later (step 3).
  source text not null default 'upload' check (source in ('upload', 'google_meet')),
  -- The notetaker the notes came from, as shown ("Otter", "Granola"…); null when unknown.
  source_app text check (char_length(source_app) <= 40),
  -- The uploaded file's name (the file itself isn't kept: its words are).
  file_name text check (char_length(file_name) <= 255),
  -- The people in it: [{ "name": "…" }], from the transcript's speakers.
  attendees jsonb not null default '[]'::jsonb check (jsonb_typeof(attendees) = 'array'),
  summary text not null default '' check (char_length(summary) <= 100000),
  original_summary text not null default '' check (char_length(original_summary) <= 100000),
  -- [{ "speaker": "…", "at": seconds or null, "text": "…" }]
  transcript jsonb not null default '[]'::jsonb check (jsonb_typeof(transcript) = 'array' and pg_column_size(transcript) <= 2000000),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- A project's meetings, newest first, the way the Documents tab lists them.
create index if not exists meetings_project_idx on public.meetings (project_id, held_on desc nulls last, created_at desc) where deleted_at is null;

alter table public.meetings enable row level security;

drop policy if exists "Editors see the project's meetings" on public.meetings;
create policy "Editors see the project's meetings" on public.meetings
  for select to authenticated using (deleted_at is null and public.can_edit_project(project_id));

drop policy if exists "Editors add meetings" on public.meetings;
create policy "Editors add meetings" on public.meetings
  for insert to authenticated with check (created_by = (select auth.uid()) and deleted_at is null and public.can_edit_project(project_id));

drop policy if exists "Editors change meetings" on public.meetings;
create policy "Editors change meetings" on public.meetings
  for update to authenticated using (deleted_at is null and public.can_edit_project(project_id)) with check (public.can_edit_project(project_id));

-- What may change: the title, the date, who was there and the summary. Never the project, the
-- original summary or the transcript (the record of what was said).
revoke all on public.meetings from anon, authenticated;
grant select, insert on public.meetings to authenticated;
grant update (title, held_on, attendees, summary, source_app, updated_at) on public.meetings to authenticated;

-- Removing one (soft). A plain update can't: removed rows are hidden from everyone, so Postgres
-- rejects the update that would hide one (as with milestones, 20261119000000_project_milestones.sql).
create or replace function public.remove_meeting(meeting_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.meetings m
    where m.id = meeting_id and m.deleted_at is null and public.can_edit_project(m.project_id)
  ) then
    raise exception 'Only people who can edit this project can remove its meetings' using errcode = '42501';
  end if;
  update public.meetings set deleted_at = now(), updated_at = now() where id = meeting_id;
end;
$$;
revoke execute on function public.remove_meeting(uuid) from public, anon;
grant execute on function public.remove_meeting(uuid) to authenticated;
