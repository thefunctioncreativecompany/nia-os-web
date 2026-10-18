-- Nia OS: let users see the files in their own avatars folder.
-- Run in Supabase: Dashboard → SQL Editor → New query → paste → Run. Safe to run more than once.
--
-- Deleting a file needs both select and delete permission, so without this the old
-- photo is left behind whenever someone uploads a new one.

drop policy if exists "Users can view their own avatar files" on storage.objects;
create policy "Users can view their own avatar files"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
