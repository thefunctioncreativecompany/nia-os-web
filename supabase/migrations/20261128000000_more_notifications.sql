-- More notifications (Ika, 2026-11-27, part 1 of 4). Run in Supabase: SQL Editor > paste the
-- whole file > Run. Safe to run twice. Changes no existing notification's words.
--
-- New:
--   * A new document in a project: everyone on it (as before), now also on the computer.
--   * Added to a project's cast or crew: only the person added, when they're on Nia (their
--     directory entry is linked to their account, or has their account's email).
--   * Shoot dates, due date or deliverables changed: everyone on the project, saying what changed.
--   * Budget changed: the owner and editors only (viewers never see the budget).
--   Several changes of the same kind by the same person within 10 minutes stay one notification
--   (the newest words), so editing a field doesn't send ten.
--
-- Each notification now says what it's about (`event`), so the computer's notices and Updates no
-- longer guess from the wording, and who made it (`actor_id`). Events: shared, access_request,
-- access_granted, comment, reply, doc_added, crew_added, shoot_dates, deliverables, budget,
-- activity (other edits, Updates only). Mentions and Inbox messages come later.

alter table public.notifications add column if not exists event text
  check (event is null or event ~ '^[a-z_]{1,40}$');
alter table public.notifications add column if not exists actor_id uuid references auth.users (id) on delete set null;

-- Notifications made by the older functions (shares, access requests, comments) get their event
-- from their wording, as the app did until now.
create or replace function public.notification_event(kind text, title text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when kind = 'shared' and title ~ ' asked to (edit|open) ' then 'access_request'
    when kind = 'shared' and title ~ '^You can now (edit|open) ' then 'access_granted'
    when kind = 'shared' then 'shared'
    when title ~ ' replied to your comment ' then 'reply'
    when title ~ ' commented on ' then 'comment'
    when title ~ ' added .+ to ' then 'doc_added'
    else 'activity'
  end;
$$;
revoke execute on function public.notification_event(text, text) from public, anon, authenticated;

create or replace function public.notifications_fill_event()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.event is null then
    new.event := public.notification_event(new.kind, new.title);
  end if;
  if new.actor_id is null and new.event in ('shared', 'access_request', 'comment', 'reply') then
    new.actor_id := auth.uid();
  end if;
  return new;
end;
$$;
revoke execute on function public.notifications_fill_event() from public, anon, authenticated;
drop trigger if exists notifications_fill_event on public.notifications;
create trigger notifications_fill_event
  before insert on public.notifications
  for each row execute function public.notifications_fill_event();

-- Earlier notifications get theirs too (Updates sorts by it).
update public.notifications set event = public.notification_event(kind, title) where event is null;

-- Tells the people on a project about a change, except the person who made it. Editors only
-- when `editors_only` (the budget). The same person's change of the same kind within 10 minutes
-- updates the unread notification instead of making another.
create or replace function public.notify_project_change(pid uuid, ev text, words text, detail text, editors_only boolean default false)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  owner uuid;
  updated uuid[];
begin
  select p.owner_id into owner from public.projects p where p.id = pid;
  with recipients as (
    select owner as uid
    union
    select m.user_id from public.project_members m
    where m.project_id = pid and (not editors_only or m.role = 'editor')
  ),
  refreshed as (
    update public.notifications n
    set title = left(words, 300), body = left(coalesce(detail, ''), 300), created_at = now()
    where n.project_id = pid and n.event = ev and n.actor_id is not distinct from me
      and n.read_at is null and n.archived_at is null and n.created_at > now() - interval '10 minutes'
      and n.user_id in (select uid from recipients)
    returning n.user_id
  )
  select coalesce(array_agg(user_id), '{}') into updated from refreshed;

  insert into public.notifications (user_id, project_id, kind, event, actor_id, title, body)
  select r.uid, pid, 'activity', ev, me, left(words, 300), left(coalesce(detail, ''), 300)
  from (
    select owner as uid
    union
    select m.user_id from public.project_members m
    where m.project_id = pid and (not editors_only or m.role = 'editor')
  ) r
  where r.uid is not null and r.uid is distinct from me and not (r.uid = any (updated));
end;
$$;
revoke execute on function public.notify_project_change(uuid, text, text, text, boolean) from public, anon, authenticated;

-- "3 Dec 2026", "3 Dec – 5 Dec 2026".
create or replace function public.day_range_text(a date, b date)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when a is null then ''
    when b is null or b = a then to_char(a, 'FMDD Mon YYYY')
    when extract(year from a) = extract(year from b) then to_char(a, 'FMDD Mon') || ' – ' || to_char(b, 'FMDD Mon YYYY')
    else to_char(a, 'FMDD Mon YYYY') || ' – ' || to_char(b, 'FMDD Mon YYYY')
  end;
$$;
revoke execute on function public.day_range_text(date, date) from public, anon, authenticated;

-- Collaborators' edits (as in 20261026010000_activity_documents_files.sql), now with the event
-- and who made it. A details change that only touched shoot dates, due date or deliverables has
-- its own notification (below), so its "updated" line stays out of notifications.
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
  if new.action = 'updated' and current_setting('nia.quiet_update', true) = 'on' then
    return new;
  end if;
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
  insert into public.notifications (user_id, project_id, kind, event, actor_id, title, body)
  select r.uid, new.project_id, 'activity',
    case when new.action = 'doc_added' then 'doc_added' else 'activity' end,
    new.actor_id,
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

-- Project changes (as in 20261106000000_project_details_crew.sql), plus the shoot dates, due date
-- and deliverables notifications.
create or replace function public.projects_after_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  who text;
  title text;
  shoot_changed boolean;
  due_changed boolean;
  deliverables_changed boolean;
  others_changed boolean;
  n int;
begin
  if tg_op = 'INSERT' then
    perform public.log_activity(new.id, 'created', new.title);
  elsif old.deleted_at is null and new.deleted_at is not null then
    perform public.log_activity(new.id, 'deleted', new.title);
  elsif new.share_token is distinct from old.share_token then
    perform public.log_activity(new.id, case when new.share_token is null then 'link_off' else 'link_on' end);
  elsif new.title is distinct from old.title then
    perform public.log_activity(new.id, 'renamed', new.title);
  elsif new.cover_url is distinct from old.cover_url then
    perform public.log_activity(new.id, 'cover_changed');
  else
    shoot_changed := (old.shoot_start, old.shoot_end) is distinct from (new.shoot_start, new.shoot_end);
    due_changed := old.due_date is distinct from new.due_date;
    deliverables_changed := old.deliverables is distinct from new.deliverables;
    others_changed := (old.description, old.production_type, old.stage, old.production_date, old.duration,
         old.director, old.writers, old.genres, old.stars, old.client, old.agency, old.notes, old.logline,
         old.usage, old.looks, old.publication, old.crew)
        is distinct from
        (new.description, new.production_type, new.stage, new.production_date, new.duration,
         new.director, new.writers, new.genres, new.stars, new.client, new.agency, new.notes, new.logline,
         new.usage, new.looks, new.publication, new.crew);
    if not (shoot_changed or due_changed or deliverables_changed or others_changed) then
      return null;
    end if;

    who := coalesce(nullif(public.display_name(auth.uid()), ''), 'Someone');
    title := coalesce(nullif(new.title, ''), 'Untitled project');
    if shoot_changed then
      perform public.notify_project_change(new.id, 'shoot_dates',
        who || case when new.shoot_start is null then ' removed the shoot dates of ' else ' changed the shoot dates of ' end || title,
        case when new.shoot_start is null then '' else 'Shoot: ' || public.day_range_text(new.shoot_start, new.shoot_end) end);
    end if;
    if due_changed or deliverables_changed then
      n := coalesce(jsonb_array_length(new.deliverables), 0);
      perform public.notify_project_change(new.id, 'deliverables',
        who || case
          when deliverables_changed and due_changed then ' changed the deliverables and due date of '
          when deliverables_changed then ' changed the deliverables of '
          when new.due_date is null then ' removed the due date of '
          else ' changed the due date of '
        end || title,
        concat_ws(' · ',
          case when n > 0 then n || case when n = 1 then ' deliverable' else ' deliverables' end end,
          case when new.due_date is not null then 'Due ' || to_char(new.due_date, 'FMDD Mon YYYY') end));
    end if;

    -- The project's Activity keeps its "updated details" line either way; its notification
    -- only when something else changed too.
    if not others_changed then
      perform set_config('nia.quiet_update', 'on', true);
    end if;
    perform public.log_activity(new.id, 'updated');
    perform set_config('nia.quiet_update', '', true);
  end if;
  return null;
end;
$$;
revoke execute on function public.projects_after_write() from public, anon, authenticated;

-- The budget: the owner and editors hear when it changes (a first budget of 0 isn't news).
create or replace function public.notify_budget_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  title text;
begin
  if tg_op = 'INSERT' and new.amount = 0 then
    return null;
  end if;
  -- Saving the details sends the budget again even when it's the same.
  if tg_op = 'UPDATE' and old.amount = new.amount and old.currency = new.currency then
    return null;
  end if;
  select coalesce(nullif(p.title, ''), 'Untitled project') into title from public.projects p where p.id = new.project_id;
  perform public.notify_project_change(new.project_id, 'budget',
    coalesce(nullif(public.display_name(auth.uid()), ''), 'Someone') || ' changed the budget of ' || title,
    'Now ' || new.currency || ' ' ||
      case when new.amount = trunc(new.amount) then to_char(new.amount, 'FM999,999,999,999,990')
           else to_char(new.amount, 'FM999,999,999,999,990.00') end,
    true);
  return null;
end;
$$;
revoke execute on function public.notify_budget_change() from public, anon, authenticated;
drop trigger if exists project_budgets_notify on public.project_budgets;
create trigger project_budgets_notify
  after insert or update of amount, currency on public.project_budgets
  for each row execute function public.notify_budget_change();

-- Added to the cast or crew: only that person, when they're on Nia and didn't add themselves.
create or replace function public.notify_cast_crew_added()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  person_user uuid;
  person_email text;
  title text;
  owner uuid;
  can_open boolean;
begin
  select pe.user_id, pe.email into person_user, person_email from public.people pe where pe.id = new.person_id;
  if person_user is null and person_email is not null then
    select u.id into person_user from auth.users u where lower(u.email) = lower(btrim(person_email)) limit 1;
  end if;
  if person_user is null or person_user = auth.uid() then
    return null;
  end if;
  select coalesce(nullif(p.title, ''), 'Untitled project'), p.owner_id into title, owner from public.projects p where p.id = new.project_id;
  can_open := person_user = owner
    or exists (select 1 from public.project_members m where m.project_id = new.project_id and m.user_id = person_user);
  insert into public.notifications (user_id, project_id, kind, event, actor_id, title, body)
  values (
    person_user, new.project_id, 'activity', 'crew_added', auth.uid(),
    left(coalesce(nullif(public.display_name(auth.uid()), ''), 'Someone') || ' added you to the '
      || case when new.kind = 'cast' then 'cast' else 'crew' end || ' of ' || title, 300),
    left(concat_ws(' · ',
      case when new.kind = 'cast' and coalesce(new."character", '') <> '' then new.role || ' as ' || new."character" else new.role end,
      case when not can_open then 'Ask for access to open the project' end), 300)
  );
  return null;
end;
$$;
revoke execute on function public.notify_cast_crew_added() from public, anon, authenticated;
drop trigger if exists cast_crew_notify on public.cast_crew;
create trigger cast_crew_notify
  after insert on public.cast_crew
  for each row execute function public.notify_cast_crew_added();
