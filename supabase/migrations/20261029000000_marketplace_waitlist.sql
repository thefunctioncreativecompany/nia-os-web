-- Marketplace coming soon (Ika's design, 2026-10-20): "Join the waitlist" saves 'marketplace' in
-- feature_waitlist. Run after 20261028000000_plans.sql (it keeps the plan names that migration
-- added). Safe to run twice.

alter table public.feature_waitlist drop constraint if exists feature_waitlist_feature_check;
alter table public.feature_waitlist add constraint feature_waitlist_feature_check
  check (feature in ('explore', 'inbox', 'starter', 'creator', 'pro', 'enterprise', 'marketplace'));
