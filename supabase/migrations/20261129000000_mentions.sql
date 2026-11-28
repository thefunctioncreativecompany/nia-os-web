-- @mentions in project comments (Ika, 2026-11-27, more notifications part 2 of 4). Run in
-- Supabase: SQL Editor > paste the whole file > Run. Safe to run twice. Run after
-- 20261128000000_more_notifications.sql. Changes no existing comment.
--
-- Typing @ in a project's comment box suggests the people on the project (its owner and the people
-- it's shared with), found by name, @username or their exact email (the email is never shown).
-- A picked person sits in the comment's text as [@ id="…" label="Ama Owusu"] and shows as
-- "@Ama Owusu". When the comment is posted (or edited to add someone), each person mentioned who
-- is on the project gets "Ika mentioned you in Lookbook"; the owner or the person replied to who is
-- also mentioned gets that one instead of "commented on" or "replied to". Someone is told once per
-- comment. Mentions of people outside the project come in part 4; for now they're ignored.

create table if not exists public.mentions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid references public.projects (id) on delete cascade,
  -- Where: a comment now; meeting notes and documents in part 3.
  source text not null check (source in ('comment', 'meeting', 'document')),
  source_id uuid not null,
  mentioned_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint mentions_once unique (source, source_id, user_id)
);
create index if not exists mentions_user_idx on public.mentions (user_id, created_at desc);
create index if not exists mentions_project_idx on public.mentions (project_id);
alter table public.mentions enable row level security;
revoke all on public.mentions from anon, authenticated;
-- No policies: only the functions below write or read it.

-- The text with each mention as "@Name" (for notifications).
create or replace function public.mention_plain(words text)
returns text
language sql
immutable
set search_path = ''
as $$
  select regexp_replace(
    regexp_replace(coalesce(words, ''), '\[@[^\]]*?label="([^"]*)"[^\]]*\]', '@\1', 'g'),
    '\[@[^\]]*\]', '@someone', 'g');
$$;
revoke execute on function public.mention_plain(text) from public, anon, authenticated;

-- The people on a project the signed-in person can mention: its owner and members, not
-- themselves. `q` matches a name or @username anywhere, or an exact email (never returned).
create or replace function public.mention_people(pid uuid, q text default '')
returns table (id uuid, full_name text, username text, avatar_url text)
language sql
stable
security definer
set search_path = ''
as $$
  with term as (select lower(btrim(coalesce(q, ''), ' @')) as t),
  people as (
    select pr.owner_id as uid from public.projects pr where pr.id = pid and pr.deleted_at is null
    union
    select m.user_id from public.project_members m where m.project_id = pid
  )
  select u.id, coalesce(nullif(public.display_name(u.id), ''), 'Someone'), p.username, p.avatar_url
  from people pe
  join auth.users u on u.id = pe.uid
  left join public.profiles p on p.id = u.id
  cross join term
  where (select auth.uid()) is not null
    and public.can_view_project(pid)
    and u.id <> (select auth.uid())
    and char_length(term.t) <= 254
    and (
      term.t = ''
      or lower(coalesce(public.display_name(u.id), '')) like '%' || replace(replace(term.t, '%', ''), '_', '') || '%'
      or lower(coalesce(p.username, '')) like replace(replace(term.t, '%', ''), '_', '') || '%'
      or lower(u.email) = term.t
    )
  order by lower(public.display_name(u.id))
  limit 8;
$$;
revoke execute on function public.mention_people(uuid, text) from public, anon;
grant execute on function public.mention_people(uuid, text) to authenticated;

-- Tells the people mentioned in `words` (who are on the project, and not the writer) that they
-- were, once per place. Returns who was told.
create or replace function public.notify_mentions(pid uuid, src text, src_id uuid, words text)
returns uuid[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  title text;
  who text;
  told uuid[];
begin
  if pid is null or words !~ '\[@' then
    return '{}';
  end if;
  select coalesce(nullif(pr.title, ''), 'a project') into title from public.projects pr where pr.id = pid;
  who := coalesce(nullif(public.display_name(me), ''), 'Someone');

  with named as (
    select distinct (regexp_matches(words, '\[@[^\]]*?id="([0-9a-fA-F-]{36})"', 'g'))[1]::uuid as uid
  ),
  allowed as (
    select n.uid from named n
    where n.uid is distinct from me
      and (n.uid = (select pr.owner_id from public.projects pr where pr.id = pid)
        or exists (select 1 from public.project_members m where m.project_id = pid and m.user_id = n.uid))
    limit 20
  ),
  fresh as (
    insert into public.mentions (user_id, project_id, source, source_id, mentioned_by)
    select a.uid, pid, src, src_id, me from allowed a
    on conflict on constraint mentions_once do nothing
    returning user_id
  )
  select coalesce(array_agg(user_id), '{}') into told from fresh;

  insert into public.notifications (user_id, project_id, kind, event, actor_id, title, body)
  select t, pid, 'activity', 'mention', me,
    left(who || ' mentioned you in ' || title, 300),
    left(public.mention_plain(words), 300)
  from unnest(told) t;
  return told;
end;
$$;
revoke execute on function public.notify_mentions(uuid, text, uuid, text) from public, anon, authenticated;

-- Write a comment or a reply (as in 20261112000000_comments.sql), now telling the people mentioned.
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
  told uuid[] := '{}';
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
    told := public.notify_mentions(pid, 'comment', new_id, clean);
    select pr.owner_id, coalesce(nullif(pr.title, ''), 'your project') into owner, title from public.projects pr where pr.id = pid;
    if owner is not null and owner <> me and (thread.id is null or thread.author_id <> owner) and not (owner = any (told)) then
      insert into public.notifications (user_id, project_id, kind, title, body)
      values (owner, pid, 'activity', left(who || ' commented on ' || title, 300), left(public.mention_plain(clean), 300));
    end if;
    if thread.id is not null and thread.author_id <> me and thread.deleted_at is null and not (thread.author_id = any (told)) then
      insert into public.notifications (user_id, project_id, kind, title, body)
      values (thread.author_id, pid, 'activity', left(who || ' replied to your comment on ' || coalesce(nullif((select pr.title from public.projects pr where pr.id = pid), ''), 'a project'), 300), left(public.mention_plain(clean), 300));
    end if;
  end if;
  return new_id;
end;
$$;
revoke execute on function public.post_comment(uuid, text, uuid, text) from public, anon;
grant execute on function public.post_comment(uuid, text, uuid, text) to authenticated;

-- Change your own comment's words (as before); someone newly mentioned is told.
create or replace function public.edit_comment(cid uuid, words text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  clean text := btrim(coalesce(words, ''));
  pid uuid;
begin
  if char_length(clean) not between 1 and 2000 then
    raise exception 'Comments are 1 to 2,000 characters' using errcode = '22023';
  end if;
  update public.comments set body = clean, edited_at = now()
  where id = cid and author_id = (select auth.uid()) and deleted_at is null
  returning project_id into pid;
  if not found then
    raise exception 'Only the person who wrote it can change it' using errcode = '42501';
  end if;
  perform public.notify_mentions(pid, 'comment', cid, clean);
end;
$$;
revoke execute on function public.edit_comment(uuid, text) from public, anon;
grant execute on function public.edit_comment(uuid, text) to authenticated;
