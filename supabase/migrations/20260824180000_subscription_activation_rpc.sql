-- Trusted fulfilment boundary for verified VAC Payments events.
-- The callback Edge Function records each VAC outbox idempotency key and then
-- calls the service-role-only activation RPC. Duplicate delivery is safe.

begin;

create table if not exists public.subscription_payment_events (
  idempotency_key text primary key,
  app_payment_id text not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now()
);

create index if not exists subscription_payment_events_app_payment_idx
  on public.subscription_payment_events (app_payment_id, received_at desc);

alter table public.subscription_payment_events enable row level security;
revoke all on public.subscription_payment_events from anon, authenticated;
grant select, insert on public.subscription_payment_events to service_role;

create or replace function public.activate_subscription_from_verified_payment(
  p_payment_order_id uuid,
  p_verified_at timestamptz default now()
)
returns public.user_subscriptions
language plpgsql
security definer
set search_path = public
as $$
declare
  payment_order public.subscription_payment_orders;
  plan_row public.subscription_plans;
  current_subscription public.user_subscriptions;
  activated_subscription public.user_subscriptions;
  activation_time timestamptz := coalesce(p_verified_at, now());
  extension_base timestamptz;
begin
  select * into payment_order
  from public.subscription_payment_orders
  where id = p_payment_order_id
  for update;

  if payment_order.id is null then
    raise exception 'Subscription payment order not found';
  end if;

  select * into plan_row
  from public.subscription_plans
  where id = payment_order.plan_id;

  if plan_row.id is null then
    raise exception 'Subscription plan not found';
  end if;

  select * into current_subscription
  from public.user_subscriptions
  where user_id = payment_order.user_id
    and plan_id = payment_order.plan_id
  for update;

  -- A repeated verified callback for the same order must never extend access twice.
  if payment_order.status = 'paid' then
    if current_subscription.id is null
      or current_subscription.latest_payment_order_id is distinct from payment_order.id then
      raise exception 'Paid payment order is not bound to the expected subscription';
    end if;
    return current_subscription;
  end if;

  if payment_order.status <> 'pending' then
    raise exception 'Subscription payment order is not pending';
  end if;

  update public.subscription_payment_orders
  set status = 'paid',
      paid_at = coalesce(paid_at, activation_time),
      verified_at = activation_time,
      updated_at = activation_time
  where id = payment_order.id;

  if current_subscription.id is null then
    insert into public.user_subscriptions (
      user_id,
      plan_id,
      status,
      starts_at,
      expires_at,
      latest_payment_order_id
    ) values (
      payment_order.user_id,
      payment_order.plan_id,
      'active',
      activation_time,
      activation_time + make_interval(days => plan_row.duration_days),
      payment_order.id
    )
    returning * into activated_subscription;
  else
    extension_base := greatest(current_subscription.expires_at, activation_time);
    update public.user_subscriptions
    set status = 'active',
        starts_at = case
          when current_subscription.expires_at > activation_time
            then current_subscription.starts_at
          else activation_time
        end,
        expires_at = extension_base + make_interval(days => plan_row.duration_days),
        latest_payment_order_id = payment_order.id,
        updated_at = activation_time
    where id = current_subscription.id
    returning * into activated_subscription;
  end if;

  return activated_subscription;
end;
$$;

revoke all on function public.activate_subscription_from_verified_payment(uuid, timestamptz) from public;
revoke all on function public.activate_subscription_from_verified_payment(uuid, timestamptz) from anon, authenticated;
grant execute on function public.activate_subscription_from_verified_payment(uuid, timestamptz) to service_role;

commit;
