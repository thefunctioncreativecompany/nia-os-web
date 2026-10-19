-- Removing a project file (soft): anyone who can edit the project. A plain update can't do it:
-- removed files are hidden from everyone, so Postgres rejects the update that would hide one.
-- Same pattern as soft_delete_project and soft_delete_document. Safe to run twice.

create or replace function public.remove_project_file(file_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.project_files f
    where f.id = file_id and f.deleted_at is null and public.can_edit_project(f.project_id)
  ) then
    raise exception 'Only people who can edit this project can remove its files' using errcode = '42501';
  end if;
  update public.project_files set deleted_at = now() where id = file_id;
end;
$$;

revoke execute on function public.remove_project_file(uuid) from public, anon;
grant execute on function public.remove_project_file(uuid) to authenticated;
