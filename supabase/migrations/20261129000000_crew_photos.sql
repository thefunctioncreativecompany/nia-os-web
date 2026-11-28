-- Crew photos (2026-11-28). Cast & crew lists show the Nia profile photo of anyone linked to a Nia
-- account, but profiles are private to their owner, so the lookup always came back empty and
-- everyone showed initials. This returns only the photo (no name, email or anything else), and
-- only for accounts linked to a person the caller can already see in their Cast & crew (the same
-- rule as "people: read"). Signed-in people only. Safe to run twice.

create or replace function public.crew_photos(user_ids uuid[])
returns table (id uuid, avatar_url text)
language sql
stable
security definer
set search_path = ''
as $$
  select pr.id, pr.avatar_url
  from public.profiles pr
  where (select auth.uid()) is not null
    and cardinality(user_ids) <= 500
    and pr.id = any(user_ids)
    and pr.avatar_url is not null
    and exists (
      select 1 from public.people pe
      where pe.user_id = pr.id
        and pe.deleted_at is null
        and (
          public.is_workspace_member(pe.workspace_id)
          or exists (
            select 1 from public.cast_crew c
            where c.person_id = pe.id and c.deleted_at is null and public.can_view_project(c.project_id)
          )
        )
    );
$$;

revoke execute on function public.crew_photos(uuid[]) from public, anon;
grant execute on function public.crew_photos(uuid[]) to authenticated;
