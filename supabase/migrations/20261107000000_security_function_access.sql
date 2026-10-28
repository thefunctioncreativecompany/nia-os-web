-- Security review (2026-10-28): who can call the database's internal functions.
--
-- In plain words: Supabase lets anyone, even someone who isn't signed in, call most database
-- functions through its web API. Ours check permissions inside, so nothing leaked, but
-- signed-out visitors could still ask "can this person see project X?" or poke at the
-- functions that run behind the scenes when a project or account is saved. This closes that:
--
-- 1. The access checks (can someone see or edit a project, are they in a workspace) stay
--    available to signed-in people, because the database's own access rules use them, and are
--    closed to signed-out visitors.
-- 2. The behind-the-scenes functions that run automatically when rows are saved (triggers) are
--    closed to everyone; the database still runs them itself.
-- 3. shared_project stays open to signed-out visitors: the view-only share page needs it.
--
-- Run it in Supabase → SQL Editor (paste this file's contents). Safe to run twice.

-- 1. Access checks: signed-in only.
revoke execute on function public.can_edit_project(uuid) from public, anon;
revoke execute on function public.can_edit_project_path(text) from public, anon;
revoke execute on function public.can_view_project(uuid) from public, anon;
revoke execute on function public.is_project_owner(uuid) from public, anon;
revoke execute on function public.is_workspace_member(uuid) from public, anon;
revoke execute on function public.is_workspace_owner(uuid) from public, anon;
grant execute on function public.can_edit_project(uuid) to authenticated;
grant execute on function public.can_edit_project_path(text) to authenticated;
grant execute on function public.can_view_project(uuid) to authenticated;
grant execute on function public.is_project_owner(uuid) to authenticated;
grant execute on function public.is_workspace_member(uuid) to authenticated;
grant execute on function public.is_workspace_owner(uuid) to authenticated;

-- 2. Trigger functions: nobody calls these directly.
revoke execute on function public.accept_project_invites() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.projects_before_write() from public, anon, authenticated;
revoke execute on function public.projects_after_write() from public, anon, authenticated;
revoke execute on function public.documents_before_update() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.workspaces_plan_default() from public, anon, authenticated;
revoke execute on function public.workspaces_plan_guard() from public, anon, authenticated;

-- 3. The share page keeps working for people who aren't signed in.
grant execute on function public.shared_project(text) to anon, authenticated;
