-- Audit #9 (2026-10-19): Activity records documents and uploads, and collaborators are notified.
--   doc_added    "added Call Sheet to Lookbook"      (created in, saved to, or moved into a project)
--   doc_removed  "removed Call Sheet from Lookbook"  (taken out of a project)
--   doc_deleted  "deleted Call Sheet from Lookbook"
--   files_added  "uploaded mood.png to Lookbook" / "uploaded 4 files to Lookbook" (one line per
--                person per 10 minutes, counting up)
-- Safe to run twice.

alter table public.activity drop constraint if exists activity_action_check;
alter table public.activity add constraint activity_action_check check (action in (
  'created', 'renamed', 'updated', 'cover_changed', 'shared', 'unshared', 'link_on', 'link_off', 'deleted',
  'doc_added', 'doc_removed', 'doc_deleted', 'files_added'
));

create or replace function public.documents_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.project_id is not null then
      perform public.log_activity(new.project_id, 'doc_added', new.title);
    end if;
    return new;
  end if;
  if new.deleted_at is not null and old.deleted_at is null then
    if old.project_id is not null then
      perform public.log_activity(old.project_id, 'doc_deleted', old.title);
    end if;
    return new;
  end if;
  if new.project_id is distinct from old.project_id then
    if old.project_id is not null then
      perform public.log_activity(old.project_id, 'doc_removed', old.title);
    end if;
    if new.project_id is not null then
      perform public.log_activity(new.project_id, 'doc_added', new.title);
    end if;
  end if;
  return new;
end;
$$;
revoke execute on function public.documents_activity() from public, anon, authenticated;

create or replace function public.project_files_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  recent record;
  n int;
begin
  select id, detail into recent from public.activity
  where project_id = new.project_id and actor_id = auth.uid() and action = 'files_added'
    and created_at > now() - interval '10 minutes'
  order by created_at desc limit 1;
  if recent.id is not null then
    n := coalesce(nullif(substring(recent.detail from '^(\d+) files$'), '')::int, 1) + 1;
    update public.activity set detail = n || ' files', created_at = now() where id = recent.id;
  else
    perform public.log_activity(new.project_id, 'files_added', new.name);
  end if;
  return new;
end;
$$;
revoke execute on function public.project_files_activity() from public, anon, authenticated;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'documents_activity' and not tgisinternal) then
    create trigger documents_activity
      after insert or update of project_id, deleted_at on public.documents
      for each row execute function public.documents_activity();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'project_files_activity' and not tgisinternal) then
    create trigger project_files_activity
      after insert on public.project_files
      for each row execute function public.project_files_activity();
  end if;
end $$;

-- Notify collaborators about these too (same rules as before: everyone on the project except
-- the person who did it).
create or replace function public.notify_project_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  project_title text;
  owner uuid;
  what text;
begin
  what := case new.action
    when 'renamed' then 'renamed'
    when 'updated' then 'updated'
    when 'cover_changed' then 'changed the cover of'
    when 'link_on' then 'turned on the view-only link for'
    when 'link_off' then 'turned off the view-only link for'
    when 'doc_added' then 'added ' || new.detail || ' to'
    when 'doc_removed' then 'removed ' || new.detail || ' from'
    when 'doc_deleted' then 'deleted ' || new.detail || ' from'
    when 'files_added' then 'uploaded ' || new.detail || ' to'
    else null
  end;
  if what is null then
    return new;
  end if;
  select coalesce(nullif(p.title, ''), 'Untitled project'), p.owner_id into project_title, owner
  from public.projects p where p.id = new.project_id;
  insert into public.notifications (user_id, project_id, kind, title, body)
  select r.uid, new.project_id, 'activity',
    left(coalesce(nullif(new.actor_name, ''), 'Someone') || ' ' || what || ' ' || project_title, 300),
    case when new.action in ('doc_added', 'doc_removed', 'doc_deleted', 'files_added') then '' else left(new.detail, 300) end
  from (
    select owner as uid
    union
    select m.user_id from public.project_members m where m.project_id = new.project_id
  ) r
  where r.uid is not null and r.uid is distinct from new.actor_id;
  return new;
end;
$$;
revoke execute on function public.notify_project_activity() from public, anon, authenticated;
