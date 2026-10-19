-- Notifications (Fix 8 / U1): "X shared Lookbook with you" and changes collaborators make to
-- projects you're on, shown in the Home inbox. Created only by the database (triggers below);
-- people can read their own and mark them read or archived, nothing else. Safe to run twice.

create table if not exists public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid references public.projects (id) on delete cascade,
  kind text not null check (kind in ('shared', 'activity')),
  title text not null check (char_length(title) <= 300),
  body text not null default '' check (char_length(body) <= 300),
  read_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_inbox_idx on public.notifications (user_id, created_at desc) where archived_at is null;

alter table public.notifications enable row level security;

-- Only reading, and changing the two "state" columns, from the app.
revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;
grant update (read_at, archived_at) on public.notifications to authenticated;

drop policy if exists "People can read their own notifications" on public.notifications;
create policy "People can read their own notifications" on public.notifications
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "People can mark their own notifications" on public.notifications;
create policy "People can mark their own notifications" on public.notifications
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Shared with you: when someone is added to a project (directly, or on sign-up from an invite).
create or replace function public.notify_project_member()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  project_title text;
  actor text;
begin
  select coalesce(nullif(p.title, ''), 'Untitled project') into project_title from public.projects p where p.id = new.project_id;
  actor := coalesce(nullif(public.display_name(new.invited_by), ''), 'Someone');
  insert into public.notifications (user_id, project_id, kind, title, body)
  values (
    new.user_id, new.project_id, 'shared',
    left(actor || ' shared ' || project_title || ' with you', 300),
    case when new.role = 'editor' then 'You can edit it.' else 'You can view it.' end
  );
  return new;
end;
$$;
revoke execute on function public.notify_project_member() from public, anon, authenticated;
drop trigger if exists project_members_notify on public.project_members;
create trigger project_members_notify
  after insert on public.project_members
  for each row execute function public.notify_project_member();

-- Changes by collaborators: everyone on the project except the person who made the change.
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
    left(new.detail, 300)
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
drop trigger if exists activity_notify on public.activity;
create trigger activity_notify
  after insert on public.activity
  for each row execute function public.notify_project_activity();

-- Live updates: new notifications reach an open Home page without a refresh.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
