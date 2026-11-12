-- Reference stills on a shared link (Ika, 2026-11-11: "reference stills too, together with explore
-- references"). Run in Supabase: SQL Editor > paste the whole file > Run. Safe to run twice.
-- Run after 20261025030000_project_files_tags.sql, 20261031000000_collections_references.sql and
-- 20261111000000_link_access_requests.sql.
--
-- The shared page's References row: the project's Explore titles and its stills tagged Reference,
-- newest first, while the link is on. Only those stills: every other file stays private. The
-- files themselves stay in the private store; the page's server opens each one with a link that
-- lasts an hour, only after this function has checked the share link.

create or replace function public.shared_project_reference_items(token text)
returns table (kind text, slug text, path text, name text, added_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  with p as (
    select id from public.projects
    where char_length(token) >= 24 and share_token = token and deleted_at is null
  )
  select 'explore', r.title_slug, null, null, r.created_at
  from public.project_references r join p on p.id = r.project_id
  where r.deleted_at is null
  union all
  select 'still', null, f.path, f.name, f.created_at
  from public.project_files f join p on p.id = f.project_id
  where f.deleted_at is null and f.kind = 'image' and f.tag = 'reference'
  order by 5 desc;
$$;

revoke execute on function public.shared_project_reference_items(text) from public;
grant execute on function public.shared_project_reference_items(text) to anon, authenticated;
