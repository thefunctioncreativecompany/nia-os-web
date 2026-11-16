-- A project's references: their order and a note on each, arranged by the team (Ika, 2026-11-15:
-- the References row on the project page as cards with an editable note below, reorderable).
-- Run in Supabase: SQL Editor > paste the whole file > Run. Safe to run twice.
-- Run after 20261104000000_project_instagram_references.sql.

-- The order the team arranged (empty: newest first, as before).
alter table public.project_references
  add column if not exists position integer;

-- Editors may now change a reference's note and order, as well as remove it. Who may is still the
-- existing rule ("Editors remove references": people who can edit the project, on references that
-- haven't been removed).
grant update (note, position) on public.project_references to authenticated;

-- A note on a project's file (the reference pictures on the project's Overview: a line about each,
-- written under it). Editors may write it, as they may rename a file or change its tag.
alter table public.project_files
  add column if not exists note text check (note is null or char_length(note) <= 1000);
grant update (note) on public.project_files to authenticated;
