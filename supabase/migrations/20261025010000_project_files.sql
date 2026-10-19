-- Project files (BUILD_PLAN 2.4 / 3.2 References, Ika 2026-10-19): upload stills, documents,
-- voice memos and video to a project; shown on the project page sorted by kind. Private
-- "project-files" bucket, one folder per project, 50 MB a file. People who can open the project
-- can see and download its files; editors can upload and remove (removal is soft: the row gets
-- deleted_at). Also: documents and files join Realtime, so an open project page shows new ones.
-- Written without "drop" lines; safe to run twice.

create table if not exists public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  uploaded_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 255),
  path text not null unique check (char_length(path) <= 400),
  mime text not null default '' check (char_length(mime) <= 120),
  size bigint not null default 0 check (size >= 0 and size <= 52428800),
  kind text not null check (kind in ('image', 'document', 'audio', 'video')),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists project_files_project on public.project_files (project_id, created_at desc) where deleted_at is null;

alter table public.project_files enable row level security;

-- Paths must sit in the project's own folder: "<project id>/…".
create or replace function public.can_view_project_path(path text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  folder text = (storage.foldername(path))[1];
begin
  if folder is null or folder !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;
  return public.can_view_project(folder::uuid);
end;
$$;
revoke execute on function public.can_view_project_path(text) from public, anon;
grant execute on function public.can_view_project_path(text) to authenticated;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'project_files' and policyname = 'People on the project can see its files') then
    create policy "People on the project can see its files" on public.project_files
      for select to authenticated using (deleted_at is null and public.can_view_project(project_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'project_files' and policyname = 'Editors can add files') then
    create policy "Editors can add files" on public.project_files
      for insert to authenticated with check (
        uploaded_by = (select auth.uid())
        and deleted_at is null
        and public.can_edit_project(project_id)
        and split_part(path, '/', 1) = project_id::text
      );
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'project_files' and policyname = 'Editors can rename and remove files') then
    create policy "Editors can rename and remove files" on public.project_files
      for update to authenticated
      using (deleted_at is null and public.can_edit_project(project_id))
      with check (public.can_edit_project(project_id));
  end if;
end $$;

-- What may change after upload: the name, and removing it.
revoke all on public.project_files from anon, authenticated;
grant select, insert on public.project_files to authenticated;
grant update (name, deleted_at) on public.project_files to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('project-files', 'project-files', false, 52428800, array[
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic',
  'application/pdf', 'text/plain', 'text/markdown', 'text/csv', 'application/rtf',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/wav', 'audio/x-wav', 'audio/webm', 'audio/ogg',
  'video/mp4', 'video/quicktime', 'video/webm'
])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'People on the project can open its files') then
    create policy "People on the project can open its files" on storage.objects
      for select to authenticated using (bucket_id = 'project-files' and public.can_view_project_path(name));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Editors can upload project files') then
    create policy "Editors can upload project files" on storage.objects
      for insert to authenticated with check (bucket_id = 'project-files' and public.can_edit_project_path(name));
  end if;
end $$;

do $$
declare
  t text;
begin
  foreach t in array array['documents', 'project_files'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
