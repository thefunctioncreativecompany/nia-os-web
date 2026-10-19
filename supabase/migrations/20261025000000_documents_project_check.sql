-- Save to project (build step 8): a document can only be put into a project you can edit.
-- Before, the person who made a document could set it to any project id. Removing a document
-- from a project (project_id = null) stays allowed for anyone who could edit it. Safe to run twice.

alter policy "Editors can update documents" on public.documents
  with check (project_id is null or public.can_edit_project(project_id));
