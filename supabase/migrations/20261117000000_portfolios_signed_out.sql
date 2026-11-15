-- Signed-out visitors can't reach the portfolio tables at all (security audit, 2026-11-15).
-- Run in Supabase: SQL Editor > paste the whole file > Run. Safe to run twice. Run after
-- 20261114000000_portfolios.sql.
--
-- The tables' rules already showed signed-out visitors nothing (every rule is for signed-in
-- workspace members), but the tables were still open to them, so a rule written by mistake later
-- would have exposed rows. The other Nia tables are closed this way. A published portfolio's
-- public page (/p/<link>) is drawn on the server with Nia's own key, so it keeps working.

revoke all on public.portfolios, public.portfolio_projects from anon;
