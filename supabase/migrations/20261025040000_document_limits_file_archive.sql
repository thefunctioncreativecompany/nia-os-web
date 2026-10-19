-- Free-plan document rules and the file archive (Ika, 2026-10-19). Safe to run twice; no drops.
--
-- 1. A project holds one document per template (one call sheet, one shotlist…): several of the
--    same is reserved for the Teams plan. And at most 5 documents per project on the free plan.
--    Checked whenever a document is created in, or moved into, a project.
-- 2. Removing a file archives it (deleted_at set). Editors can see the archive, restore a file,
--    or delete it for good: the app removes the stored file, then purge_project_file removes
--    the record.

create or replace function public.documents_project_rules()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  template_name text;
begin
  if new.project_id is null or new.deleted_at is not null then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.project_id is not distinct from new.project_id and old.deleted_at is null then
    return new;
  end if;
  if exists (
    select 1 from public.documents d
    where d.project_id = new.project_id and d.template_code = new.template_code
      and d.deleted_at is null and d.id <> new.id
  ) then
    template_name := coalesce(nullif(new.title, ''), 'document');
    raise exception 'This project already has a %. Open that one instead (more than one is coming with Teams).', template_name
      using errcode = '23505';
  end if;
  if (
    select count(*) from public.documents d
    where d.project_id = new.project_id and d.deleted_at is null and d.id <> new.id
  ) >= 5 then
    raise exception 'This project already has 5 documents, the most on the free plan.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke execute on function public.documents_project_rules() from public, anon, authenticated;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'documents_project_rules' and not tgisinternal) then
    create trigger documents_project_rules
      before insert or update of project_id, deleted_at on public.documents
      for each row execute function public.documents_project_rules();
  end if;
end $$;

-- Backstop for two saves at the same moment.
create unique index if not exists documents_one_per_template
  on public.documents (project_id, template_code)
  where project_id is not null and deleted_at is null;

-- The archive: editors see archived files (everyone else still sees only current ones).
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'project_files' and policyname = 'Editors can see archived files') then
    create policy "Editors can see archived files" on public.project_files
      for select to authenticated using (deleted_at is not null and public.can_edit_project(project_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Editors can delete project files') then
    create policy "Editors can delete project files" on storage.objects
      for delete to authenticated using (bucket_id = 'project-files' and public.can_edit_project_path(name));
  end if;
end $$;

create or replace function public.restore_project_file(file_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.project_files f
    where f.id = file_id and f.deleted_at is not null and public.can_edit_project(f.project_id)
  ) then
    raise exception 'Only people who can edit this project can restore its files' using errcode = '42501';
  end if;
  update public.project_files set deleted_at = null where id = file_id;
end;
$$;

-- Deletes an archived file's record for good (call after removing the stored file).
create or replace function public.purge_project_file(file_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.project_files f
    where f.id = file_id and f.deleted_at is not null and public.can_edit_project(f.project_id)
  ) then
    raise exception 'Only archived files can be deleted for good, by people who can edit the project' using errcode = '42501';
  end if;
  delete from public.project_files where id = file_id;
end;
$$;

revoke execute on function public.restore_project_file(uuid) from public, anon;
grant execute on function public.restore_project_file(uuid) to authenticated;
revoke execute on function public.purge_project_file(uuid) from public, anon;
grant execute on function public.purge_project_file(uuid) to authenticated;
