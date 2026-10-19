-- Audit (2026-10-19): pilot_clients, an imported contact list (names and emails) not used by the
-- app, was readable by every signed-in account. Removed at Ika's request. Safe to run twice.

drop table if exists public.pilot_clients;
