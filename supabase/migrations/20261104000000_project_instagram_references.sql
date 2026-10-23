-- Instagram links as project references (Ika, 2026-10-22). Run in Supabase: SQL Editor > paste
-- the whole file > Run. Safe to run twice. Run after 20261101000000_explore_access.sql.
--
-- Someone who can edit a project pastes an Instagram post's link; Nia reads the post (cover,
-- account, date, caption and the credits in it), they check the draft, and it's saved to the
-- project's references next to the titles added from Explore. Unlike Explore titles, these are
-- the project's own: only the owner and the people invited to it can see them (the table's
-- existing rules), and the cover is copied into the project's private "project-files" folder.
-- Adding one doesn't need Explore's early access; adding an Explore title still does.

alter table public.project_references drop constraint if exists project_references_kind_check;
alter table public.project_references
  add constraint project_references_kind_check check (kind in ('explore', 'instagram'));

alter table public.project_references
  -- The post's address, as https://www.instagram.com/<reel|p|tv>/<code>/
  add column if not exists link text check (link is null or char_length(link) <= 200),
  add column if not exists title text check (title is null or char_length(btrim(title)) between 1 and 120),
  add column if not exists production_type text check (production_type is null or char_length(production_type) <= 60),
  -- Who posted it, without the @.
  add column if not exists account text check (account is null or char_length(account) <= 60),
  add column if not exists posted_on date,
  add column if not exists caption text check (caption is null or char_length(caption) <= 5000),
  -- [{ "role": "Director", "name": "Meghan Daniels", "handle": "meghandaniels" }, ...]
  add column if not exists credits jsonb not null default '[]'::jsonb check (jsonb_typeof(credits) = 'array' and jsonb_array_length(credits) <= 100),
  -- The picture's true shape (width / height), and the post's shape when the picture sits on
  -- black bars inside it. Same meaning as `aspect` and `frame` in src/features/explore/creators.ts.
  add column if not exists aspect real check (aspect is null or aspect between 0.2 and 5),
  add column if not exists frame real check (frame is null or frame between 0.2 and 5),
  -- The cover's path in the "project-files" bucket: <project id>/references/<file>.jpg
  add column if not exists cover_path text check (cover_path is null or char_length(cover_path) <= 200),
  -- Why it's a reference ("the light in the first shot").
  add column if not exists note text check (note is null or char_length(note) <= 1000);

-- An Instagram reference always has its link and a title.
alter table public.project_references drop constraint if exists project_references_instagram_check;
alter table public.project_references
  add constraint project_references_instagram_check check (kind <> 'instagram' or (link is not null and title is not null));

-- Editors add references; Explore titles also need Explore's early access.
drop policy if exists "Editors add references" on public.project_references;
create policy "Editors add references" on public.project_references
  for insert to authenticated with check (
    added_by = (select auth.uid())
    and deleted_at is null
    and public.can_edit_project(project_id)
    and (kind <> 'explore' or public.has_explore_access())
  );
