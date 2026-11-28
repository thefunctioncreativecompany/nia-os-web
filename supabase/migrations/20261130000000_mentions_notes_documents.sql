-- @mentions in meeting notes and documents (Ika, 2026-11-27, more notifications part 3 of 4).
-- Run in Supabase: SQL Editor > paste the whole file > Run. Safe to run twice. Run after
-- 20261129000000_mentions.sql. Changes no existing meeting, document or notification.
--
-- Meeting notes: typing @ suggests the people on the project, as in comments; a pick is saved in
-- the notes as [@ id="…" label="Ama Owusu"].
-- Documents (call sheets, shot lists…): typing @ in a text box suggests them too and writes their
-- @username; an @username, or @ followed by someone's exact email, of a person on the project counts.
-- Either way, each person mentioned who is on the project is told once per meeting or document,
-- when it's saved: "Ika mentioned you in Kickoff call notes on Lookbook", with the line they're in,
-- and the notification opens that meeting or document (`link`, new). People outside the project:
-- part 4.

alter table public.notifications add column if not exists link text
  check (link is null or (char_length(link) <= 300 and link ~ '^/[A-Za-z0-9]'));

-- Tells each of `uids` who's on the project (and isn't the writer) that they were mentioned in
-- `place`, once per place. `words` is where to find the line each person is in.
create or replace function public.tell_mentioned(pid uuid, src text, src_id uuid, uids uuid[], place text, words text, link text)
returns uuid[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  who text;
  told uuid[];
  person uuid;
  line text;
begin
  if pid is null or coalesce(cardinality(uids), 0) = 0 then
    return '{}';
  end if;
  who := coalesce(nullif(public.display_name(me), ''), 'Someone');
  with allowed as (
    select distinct u as uid from unnest(uids) u
    where u is distinct from me
      and (u = (select pr.owner_id from public.projects pr where pr.id = pid)
        or exists (select 1 from public.project_members m where m.project_id = pid and m.user_id = u))
    limit 20
  ),
  fresh as (
    insert into public.mentions (user_id, project_id, source, source_id, mentioned_by)
    select a.uid, pid, src, src_id, me from allowed a
    on conflict on constraint mentions_once do nothing
    returning user_id
  )
  select coalesce(array_agg(user_id), '{}') into told from fresh;

  foreach person in array told loop
    -- The line they're in (meeting notes: their mention's code; documents: the text around it).
    line := coalesce(
      substring(words from '[^\n]*\[@[^\]]*id="' || person || '"[^\n]*'),
      substring(words from '(?i)[^\n]{0,120}@' || (select regexp_replace(p.username, '([^A-Za-z0-9])', '\\\1', 'g') from public.profiles p where p.id = person) || '[^\n]{0,120}'),
      substring(words from '(?i)[^\n]{0,120}@' || (select regexp_replace(u.email, '([^A-Za-z0-9])', '\\\1', 'g') from auth.users u where u.id = person) || '[^\n]{0,120}'),
      '');
    insert into public.notifications (user_id, project_id, kind, event, actor_id, title, body, link)
    values (person, pid, 'activity', 'mention', me,
      left(who || ' mentioned you in ' || place, 300),
      left(btrim(public.mention_plain(regexp_replace(line, '^\s*(#+|[-*+]|\d+[.)])\s+', ''))), 300),
      link);
  end loop;
  return told;
end;
$$;
revoke execute on function public.tell_mentioned(uuid, text, uuid, uuid[], text, text, text) from public, anon, authenticated;

-- Meeting notes: mentions saved as codes.
create or replace function public.meetings_mentions()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  uids uuid[];
  project_title text;
begin
  if new.deleted_at is not null or new.summary !~ '\[@' then
    return null;
  end if;
  select coalesce(array_agg(distinct m[1]::uuid), '{}') into uids
  from regexp_matches(new.summary, '\[@[^\]]*?id="([0-9a-fA-F-]{36})"', 'g') m;
  select coalesce(nullif(pr.title, ''), 'a project') into project_title from public.projects pr where pr.id = new.project_id;
  perform public.tell_mentioned(new.project_id, 'meeting', new.id, uids,
    left(new.title, 120) || ' notes on ' || project_title, new.summary,
    '/projects/' || new.project_id || '?meeting=' || new.id);
  return null;
end;
$$;
revoke execute on function public.meetings_mentions() from public, anon, authenticated;
drop trigger if exists meetings_mentions on public.meetings;
create trigger meetings_mentions
  after insert or update of summary on public.meetings
  for each row execute function public.meetings_mentions();

-- Documents: @username, or @ and an exact email, of someone on the project, anywhere in its text.
create or replace function public.documents_mentions()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  words text;
  handles text[];
  emails text[];
  uids uuid[];
  project_title text;
begin
  if new.project_id is null or new.deleted_at is not null then
    return null;
  end if;
  -- The document's text, one value a line (its answers are strings inside its sections).
  select coalesce(string_agg(v, E'\n'), '') into words
  from jsonb_path_query(new.data, 'strict $.**') j(x), lateral (select x #>> '{}' as v) s
  where jsonb_typeof(x) = 'string' and v like '%@%';
  if words = '' then
    return null;
  end if;
  select coalesce(array_agg(distinct lower(rtrim(m[1], '.'))), '{}') into emails
  from regexp_matches(words, '(?:^|[\s(,;])@([^\s@,;()]+@[^\s@,;()]+\.[A-Za-z]{2,})', 'g') m;
  select coalesce(array_agg(distinct lower(rtrim(m[1], '.'))), '{}') into handles
  from regexp_matches(words, '(?:^|[\s(,;])@([A-Za-z0-9._]{3,31})(?![A-Za-z0-9._]*@)', 'g') m;
  if cardinality(emails) = 0 and cardinality(handles) = 0 then
    return null;
  end if;
  select coalesce(array_agg(distinct u.id), '{}') into uids
  from auth.users u
  left join public.profiles p on p.id = u.id
  where (p.username = any (handles) or lower(u.email) = any (emails))
    and (u.id = (select pr.owner_id from public.projects pr where pr.id = new.project_id)
      or exists (select 1 from public.project_members m where m.project_id = new.project_id and m.user_id = u.id));
  select coalesce(nullif(pr.title, ''), 'a project') into project_title from public.projects pr where pr.id = new.project_id;
  perform public.tell_mentioned(new.project_id, 'document', new.id, uids,
    left(new.title, 120) || ' on ' || project_title, words,
    '/templates/' || new.template_code || '?doc=' || new.id);
  return null;
end;
$$;
revoke execute on function public.documents_mentions() from public, anon, authenticated;
drop trigger if exists documents_mentions on public.documents;
create trigger documents_mentions
  after insert or update of data, project_id on public.documents
  for each row execute function public.documents_mentions();
