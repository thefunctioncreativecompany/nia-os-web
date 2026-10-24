-- Feedback for the MVP pilot (Ika, 2026-10-23): what testers tell us, and what they do.
--
-- feedback: notes sent from "Send feedback" (what kind, what they wrote, the page, an optional
--   screenshot), and one-tap answers to the short question shown after a job is first done
--   ("Did this save you time?", kind 'pulse', with the job and a thumbs up or down).
-- product_events: the production jobs people do in Nia (a project made, a document started or
--   downloaded, crew invited, a file uploaded, a reference added), so each ICP's path through
--   the product can be counted.
-- feedback_review: every note with the tester's name and profession, for reading in the SQL
--   Editor. Testers can't open it.
--
-- Each person adds and sees only their own rows; nobody can change or remove them from the app.
-- Screenshots go in the private "feedback" bucket, in a folder per person. Safe to run twice.

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('broken', 'confusing', 'idea', 'other', 'pulse')),
  message text check (char_length(message) <= 2000),
  -- The page it was sent from, e.g. /projects/<id>.
  page text check (char_length(page) <= 300),
  -- For 'pulse': which job the question followed, and the answer (1 yes, -1 not really).
  job text check (char_length(job) <= 60),
  rating smallint check (rating in (-1, 1)),
  screenshot_path text check (char_length(screenshot_path) <= 300),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (kind <> 'pulse' or (job is not null and rating is not null)),
  check (kind = 'pulse' or char_length(coalesce(message, '')) > 0)
);
create index if not exists feedback_created_idx on public.feedback (created_at desc);
create index if not exists feedback_user_idx on public.feedback (user_id);
alter table public.feedback enable row level security;

drop policy if exists "Own feedback" on public.feedback;
create policy "Own feedback" on public.feedback
  for select to authenticated
  using (user_id = (select auth.uid()) and deleted_at is null);
drop policy if exists "Send feedback" on public.feedback;
create policy "Send feedback" on public.feedback
  for insert to authenticated
  with check (user_id = (select auth.uid()));

revoke all on public.feedback from anon, authenticated;
grant select, insert on public.feedback to authenticated;

create table if not exists public.product_events (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (name in (
    'project_created', 'document_created', 'document_downloaded',
    'crew_invited', 'file_uploaded', 'reference_added'
  )),
  project_id uuid references public.projects (id) on delete set null,
  -- Small details, e.g. {"template": "D01"} or {"format": "pdf"}.
  props jsonb not null default '{}' check (pg_column_size(props) <= 2000),
  created_at timestamptz not null default now()
);
create index if not exists product_events_name_idx on public.product_events (name, created_at desc);
create index if not exists product_events_user_idx on public.product_events (user_id);
create index if not exists product_events_project_idx on public.product_events (project_id);
alter table public.product_events enable row level security;

drop policy if exists "Own events" on public.product_events;
create policy "Own events" on public.product_events
  for select to authenticated
  using (user_id = (select auth.uid()));
drop policy if exists "Record events" on public.product_events;
create policy "Record events" on public.product_events
  for insert to authenticated
  with check (user_id = (select auth.uid()));

revoke all on public.product_events from anon, authenticated;
grant select, insert on public.product_events to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('feedback', 'feedback', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Upload own feedback screenshots') then
    create policy "Upload own feedback screenshots" on storage.objects
      for insert to authenticated
      with check (bucket_id = 'feedback' and (storage.foldername(name))[1] = (select auth.uid())::text);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Open own feedback screenshots') then
    create policy "Open own feedback screenshots" on storage.objects
      for select to authenticated
      using (bucket_id = 'feedback' and (storage.foldername(name))[1] = (select auth.uid())::text);
  end if;
end $$;

-- For the team, in the SQL Editor: newest first, with who sent it and their profession.
create or replace view public.feedback_review with (security_invoker = true) as
  select f.created_at, f.kind, f.message, f.page, f.job, f.rating, f.screenshot_path,
         p.full_name, p.username, p.profession, f.user_id, f.id
  from public.feedback f
  left join public.profiles p on p.id = f.user_id
  where f.deleted_at is null
  order by f.created_at desc;
revoke all on public.feedback_review from anon, authenticated;
