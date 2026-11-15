-- Deleting a portfolio (soft). Run in Supabase: SQL Editor > paste the whole file > Run.
-- Safe to run twice. Run after 20261114000000_portfolios.sql.
--
-- A plain update can't do it: deleted portfolios are hidden from everyone, so Postgres refuses the
-- update that would hide one. Same pattern as soft_delete_project and soft_delete_document. Who may
-- delete is unchanged: anyone in the portfolio's workspace (the rule for changing a portfolio).

create or replace function public.soft_delete_portfolio(portfolio_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.portfolios f
    where f.id = portfolio_id
      and f.deleted_at is null
      and public.is_workspace_member(f.workspace_id)
  ) then
    raise exception 'Only people in this portfolio''s workspace can delete it'
      using errcode = '42501';
  end if;
  update public.portfolios set deleted_at = now(), updated_at = now() where id = portfolio_id;
end;
$$;

revoke execute on function public.soft_delete_portfolio(uuid) from public, anon;
grant execute on function public.soft_delete_portfolio(uuid) to authenticated;

-- Deleting goes through the function only.
revoke update (deleted_at) on public.portfolios from authenticated;
