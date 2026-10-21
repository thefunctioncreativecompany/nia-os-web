-- Removing from collections and project references (soft), the way project files are removed.
-- A plain update can't do it: removed rows are hidden from everyone, so Postgres rejects the
-- update that would hide one. Each function checks you're allowed, then sets deleted_at.
-- Run after 20261031000000_collections_references.sql. Safe to run twice.

-- A title out of one of your collections.
create or replace function public.remove_collection_item(item_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.collection_items i
    where i.id = item_id and i.deleted_at is null and i.owner_id = (select auth.uid())
  ) then
    raise exception 'You can only remove titles from your own collections' using errcode = '42501';
  end if;
  update public.collection_items set deleted_at = now() where id = item_id;
end;
$$;

-- One of your collections, and what's in it.
create or replace function public.remove_collection(collection_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.collections c
    where c.id = collection_id and c.deleted_at is null and c.owner_id = (select auth.uid())
  ) then
    raise exception 'You can only remove your own collections' using errcode = '42501';
  end if;
  update public.collection_items set deleted_at = now() where collection_items.collection_id = remove_collection.collection_id and deleted_at is null;
  update public.collections set deleted_at = now() where id = remove_collection.collection_id;
end;
$$;

-- A title out of a project's references: anyone who can edit the project.
create or replace function public.remove_project_reference(reference_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.project_references r
    where r.id = reference_id and r.deleted_at is null and public.can_edit_project(r.project_id)
  ) then
    raise exception 'Only people who can edit this project can remove its references' using errcode = '42501';
  end if;
  update public.project_references set deleted_at = now() where id = reference_id;
end;
$$;

revoke execute on function public.remove_collection_item(uuid) from public, anon;
revoke execute on function public.remove_collection(uuid) from public, anon;
revoke execute on function public.remove_project_reference(uuid) from public, anon;
grant execute on function public.remove_collection_item(uuid) to authenticated;
grant execute on function public.remove_collection(uuid) to authenticated;
grant execute on function public.remove_project_reference(uuid) to authenticated;
