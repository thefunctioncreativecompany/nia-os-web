-- File tags and previews (Ika, 2026-10-19): each file is tagged by what it is for the
-- production (reference, raw file, work in progress, final asset, brief & paperwork), and
-- documents keep a picture of their first page to show as their cover. Editors can change a
-- tag. Safe to run twice.

alter table public.project_files
  add column if not exists tag text check (tag in ('reference', 'raw', 'wip', 'final', 'brief')),
  add column if not exists thumb_path text check (char_length(thumb_path) <= 400);

grant update (name, deleted_at, tag) on public.project_files to authenticated;
