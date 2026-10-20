-- Plans (Ika, 2026-10-20): Free, Starter, Creator, Pro and Enterprise/Studio. There are no
-- payments yet, so every workspace starts on Free; Ika can move a workspace (a beta tester's,
-- say) to a paid plan by hand in the SQL Editor:
--   update public.workspaces set plan = 'pro' where id = '…';
-- Nobody can change their own plan from the app. "Get Starter" and the like save interest in
-- feature_waitlist. Paid workspaces skip the free document limits. Safe to run twice.

-- 1. Each workspace's plan.
alter table public.workspaces add column if not exists plan text not null default 'free';
alter table public.workspaces drop constraint if exists workspaces_plan_check;
alter table public.workspaces add constraint workspaces_plan_check
  check (plan in ('free', 'starter', 'creator', 'pro', 'enterprise'));

-- Owners may rename their workspace, but only the database itself (the SQL Editor, or a payment
-- service later) may change its plan.
create or replace function public.workspaces_plan_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.plan is distinct from old.plan and coalesce(auth.role(), '') in ('authenticated', 'anon') then
    raise exception 'Plans change through billing, not from the app.' using errcode = '42501';
  end if;
  return new;
end;
$$;
drop trigger if exists workspaces_plan_guard on public.workspaces;
create trigger workspaces_plan_guard
  before update on public.workspaces
  for each row execute function public.workspaces_plan_guard();

-- New workspaces always start on Free, whatever the app sends.
create or replace function public.workspaces_plan_default()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if coalesce(auth.role(), '') in ('authenticated', 'anon') then
    new.plan := 'free';
  end if;
  return new;
end;
$$;
drop trigger if exists workspaces_plan_default on public.workspaces;
create trigger workspaces_plan_default
  before insert on public.workspaces
  for each row execute function public.workspaces_plan_default();

-- 2. "Get Starter" and the like: interest in a paid plan, until payments open.
alter table public.feature_waitlist drop constraint if exists feature_waitlist_feature_check;
alter table public.feature_waitlist add constraint feature_waitlist_feature_check
  check (feature in ('explore', 'inbox', 'starter', 'creator', 'pro', 'enterprise', 'marketplace', 'marketplace-lister'));

-- 3. Free plan document limits (5 a project, one of each template) apply to Free workspaces only.
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
    select 1 from public.projects p join public.workspaces w on w.id = p.workspace_id
    where p.id = new.project_id and w.plan <> 'free'
  ) then
    return new;
  end if;
  if exists (
    select 1 from public.documents d
    where d.project_id = new.project_id and d.template_code = new.template_code
      and d.deleted_at is null and d.id <> new.id
  ) then
    template_name := coalesce(nullif(new.title, ''), 'document');
    raise exception 'This project already has % %. Open that one instead (more than one is on paid plans).',
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
