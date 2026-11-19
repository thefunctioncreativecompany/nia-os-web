-- Suggested changes from a meeting's notes (docs/MEETINGS_SPEC.md, step 2; Ika 2026-11-18): Claude
-- reads the notes and proposes milestones and actions, people for the cast and crew, and project
-- details. They wait on the meeting, marked "AI draft", until an editor applies or dismisses them:
-- nothing in the project changes without Apply. Run in Supabase: SQL Editor > paste the whole file
-- > Run. Safe to run twice. Run after 20261120000000_meetings.sql.

-- [{ "id", "kind", …what it changes…, "quote", "status": "proposed" | "applied" | "dismissed" }];
-- null until Nia has read the notes.
alter table public.meetings add column if not exists proposals jsonb check (proposals is null or (jsonb_typeof(proposals) = 'array' and pg_column_size(proposals) <= 200000));
-- When the suggestions were made.
alter table public.meetings add column if not exists proposals_at timestamptz;

-- Editors save the suggestions and mark each one applied or dismissed (the same rules as the rest
-- of the meeting: 20261120000000_meetings.sql).
grant update (proposals, proposals_at) on public.meetings to authenticated;
