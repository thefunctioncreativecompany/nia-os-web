-- Deleting a document (soft): the person who made it, or the project owner.
-- A plain update can't do it: deleted documents are hidden from everyone, so Postgres
-- rejects the update that would hide one. Same pattern as soft_delete_project.

create or replace function public.soft_delete_document(doc_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.documents d
    where d.id = doc_id
      and d.deleted_at is null
      and (
        d.created_by = (select auth.uid())
        or (d.project_id is not null and public.is_project_owner(d.project_id))
      )
  ) then
    raise exception 'Only the person who made this document or the project owner can delete it'
      using errcode = '42501';
  end if;
  update public.documents set deleted_at = now() where id = doc_id;
end;
$$;

revoke execute on function public.soft_delete_document(uuid) from public, anon;
grant execute on function public.soft_delete_document(uuid) to authenticated;
