-- Portfolios, beta slice 1 (PORTFOLIOS_BUILD.md P1b, cut down; Ika, 2026-11-14: "build portfolios beta
-- … only allow access on test accounts"). Run in Supabase: SQL Editor > paste the whole file > Run.
-- Safe to run twice. Run after 20261020000000_projects.sql and 20261025030000_project_files_tags.sql.
--
-- A portfolio is a page built from one or more projects' final assets (files tagged final). This
-- slice holds the portfolio, its projects in order, its look and its cover. Client links, passcodes
-- and visitor tracking come in later slices (P6–P7).
--
-- Who can see what: people in the portfolio's workspace read and change it (as with projects). A
-- published portfolio's public page is drawn on the server, which checks `published_at` and opens
-- only the final files of the portfolio's own projects with links that last an hour.

create table if not exists public.portfolios (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  byline text not null default '' check (char_length(byline) <= 120),
  slug text not null unique check (slug ~ '^[a-z0-9-]{1,60}$'),
  template text not null default 'grid' check (template in ('grid', 'rows', 'slides')),
  background text not null default '#ffffff' check (background ~ '^#[0-9a-f]{6}$'),
  cover_file_id uuid references public.project_files (id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.portfolio_projects (
  portfolio_id uuid not null references public.portfolios (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  position integer not null default 0,
  primary key (portfolio_id, project_id)
);

create index if not exists portfolios_workspace on public.portfolios (workspace_id) where deleted_at is null;
create index if not exists portfolio_projects_project on public.portfolio_projects (project_id);

alter table public.portfolios enable row level security;
alter table public.portfolio_projects enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'portfolios' and policyname = 'Workspace members see its portfolios') then
    create policy "Workspace members see its portfolios" on public.portfolios
      for select to authenticated using (deleted_at is null and public.is_workspace_member(workspace_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'portfolios' and policyname = 'Workspace members make portfolios') then
    create policy "Workspace members make portfolios" on public.portfolios
      for insert to authenticated with check (owner_id = (select auth.uid()) and deleted_at is null and public.is_workspace_member(workspace_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'portfolios' and policyname = 'Workspace members change and remove portfolios') then
    create policy "Workspace members change and remove portfolios" on public.portfolios
      for update to authenticated
      using (deleted_at is null and public.is_workspace_member(workspace_id))
      with check (public.is_workspace_member(workspace_id));
  end if;

  -- A portfolio's projects: people in its workspace, and only projects they can see.
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'portfolio_projects' and policyname = 'Workspace members see portfolio projects') then
    create policy "Workspace members see portfolio projects" on public.portfolio_projects
      for select to authenticated using (
        exists (select 1 from public.portfolios f where f.id = portfolio_id and f.deleted_at is null and public.is_workspace_member(f.workspace_id))
      );
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'portfolio_projects' and policyname = 'Workspace members add portfolio projects') then
    create policy "Workspace members add portfolio projects" on public.portfolio_projects
      for insert to authenticated with check (
        public.can_view_project(project_id)
        and exists (select 1 from public.portfolios f where f.id = portfolio_id and f.deleted_at is null and public.is_workspace_member(f.workspace_id))
      );
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'portfolio_projects' and policyname = 'Workspace members order portfolio projects') then
    create policy "Workspace members order portfolio projects" on public.portfolio_projects
      for update to authenticated
      using (exists (select 1 from public.portfolios f where f.id = portfolio_id and f.deleted_at is null and public.is_workspace_member(f.workspace_id)))
      with check (exists (select 1 from public.portfolios f where f.id = portfolio_id and f.deleted_at is null and public.is_workspace_member(f.workspace_id)));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'portfolio_projects' and policyname = 'Workspace members take projects off portfolios') then
    create policy "Workspace members take projects off portfolios" on public.portfolio_projects
      for delete to authenticated using (
        exists (select 1 from public.portfolios f where f.id = portfolio_id and f.deleted_at is null and public.is_workspace_member(f.workspace_id))
      );
  end if;
end $$;

-- Only these columns change from the app; the workspace and owner stay as made.
revoke update on public.portfolios from authenticated;
grant select, insert on public.portfolios to authenticated;
grant update (title, byline, slug, template, background, cover_file_id, published_at, updated_at, deleted_at) on public.portfolios to authenticated;
grant select, insert, update (position), delete on public.portfolio_projects to authenticated;
