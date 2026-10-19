-- Live project page (Fix 8): an open project updates when a collaborator changes it.
-- Adds projects and activity to Supabase Realtime. Row Level Security still decides who hears
-- about what, so people only get changes to projects they can open. Safe to run twice.

do $$
declare
  t text;
begin
  foreach t in array array['projects', 'activity'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
