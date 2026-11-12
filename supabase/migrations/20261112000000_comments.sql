-- Comments (Ika, 2026-11-11: "add comments feature under projects, similar to reference, accessible
-- to owners/users/teams with access to the project. Comments under explore projects can be made by
-- any signed in user."). Run in Supabase: SQL Editor > paste the whole file > Run. Safe to run twice.
-- Run after 20261020000000_projects.sql and 20261022000000_notifications.sql.
--
-- A comment belongs to a project (seen and written by the people on it, viewers included) or to an
-- Explore title or film (`title_slug`, as in project_references; seen and written by anyone signed
-- in). Replies sit one level deep, under the comment they answer. Authors edit and remove their own;
-- a project's owner can also remove any comment on it. Removing is a soft delete: a removed comment
-- with replies stays as "Comment removed" so the replies keep their place.
-- The table is reached only through the functions below.

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects (id) on delete cascade,
  title_slug text check (char_length(title_slug) between 1 and 120),
  parent_id uuid references public.comments (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz,
  constraint comments_one_subject check ((project_id is null) <> (title_slug is null))
);
create index if not exists comments_project_idx on public.comments (project_id, created_at) where project_id is not null;
create index if not exists comments_title_idx on public.comments (title_slug, created_at) where title_slug is not null;
create index if not exists comments_parent_idx on public.comments (parent_id) where parent_id is not null;
create index if not exists comments_author_recent_idx on public.comments (author_id, created_at desc);
alter table public.comments enable row level security;
revoke all on public.comments from anon, authenticated;

-- Can the signed-in person see (and write) comments here?
create or replace function public.can_comment_on(pid uuid, slug text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and ((pid is not null and slug is null and public.can_view_project(pid))
      or (pid is null and slug is not null and char_length(slug) between 1 and 120));
$$;

-- The comments on a project or an Explore title, oldest first (the app puts newest on top), with
-- who wrote them. Removed comments come back only while they have replies, without their words.
create or replace function public.list_comments(pid uuid default null, slug text default null)
returns table (
  id uuid,
  parent_id uuid,
  author_name text,
  author_avatar text,
  body text,
  created_at timestamptz,
  edited_at timestamptz,
  removed boolean,
  mine boolean,
  can_remove boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    c.id,
    c.parent_id,
    case when c.deleted_at is null then coalesce(nullif(public.display_name(c.author_id), ''), 'Someone') else '' end,
    case when c.deleted_at is null then p.avatar_url end,
    case when c.deleted_at is null then c.body else '' end,
    c.created_at,
    c.edited_at,
    c.deleted_at is not null,
    c.deleted_at is null and c.author_id = (select auth.uid()),
    c.deleted_at is null and (c.author_id = (select auth.uid()) or (c.project_id is not null and public.is_project_owner(c.project_id)))
  from public.comments c
  left join public.profiles p on p.id = c.author_id
  where public.can_comment_on(pid, slug)
    and (case when pid is not null then c.project_id = pid else c.title_slug = slug end)
    and (c.deleted_at is null or exists (
      select 1 from public.comments r where r.parent_id = c.id and r.deleted_at is null
    ))
  order by c.created_at
  limit 1000;
$$;

-- Write a comment, or a reply (`parent`; a reply to a reply joins the same thread). Tells the
-- project's owner about a new comment on their project, and the person answered about a reply.
create or replace function public.post_comment(pid uuid default null, slug text default null, parent uuid default null, words text default '')
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  clean text := btrim(coalesce(words, ''));
  thread public.comments;
  new_id uuid;
  owner uuid;
  title text;
  who text;
begin
  if not public.can_comment_on(pid, slug) then
    raise exception 'You can''t comment here' using errcode = '42501';
  end if;
  if char_length(clean) not between 1 and 2000 then
    raise exception 'Comments are 1 to 2,000 characters' using errcode = '22023';
  end if;
  -- A pause after a burst, so no one floods a page.
  if (select count(*) from public.comments c where c.author_id = me and c.created_at > now() - interval '5 minutes') >= 20 then
    raise exception 'That''s a lot of comments at once. Try again in a few minutes.' using errcode = '54000';
  end if;
  if parent is not null then
    select * into thread from public.comments c
    where c.id = parent
      and (case when pid is not null then c.project_id = pid else c.title_slug = slug end);
    if thread.id is null then
      raise exception 'That comment isn''t here any more' using errcode = '22023';
    end if;
    if thread.parent_id is not null then
      select * into thread from public.comments c where c.id = thread.parent_id;
    end if;
  end if;

  insert into public.comments (project_id, title_slug, parent_id, author_id, body)
  values (pid, case when pid is null then slug end, thread.id, me, clean)
  returning id into new_id;

  who := coalesce(nullif(public.display_name(me), ''), 'Someone');
  if pid is not null then
    select pr.owner_id, coalesce(nullif(pr.title, ''), 'your project') into owner, title from public.projects pr where pr.id = pid;
    if owner is not null and owner <> me and (thread.id is null or thread.author_id <> owner) then
      insert into public.notifications (user_id, project_id, kind, title, body)
      values (owner, pid, 'activity', left(who || ' commented on ' || title, 300), left(clean, 300));
    end if;
    if thread.id is not null and thread.author_id <> me and thread.deleted_at is null then
      insert into public.notifications (user_id, project_id, kind, title, body)
      values (thread.author_id, pid, 'activity', left(who || ' replied to your comment on ' || coalesce(nullif((select pr.title from public.projects pr where pr.id = pid), ''), 'a project'), 300), left(clean, 300));
    end if;
  end if;
  return new_id;
end;
$$;

-- Change your own comment's words.
create or replace function public.edit_comment(cid uuid, words text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  clean text := btrim(coalesce(words, ''));
begin
  if char_length(clean) not between 1 and 2000 then
    raise exception 'Comments are 1 to 2,000 characters' using errcode = '22023';
  end if;
  update public.comments set body = clean, edited_at = now()
  where id = cid and author_id = (select auth.uid()) and deleted_at is null;
  if not found then
    raise exception 'Only the person who wrote it can change it' using errcode = '42501';
  end if;
end;
$$;

-- Remove a comment: its author, or the owner of the project it's on.
create or replace function public.remove_comment(cid uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.comments c set deleted_at = now()
  where c.id = cid and c.deleted_at is null
    and (c.author_id = (select auth.uid()) or (c.project_id is not null and public.is_project_owner(c.project_id)));
  if not found then
    raise exception 'You can''t remove this comment' using errcode = '42501';
  end if;
end;
$$;

revoke execute on function public.can_comment_on(uuid, text) from public, anon;
grant execute on function public.can_comment_on(uuid, text) to authenticated;
revoke execute on function public.list_comments(uuid, text) from public, anon;
grant execute on function public.list_comments(uuid, text) to authenticated;
revoke execute on function public.post_comment(uuid, text, uuid, text) from public, anon;
grant execute on function public.post_comment(uuid, text, uuid, text) to authenticated;
revoke execute on function public.edit_comment(uuid, text) from public, anon;
grant execute on function public.edit_comment(uuid, text) to authenticated;
revoke execute on function public.remove_comment(uuid) from public, anon;
grant execute on function public.remove_comment(uuid) to authenticated;
