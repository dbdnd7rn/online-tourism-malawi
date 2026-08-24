-- Premium subscription foundation for Online Tourism Malawi.
-- Prices are stored server-side in integer minor units. MWK uses whole kwacha;
-- USD uses cents. Only trusted backend/service-role code may create payment
-- orders or activate subscriptions.

begin;

create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  duration_days integer not null default 30 check (duration_days > 0 and duration_days <= 366),
  price_mwk integer not null check (price_mwk > 0),
  price_usd_cents integer not null check (price_usd_cents > 0),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscription_payment_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id),
  app_payment_id text not null unique,
  vac_payment_intent_id text unique,
  merchant_reference text unique,
  currency text not null check (currency in ('MWK', 'USD')),
  amount_minor bigint not null check (amount_minor > 0),
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'cancelled', 'expired')),
  checkout_url text,
  paid_at timestamptz,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id),
  status text not null default 'active'
    check (status in ('active', 'cancelled')),
  starts_at timestamptz not null,
  expires_at timestamptz not null,
  latest_payment_order_id uuid references public.subscription_payment_orders(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, plan_id),
  check (expires_at > starts_at)
);

create index if not exists subscription_payment_orders_user_created_idx
  on public.subscription_payment_orders (user_id, created_at desc);
create index if not exists subscription_payment_orders_status_created_idx
  on public.subscription_payment_orders (status, created_at desc);
create index if not exists user_subscriptions_user_expiry_idx
  on public.user_subscriptions (user_id, expires_at desc);

alter table public.subscription_plans enable row level security;
alter table public.subscription_payment_orders enable row level security;
alter table public.user_subscriptions enable row level security;

drop policy if exists "Public can read active subscription plans" on public.subscription_plans;
create policy "Public can read active subscription plans"
on public.subscription_plans for select
to anon, authenticated
using (active);

drop policy if exists "Admins can manage subscription plans" on public.subscription_plans;
create policy "Admins can manage subscription plans"
on public.subscription_plans for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Members can read their subscription payment orders" on public.subscription_payment_orders;
create policy "Members can read their subscription payment orders"
on public.subscription_payment_orders for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Admins can read subscription payment orders" on public.subscription_payment_orders;
create policy "Admins can read subscription payment orders"
on public.subscription_payment_orders for select
to authenticated
using (public.is_admin());

drop policy if exists "Members can read their subscriptions" on public.user_subscriptions;
create policy "Members can read their subscriptions"
on public.user_subscriptions for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Admins can read all subscriptions" on public.user_subscriptions;
create policy "Admins can read all subscriptions"
on public.user_subscriptions for select
to authenticated
using (public.is_admin());

grant select on public.subscription_plans to anon, authenticated;
grant insert, update, delete on public.subscription_plans to authenticated;
grant select on public.subscription_payment_orders, public.user_subscriptions to authenticated;
grant select, insert, update, delete on public.subscription_plans,
  public.subscription_payment_orders,
  public.user_subscriptions
to service_role;

-- All catalogue records remain discoverable. access_level controls whether the
-- actual media experience requires an active Premium subscription.
do $$
declare
  table_name text;
  constraint_name text;
begin
  foreach table_name in array array[
    'heritage_items',
    'museums',
    'performances',
    'events',
    'podcasts',
    'creative_profiles',
    'media_items'
  ] loop
    execute format(
      'alter table public.%I add column if not exists access_level text not null default ''free''',
      table_name
    );
    constraint_name := table_name || '_access_level_check';
    if not exists (select 1 from pg_constraint where conname = constraint_name) then
      execute format(
        'alter table public.%I add constraint %I check (access_level in (''free'', ''premium''))',
        table_name,
        constraint_name
      );
    end if;
  end loop;
end
$$;

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
    join public.subscription_plans sp on sp.id = us.plan_id
    where us.user_id = (select auth.uid())
      and us.status = 'active'
      and us.starts_at <= now()
      and us.expires_at > now()
      and sp.active
  );
$$;

revoke all on function public.has_active_premium_subscription() from public;
grant execute on function public.has_active_premium_subscription() to authenticated;

-- Administrators can change the plan without redeploying the frontend.
insert into public.subscription_plans (
  slug,
  name,
  description,
  duration_days,
  price_mwk,
  price_usd_cents,
  active,
  sort_order
)
values (
  'premium-monthly',
  'Premium Monthly',
  'Thirty days of access to premium cultural, heritage and media content.',
  30,
  8500,
  500,
  true,
  1
)
on conflict (slug) do nothing;

-- Reuse the existing Admin Studio audit trail for plan changes.
drop trigger if exists audit_subscription_plans on public.subscription_plans;
create trigger audit_subscription_plans
after insert or update or delete on public.subscription_plans
for each row execute procedure public.capture_admin_activity();

commit;
