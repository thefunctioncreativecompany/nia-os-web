-- Templates (TEMPLATES_BUILD.md): what Nia learns from template use, documents made from
-- templates, and "Request a template". Adapted from the supplied 20261019000000_templates.sql:
--   * The person's role is `profiles.profession` (chosen at onboarding), so profiles is untouched.
--     (`profiles.role` is the free-text job title in Settings → Profile.)
--   * Documents follow project access (can_view_project / can_edit_project) and soft-delete.
--   * The `document-images` storage bucket waits for the storyboard step, with its policies.
-- Safe to run more than once.

-- 1) Template events: views, uses, completions and searches ---------------------------
create table if not exists public.template_events (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  template_code text not null check (char_length(template_code) <= 10),  -- manifest `code`, e.g. 'D01'
  type text not null check (type in ('view', 'use', 'complete', 'search')),
  project_id uuid references public.projects (id) on delete set null,     -- which project it was used in
  query text check (char_length(query) <= 200),                           -- for type = 'search'
  created_at timestamptz not null default now()
);
create index if not exists template_events_user_time on public.template_events (user_id, created_at desc);

alter table public.template_events enable row level security;
drop policy if exists "People can read their own template events" on public.template_events;
create policy "People can read their own template events" on public.template_events
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "People can record their own template events" on public.template_events;
create policy "People can record their own template events" on public.template_events
  for insert to authenticated with check (user_id = (select auth.uid()));
-- "Reset what Nia learned" deletes the person's own history (personal data, so a real delete).
drop policy if exists "People can clear their own template events" on public.template_events;
create policy "People can clear their own template events" on public.template_events
  for delete to authenticated using (user_id = (select auth.uid()));

-- 2) Documents made from templates (TEMPLATE_ENGINE.md §6) ---------------------------
-- A document without a project is a personal draft: only its creator sees it.
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects (id) on delete cascade,
  template_code text not null check (char_length(template_code) <= 10),
  title text not null check (char_length(title) between 1 and 200),
  data jsonb not null default '[]'::jsonb,          -- one entry per section
  added jsonb not null default '[]'::jsonb,         -- boolean per section (builder templates)
  status text not null default 'draft' check (status in ('draft', 'ready', 'paid')),
  schema_version text not null check (char_length(schema_version) <= 20),
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists documents_project on public.documents (project_id, updated_at desc) where deleted_at is null;
create index if not exists documents_owner on public.documents (created_by, updated_at desc) where deleted_at is null;

drop trigger if exists documents_set_updated_at on public.documents;
create trigger documents_set_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();

-- Who made it never changes, and only the creator or the project owner can delete (soft).
create or replace function public.documents_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.created_by = old.created_by;
  if new.deleted_at is distinct from old.deleted_at
     and old.created_by <> (select auth.uid())
     and not (old.project_id is not null and public.is_project_owner(old.project_id)) then
    raise exception 'Only the person who made this document or the project owner can delete it';
  end if;
  return new;
end;
$$;
drop trigger if exists documents_before_update on public.documents;
create trigger documents_before_update
  before update on public.documents
  for each row execute function public.documents_before_update();

alter table public.documents enable row level security;
drop policy if exists "People with access can view documents" on public.documents;
create policy "People with access can view documents" on public.documents
  for select to authenticated using (
    deleted_at is null and (
      created_by = (select auth.uid())
      or (project_id is not null and public.can_view_project(project_id))
    )
  );
drop policy if exists "People can create documents where they can edit" on public.documents;
create policy "People can create documents where they can edit" on public.documents
  for insert to authenticated with check (
    created_by = (select auth.uid())
    and deleted_at is null
    and (project_id is null or public.can_edit_project(project_id))
  );
drop policy if exists "Editors can update documents" on public.documents;
create policy "Editors can update documents" on public.documents
  for update to authenticated
  using (
    deleted_at is null and (
      created_by = (select auth.uid())
      or (project_id is not null and public.can_edit_project(project_id))
    )
  )
  with check (
    created_by = (select auth.uid())
    or (project_id is not null and public.can_edit_project(project_id))
  );
-- No delete policy: documents are soft-deleted by setting deleted_at.

-- 3) "Can't find what you need? Request a template" ----------------------------------
create table if not exists public.template_requests (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  request text not null check (char_length(request) between 1 and 1000),
  role text check (char_length(role) <= 80),
  created_at timestamptz not null default now()
);
alter table public.template_requests enable row level security;
drop policy if exists "People can send template requests" on public.template_requests;
create policy "People can send template requests" on public.template_requests
  for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "People can read their own template requests" on public.template_requests;
create policy "People can read their own template requests" on public.template_requests
  for select to authenticated using (user_id = (select auth.uid()));
