-- Pausing a plan should stop new purchases without revoking time that members
-- have already paid for. Existing entitlements remain valid until expiry.

begin;

create or replace function public.has_active_premium_subscription()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.user_subscriptions us
    where us.user_id = (select auth.uid())
      and us.status = 'active'
      and us.starts_at <= now()
      and us.expires_at > now()
  );
$$;

revoke all on function public.has_active_premium_subscription() from public;
grant execute on function public.has_active_premium_subscription() to authenticated;

comment on function public.has_active_premium_subscription() is
  'Returns whether the current member has paid Premium time remaining. Plan active status controls new sales, not previously purchased access.';

commit;
