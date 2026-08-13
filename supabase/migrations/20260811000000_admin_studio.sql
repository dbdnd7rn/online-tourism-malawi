-- Secure role-based administration for the Online Tourism Malawi editorial studio.
-- Privileged access is resolved from public.profiles and enforced with RLS.

alter table public.profiles add column if not exists role text not null default 'member';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_role_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_role_check check (role in ('member', 'editor', 'admin'));
  end if;
end
$$;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'member');
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() = 'admin';
$$;

create or replace function public.can_manage_content()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() in ('editor', 'admin');
$$;

revoke all on function public.current_user_role() from public;
revoke all on function public.is_admin() from public;
revoke all on function public.can_manage_content() from public;
grant execute on function public.current_user_role() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.can_manage_content() to authenticated;

create or replace function public.prevent_profile_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Only an administrator can change member roles';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_roles on public.profiles;
create trigger protect_profile_roles
before update of role on public.profiles
for each row execute procedure public.prevent_profile_role_escalation();

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  actor_email text,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  resource_type text not null,
  record_id uuid,
  summary text,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_created_at_idx
  on public.admin_audit_log (created_at desc);

alter table public.admin_audit_log enable row level security;

drop policy if exists "Admins can read audit log" on public.admin_audit_log;
create policy "Admins can read audit log"
on public.admin_audit_log for select
using (public.is_admin());

grant select on public.admin_audit_log to authenticated;

create or replace function public.capture_admin_activity()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  changed_row jsonb;
  changed_id uuid;
  changed_summary text;
  current_email text;
begin
  changed_row := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  changed_id := nullif(changed_row ->> 'id', '')::uuid;
  changed_summary := coalesce(
    changed_row ->> 'title',
    changed_row ->> 'name',
    changed_row ->> 'subject',
    changed_row ->> 'email',
    changed_row ->> 'display_name',
    changed_id::text
  );

  select email into current_email from auth.users where id = auth.uid();

  insert into public.admin_audit_log
    (actor_id, actor_email, action, resource_type, record_id, summary)
  values
    (auth.uid(), current_email, tg_op, tg_table_name, changed_id, changed_summary);

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists audit_heritage_items on public.heritage_items;
create trigger audit_heritage_items after insert or update or delete on public.heritage_items
for each row execute procedure public.capture_admin_activity();
drop trigger if exists audit_museums on public.museums;
create trigger audit_museums after insert or update or delete on public.museums
for each row execute procedure public.capture_admin_activity();
drop trigger if exists audit_performances on public.performances;
create trigger audit_performances after insert or update or delete on public.performances
for each row execute procedure public.capture_admin_activity();
drop trigger if exists audit_events on public.events;
create trigger audit_events after insert or update or delete on public.events
for each row execute procedure public.capture_admin_activity();
drop trigger if exists audit_podcasts on public.podcasts;
create trigger audit_podcasts after insert or update or delete on public.podcasts
for each row execute procedure public.capture_admin_activity();
drop trigger if exists audit_creative_profiles on public.creative_profiles;
create trigger audit_creative_profiles after insert or update or delete on public.creative_profiles
for each row execute procedure public.capture_admin_activity();
drop trigger if exists audit_contact_messages on public.contact_messages;
create trigger audit_contact_messages after insert or update or delete on public.contact_messages
for each row execute procedure public.capture_admin_activity();
drop trigger if exists audit_submissions on public.submissions;
create trigger audit_submissions after insert or update or delete on public.submissions
for each row execute procedure public.capture_admin_activity();
drop trigger if exists audit_newsletter_subscribers on public.newsletter_subscribers;
create trigger audit_newsletter_subscribers after insert or update or delete on public.newsletter_subscribers
for each row execute procedure public.capture_admin_activity();
drop trigger if exists audit_profiles on public.profiles;
create trigger audit_profiles after update on public.profiles
for each row execute procedure public.capture_admin_activity();

-- Content editors and administrators can manage the public catalogue.
drop policy if exists "Editorial team can manage heritage" on public.heritage_items;
create policy "Editorial team can manage heritage" on public.heritage_items for all to authenticated
using (public.can_manage_content()) with check (public.can_manage_content());
drop policy if exists "Editorial team can manage museums" on public.museums;
create policy "Editorial team can manage museums" on public.museums for all to authenticated
using (public.can_manage_content()) with check (public.can_manage_content());
drop policy if exists "Editorial team can manage performances" on public.performances;
create policy "Editorial team can manage performances" on public.performances for all to authenticated
using (public.can_manage_content()) with check (public.can_manage_content());
drop policy if exists "Editorial team can manage events" on public.events;
create policy "Editorial team can manage events" on public.events for all to authenticated
using (public.can_manage_content()) with check (public.can_manage_content());
drop policy if exists "Editorial team can manage podcasts" on public.podcasts;
create policy "Editorial team can manage podcasts" on public.podcasts for all to authenticated
using (public.can_manage_content()) with check (public.can_manage_content());
drop policy if exists "Editorial team can manage creative profiles" on public.creative_profiles;
create policy "Editorial team can manage creative profiles" on public.creative_profiles for all to authenticated
using (public.can_manage_content()) with check (public.can_manage_content());

grant insert, update, delete on
  public.heritage_items,
  public.museums,
  public.performances,
  public.events,
  public.podcasts,
  public.creative_profiles
to authenticated;

-- Administrators can manage private workflows and the member directory.
drop policy if exists "Admins can read all profiles" on public.profiles;
create policy "Admins can read all profiles" on public.profiles for select to authenticated
using (public.is_admin());
drop policy if exists "Admins can update all profiles" on public.profiles;
create policy "Admins can update all profiles" on public.profiles for update to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins can manage contact messages" on public.contact_messages;
create policy "Admins can manage contact messages" on public.contact_messages for all to authenticated
using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins can manage submissions" on public.submissions;
create policy "Admins can manage submissions" on public.submissions for all to authenticated
using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins can manage subscribers" on public.newsletter_subscribers;
create policy "Admins can manage subscribers" on public.newsletter_subscribers for all to authenticated
using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins can inspect saved items" on public.saved_items;
create policy "Admins can inspect saved items" on public.saved_items for select to authenticated
using (public.is_admin());
drop policy if exists "Admins can remove saved items" on public.saved_items;
create policy "Admins can remove saved items" on public.saved_items for delete to authenticated
using (public.is_admin());

grant select, update, delete on
  public.contact_messages,
  public.submissions,
  public.newsletter_subscribers
to authenticated;

create or replace function public.admin_set_user_role(target_user_id uuid, new_role text)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_profile public.profiles;
begin
  if not public.is_admin() then
    raise exception 'Administrator access required';
  end if;
  if new_role not in ('member', 'editor', 'admin') then
    raise exception 'Invalid role';
  end if;

  update public.profiles
  set role = new_role, updated_at = now()
  where id = target_user_id
  returning * into updated_profile;

  if updated_profile.id is null then
    raise exception 'Profile not found';
  end if;
  return updated_profile;
end;
$$;

revoke all on function public.admin_set_user_role(uuid, text) from public;
grant execute on function public.admin_set_user_role(uuid, text) to authenticated;
