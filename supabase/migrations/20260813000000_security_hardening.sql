-- Production security guardrails for public input and member privileges.
-- Rate limiting and bot verification still belong at the Edge Function layer.

alter table public.newsletter_subscribers
  drop constraint if exists newsletter_subscribers_input_size;
alter table public.newsletter_subscribers
  add constraint newsletter_subscribers_input_size check (
    char_length(email) between 3 and 320
    and char_length(source) between 1 and 100
  ) not valid;
alter table public.newsletter_subscribers
  validate constraint newsletter_subscribers_input_size;

alter table public.contact_messages
  drop constraint if exists contact_messages_input_size;
alter table public.contact_messages
  add constraint contact_messages_input_size check (
    char_length(name) between 2 and 120
    and char_length(email) between 3 and 320
    and char_length(subject) between 2 and 180
    and char_length(message) between 10 and 5000
  ) not valid;
alter table public.contact_messages
  validate constraint contact_messages_input_size;

alter table public.submissions
  drop constraint if exists submissions_input_size;
alter table public.submissions
  add constraint submissions_input_size check (
    char_length(name) between 2 and 120
    and char_length(email) between 3 and 320
    and char_length(title) between 2 and 180
    and char_length(description) between 20 and 15000
    and pg_column_size(payload) <= 32768
  ) not valid;
alter table public.submissions
  validate constraint submissions_input_size;

alter table public.saved_items
  drop constraint if exists saved_items_input_size;
alter table public.saved_items
  add constraint saved_items_input_size check (
    char_length(item_key) between 1 and 240
    and char_length(item_type) between 1 and 80
    and char_length(title) between 1 and 240
    and char_length(route) between 1 and 500
    and pg_column_size(metadata) <= 32768
  ) not valid;
alter table public.saved_items
  validate constraint saved_items_input_size;

alter table public.profiles
  drop constraint if exists profiles_public_field_size;
alter table public.profiles
  add constraint profiles_public_field_size check (
    coalesce(char_length(display_name), 0) <= 120
    and coalesce(char_length(home_region), 0) <= 120
    and coalesce(char_length(avatar_url), 0) <= 2048
  ) not valid;
alter table public.profiles
  validate constraint profiles_public_field_size;

-- Roles may only be changed through public.admin_set_user_role().
revoke update on public.profiles from authenticated;
grant update (display_name, home_region, avatar_url, updated_at)
  on public.profiles to authenticated;

create index if not exists contact_messages_status_created_idx
  on public.contact_messages (status, created_at desc);
create index if not exists submissions_status_created_idx
  on public.submissions (status, created_at desc);
create index if not exists saved_items_user_created_idx
  on public.saved_items (user_id, created_at desc);

comment on table public.contact_messages is
  'Private visitor enquiries. Public inserts are size-limited; admin reads are enforced by RLS.';
comment on table public.submissions is
  'Private editorial contributions. Public inserts are size-limited; member/admin reads are enforced by RLS.';
