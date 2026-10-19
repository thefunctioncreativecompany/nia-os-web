-- People fields (T5, Ika 2026-10-19): type a name, @username or email and matching Nia
-- profiles pop up. What the search may reveal:
--   * @username  → any Nia user (usernames are public handles), by the start of the handle.
--   * an email   → only an exact match, and the email itself is never returned.
--   * a name     → only people you already work with (share a project or a workspace).
-- It returns name, username, photo and profession, never emails or phone numbers, and only to
-- signed-in people. Safe to run twice.

create or replace function public.find_people(q text)
returns table (id uuid, full_name text, username text, avatar_url text, profession text)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  term text := trim(coalesce(q, ''));
begin
  if me is null or char_length(term) < 2 or char_length(term) > 120 then
    return;
  end if;

  if left(term, 1) = '@' then
    return query
      select p.id, p.full_name, p.username, p.avatar_url, p.profession
      from public.profiles p
      where p.username is not null
        and p.username like replace(replace(lower(substr(term, 2)), '%', ''), '_', '\_') || '%'
      order by p.username
      limit 6;
  elsif term ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    return query
      select p.id, p.full_name, p.username, p.avatar_url, p.profession
      from auth.users u
      join public.profiles p on p.id = u.id
      where lower(u.email) = lower(term)
      limit 1;
  else
    return query
      with circle as (
        -- Owners and members of projects I own or am a member of.
        select pr.owner_id as uid from public.projects pr
        where pr.deleted_at is null
          and (pr.owner_id = me or exists (select 1 from public.project_members m where m.project_id = pr.id and m.user_id = me))
        union
        select m2.user_id from public.project_members m2
        join public.projects pr2 on pr2.id = m2.project_id and pr2.deleted_at is null
        where pr2.owner_id = me or exists (select 1 from public.project_members m3 where m3.project_id = pr2.id and m3.user_id = me)
        union
        -- Members of workspaces I belong to.
        select w2.user_id from public.workspace_members w1
        join public.workspace_members w2 on w2.workspace_id = w1.workspace_id
        where w1.user_id = me
      )
      select p.id, p.full_name, p.username, p.avatar_url, p.profession
      from public.profiles p
      join circle c on c.uid = p.id
      where p.id <> me
        and (p.full_name ilike '%' || replace(replace(term, '%', ''), '_', '\_') || '%'
             or p.username ilike replace(replace(term, '%', ''), '_', '\_') || '%')
      order by p.full_name
      limit 6;
  end if;
end;
$$;

revoke execute on function public.find_people(text) from public, anon;
grant execute on function public.find_people(text) to authenticated;
