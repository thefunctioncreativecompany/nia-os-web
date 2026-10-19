-- Audit #11 (S1): "Shared with you" also lists projects a signed-in person opened through a
-- view-only share link. Opening the link records it; the project shows only while its link is
-- still on, and not for its owner or members (they see it already). Safe to run twice.

create table if not exists public.project_link_visits (
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  last_opened_at timestamptz not null default now(),
  primary key (user_id, project_id)
);
create index if not exists project_link_visits_project on public.project_link_visits (project_id);
alter table public.project_link_visits enable row level security;
-- Only the functions below touch it.
revoke all on public.project_link_visits from anon, authenticated;

-- Called by the share page when a signed-in person opens a link that's on.
create or replace function public.remember_shared_link(token text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  pid uuid;
begin
  if me is null or token is null or char_length(token) < 16 then
    return;
  end if;
  select p.id into pid from public.projects p where p.share_token = token and p.deleted_at is null;
  if pid is null then
    return;
  end if;
  insert into public.project_link_visits (user_id, project_id) values (me, pid)
  on conflict (user_id, project_id) do update set last_opened_at = now();
end;
$$;

-- Projects I opened by link, while their link is on and I'm not already on them.
create or replace function public.my_link_shared_projects()
returns table (id uuid, title text, description text, cover_url text, production_type text, stage text, share_token text, owner_name text, last_opened_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.title, p.description, p.cover_url, p.production_type, p.stage, p.share_token,
         coalesce(public.display_name(p.owner_id), ''), v.last_opened_at
  from public.project_link_visits v
  join public.projects p on p.id = v.project_id
  where v.user_id = (select auth.uid())
    and p.deleted_at is null
    and p.share_token is not null
    and p.owner_id <> (select auth.uid())
    and not exists (select 1 from public.project_members m where m.project_id = p.id and m.user_id = (select auth.uid()))
  order by v.last_opened_at desc;
$$;

revoke execute on function public.remember_shared_link(text) from public, anon;
grant execute on function public.remember_shared_link(text) to authenticated;
revoke execute on function public.my_link_shared_projects() from public, anon;
grant execute on function public.my_link_shared_projects() to authenticated;
