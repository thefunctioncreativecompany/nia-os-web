-- Share link permissions and edit requests (Ika, 2026-11-11: "enable permissions on shared links
-- (view, request to edit)"). Run in Supabase: SQL Editor > paste the whole file > Run.
-- Safe to run twice. Run after 20261020000000_projects.sql and 20261022000000_notifications.sql.
--
-- 1. What a project's link allows, set by its owner:
--      'view'     anyone with the link can view (what links did until now, and still the default)
--      'request'  anyone with the link can view, and a signed-in person can ask to edit
-- 2. Edit requests: someone who opened the link asks to edit; the owner is notified and approves
--    (they join the project as Can edit) or declines. Nothing changes until the owner says yes.
-- The setting and the requests live in their own tables, changed only through the functions below.

create table if not exists public.project_link_settings (
  project_id uuid primary key references public.projects (id) on delete cascade,
  link_access text not null default 'view' check (link_access in ('view', 'request')),
  updated_at timestamptz not null default now()
);
alter table public.project_link_settings enable row level security;
revoke all on public.project_link_settings from anon, authenticated;

create table if not exists public.project_access_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  message text not null default '' check (char_length(message) <= 300),
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
create unique index if not exists project_access_requests_one_pending
  on public.project_access_requests (project_id, user_id) where status = 'pending';
create index if not exists project_access_requests_project on public.project_access_requests (project_id, status);
alter table public.project_access_requests enable row level security;
revoke all on public.project_access_requests from anon, authenticated;
grant select on public.project_access_requests to authenticated;

-- The owner sees requests for their projects; a person sees their own.
drop policy if exists "Owners and requesters see requests" on public.project_access_requests;
create policy "Owners and requesters see requests"
  on public.project_access_requests for select to authenticated
  using (user_id = (select auth.uid()) or public.is_project_owner(project_id));

-- What a link allows (for the share page, signed in or not). Null when the link is off.
create or replace function public.shared_link_access(token text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(s.link_access, 'view')
  from public.projects p
  left join public.project_link_settings s on s.project_id = p.id
  where char_length(token) >= 24 and p.share_token = token and p.deleted_at is null;
$$;

-- What my link allows, for the owner's share dialog.
create or replace function public.project_link_access(pid uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select s.link_access from public.project_link_settings s where s.project_id = pid), 'view')
  where public.is_project_owner(pid);
$$;

-- The owner chooses what the link allows.
create or replace function public.set_link_access(pid uuid, access text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_project_owner(pid) then
    raise exception 'Only the project owner can change the link' using errcode = '42501';
  end if;
  if access not in ('view', 'request') then
    raise exception 'Choose view or request to edit' using errcode = '22023';
  end if;
  insert into public.project_link_settings (project_id, link_access) values (pid, access)
  on conflict (project_id) do update set link_access = excluded.link_access, updated_at = now();
end;
$$;

-- Someone who opened the link asks to edit. Returns 'requested', 'pending' (already asked),
-- 'member' (already on the project as Can edit or owner) or raises when the link doesn't allow it.
create or replace function public.request_project_access(token text, note text default '')
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  pid uuid;
  owner uuid;
  title text;
begin
  if me is null then
    raise exception 'Log in to ask for access' using errcode = '42501';
  end if;
  select p.id, p.owner_id, p.title into pid, owner, title
  from public.projects p
  left join public.project_link_settings s on s.project_id = p.id
  where char_length(token) >= 24 and p.share_token = token and p.deleted_at is null
    and coalesce(s.link_access, 'view') = 'request';
  if pid is null then
    raise exception 'This link doesn''t take requests' using errcode = '42501';
  end if;
  if owner = me or exists (select 1 from public.project_members m where m.project_id = pid and m.user_id = me and m.role = 'editor') then
    return 'member';
  end if;
  if exists (select 1 from public.project_access_requests r where r.project_id = pid and r.user_id = me and r.status = 'pending') then
    return 'pending';
  end if;
  insert into public.project_access_requests (project_id, user_id, message) values (pid, me, left(coalesce(note, ''), 300));
  insert into public.notifications (user_id, project_id, kind, title, body)
  values (owner, pid, 'shared', left(coalesce(public.display_name(me), 'Someone') || ' asked to edit ' || coalesce(nullif(title, ''), 'your project'), 300), left(coalesce(note, ''), 300));
  return 'requested';
end;
$$;

-- The owner approves (they join as Can edit) or declines a request.
create or replace function public.respond_project_access(request_id uuid, approve boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  req public.project_access_requests;
  title text;
begin
  select * into req from public.project_access_requests where id = request_id;
  if req.id is null or not public.is_project_owner(req.project_id) then
    raise exception 'Only the project owner can answer this' using errcode = '42501';
  end if;
  if req.status <> 'pending' then
    return;
  end if;
  update public.project_access_requests set status = case when approve then 'approved' else 'declined' end, decided_at = now() where id = request_id;
  if approve then
    insert into public.project_members (project_id, user_id, role, invited_by)
    values (req.project_id, req.user_id, 'editor', (select auth.uid()))
    on conflict (project_id, user_id) do update set role = 'editor';
    perform public.log_activity(req.project_id, 'shared', coalesce(public.display_name(req.user_id), 'someone'));
    select p.title into title from public.projects p where p.id = req.project_id;
    insert into public.notifications (user_id, project_id, kind, title, body)
    values (req.user_id, req.project_id, 'shared', left('You can now edit ' || coalesce(nullif(title, ''), 'the project'), 300), '');
  end if;
end;
$$;

-- The requests waiting on the owner, with who asked.
create or replace function public.pending_access_requests(pid uuid)
returns table (id uuid, name text, message text, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select r.id, coalesce(public.display_name(r.user_id), 'Someone'), r.message, r.created_at
  from public.project_access_requests r
  where r.project_id = pid and r.status = 'pending' and public.is_project_owner(pid)
  order by r.created_at;
$$;

revoke execute on function public.pending_access_requests(uuid) from public, anon;
grant execute on function public.pending_access_requests(uuid) to authenticated;
revoke execute on function public.shared_link_access(text) from public;
grant execute on function public.shared_link_access(text) to anon, authenticated;
revoke execute on function public.project_link_access(uuid) from public, anon;
grant execute on function public.project_link_access(uuid) to authenticated;
revoke execute on function public.set_link_access(uuid, text) from public, anon;
grant execute on function public.set_link_access(uuid, text) to authenticated;
revoke execute on function public.request_project_access(text, text) from public, anon;
grant execute on function public.request_project_access(text, text) to authenticated;
revoke execute on function public.respond_project_access(uuid, boolean) from public, anon;
grant execute on function public.respond_project_access(uuid, boolean) to authenticated;
