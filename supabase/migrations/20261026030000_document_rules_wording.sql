-- "already has an Invoice", not "a Invoice" (audit follow-up, 2026-10-19). Wording only.

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
    raise exception 'This project already has % %. Open that one instead (more than one is coming with Teams).',
      case when lower(left(template_name, 1)) in ('a', 'e', 'i', 'o', 'u') then 'an' else 'a' end, template_name
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
