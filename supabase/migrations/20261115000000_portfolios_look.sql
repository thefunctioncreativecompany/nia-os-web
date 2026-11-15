-- Portfolios, slice 3 (PORTFOLIOS_BUILD.md P1a and P5, cut down): how the cover is framed, and the
-- order of the work inside a project. Run in Supabase: SQL Editor > paste the whole file > Run.
-- Safe to run twice. Run after 20261114000000_portfolios.sql.

-- The cover's framing: which point of the picture stays in view (x, y in %) and the zoom (1 to 3).
alter table public.portfolios
  add column if not exists cover_frame jsonb not null default '{"x":50,"y":50,"z":1}';
grant update (cover_frame) on public.portfolios to authenticated;

-- The order of a project's files as the owner arranged it (empty: the order they were added in).
-- Editors of the project may change it, as with a file's tag (the existing update rule applies).
alter table public.project_files
  add column if not exists position integer;
grant update (position) on public.project_files to authenticated;
create index if not exists project_files_final_order on public.project_files (project_id, position, created_at)
  where deleted_at is null and tag = 'final';
