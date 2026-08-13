-- Phase 3: managed media storage and complete editorial publishing workflows.
-- Safe to run more than once against the Online Tourism Malawi project.

begin;

-- Public delivery buckets. Object writes remain restricted by RLS below.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('tourism-images', 'tourism-images', true, 10485760, array['image/jpeg','image/png','image/webp','image/avif','image/gif','image/svg+xml']),
  ('tourism-audio', 'tourism-audio', true, 104857600, array['audio/mpeg','audio/mp4','audio/ogg','audio/wav','audio/webm']),
  ('tourism-video', 'tourism-video', true, 524288000, array['video/mp4','video/webm','video/ogg']),
  ('tourism-documents', 'tourism-documents', true, 26214400, array['application/pdf','text/plain','application/epub+zip'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view tourism media" on storage.objects;
create policy "Public can view tourism media"
on storage.objects for select
to public
using (bucket_id in ('tourism-images','tourism-audio','tourism-video','tourism-documents'));

drop policy if exists "Editorial team can upload tourism media" on storage.objects;
create policy "Editorial team can upload tourism media"
on storage.objects for insert
to authenticated
with check (
  bucket_id in ('tourism-images','tourism-audio','tourism-video','tourism-documents')
  and public.can_manage_content()
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Editorial team can update tourism media" on storage.objects;
create policy "Editorial team can update tourism media"
on storage.objects for update
to authenticated
using (bucket_id in ('tourism-images','tourism-audio','tourism-video','tourism-documents') and public.can_manage_content())
with check (bucket_id in ('tourism-images','tourism-audio','tourism-video','tourism-documents') and public.can_manage_content());

drop policy if exists "Editorial team can delete tourism media" on storage.objects;
create policy "Editorial team can delete tourism media"
on storage.objects for delete
to authenticated
using (bucket_id in ('tourism-images','tourism-audio','tourism-video','tourism-documents') and public.can_manage_content());

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  bucket_id text not null check (bucket_id in ('tourism-images','tourism-audio','tourism-video','tourism-documents')),
  object_path text not null,
  public_url text not null,
  file_name text not null,
  mime_type text not null,
  file_size bigint not null check (file_size > 0),
  asset_kind text not null check (asset_kind in ('image','audio','video','document')),
  title text,
  alt_text text,
  credit_line text,
  rights_holder text,
  license text,
  source_url text,
  consent_status text not null default 'not_required'
    check (consent_status in ('not_required','pending','granted','restricted')),
  uploaded_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bucket_id, object_path)
);

create index if not exists media_assets_kind_created_idx
  on public.media_assets (asset_kind, created_at desc);
create index if not exists media_assets_uploader_idx
  on public.media_assets (uploaded_by, created_at desc);

alter table public.media_assets enable row level security;

drop policy if exists "Editorial team can read media assets" on public.media_assets;
create policy "Editorial team can read media assets"
on public.media_assets for select to authenticated
using (public.can_manage_content());

drop policy if exists "Editorial team can create media assets" on public.media_assets;
create policy "Editorial team can create media assets"
on public.media_assets for insert to authenticated
with check (public.can_manage_content() and uploaded_by = auth.uid());

drop policy if exists "Editorial team can update media assets" on public.media_assets;
create policy "Editorial team can update media assets"
on public.media_assets for update to authenticated
using (public.can_manage_content()) with check (public.can_manage_content());

drop policy if exists "Editorial team can delete media assets" on public.media_assets;
create policy "Editorial team can delete media assets"
on public.media_assets for delete to authenticated
using (public.can_manage_content());

grant select, insert, update, delete on public.media_assets to authenticated;

-- A consistent publishing state is added without breaking existing published queries.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'heritage_items','museums','performances','events','podcasts','creative_profiles','media_items'
  ] loop
    execute format('alter table public.%I add column if not exists publication_status text not null default ''published''', table_name);
    execute format('alter table public.%I add column if not exists publish_at timestamptz', table_name);
    execute format('alter table public.%I add column if not exists featured boolean not null default false', table_name);
    execute format('alter table public.%I add column if not exists archived_at timestamptz', table_name);
    execute format('alter table public.%I add column if not exists updated_at timestamptz not null default now()', table_name);
    execute format('alter table public.%I add column if not exists updated_by uuid references auth.users(id) on delete set null', table_name);
    execute format('update public.%I set publication_status = case when published then ''published'' else ''draft'' end', table_name);
  end loop;
end
$$;

do $$
declare
  table_name text;
  constraint_name text;
begin
  foreach table_name in array array[
    'heritage_items','museums','performances','events','podcasts','creative_profiles','media_items'
  ] loop
    constraint_name := table_name || '_publication_status_check';
    if not exists (select 1 from pg_constraint where conname = constraint_name) then
      execute format('alter table public.%I add constraint %I check (publication_status in (''draft'',''scheduled'',''published'',''archived''))', table_name, constraint_name);
    end if;
  end loop;
end
$$;

create or replace function public.sync_editorial_publication_state()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  if new.publication_status = 'archived' then
    new.published := false;
    new.archived_at := coalesce(new.archived_at, now());
  elsif new.publication_status = 'draft' then
    new.published := false;
    new.archived_at := null;
    new.publish_at := null;
  elsif new.publication_status = 'scheduled' then
    if new.publish_at is null or new.publish_at <= now() then
      raise exception 'Scheduled content requires a future publication time';
    end if;
    new.published := true;
    new.archived_at := null;
  else
    new.publication_status := 'published';
    new.published := true;
    new.archived_at := null;
    new.publish_at := null;
  end if;
  return new;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'heritage_items','museums','performances','events','podcasts','creative_profiles','media_items'
  ] loop
    execute format('drop trigger if exists sync_publication_state on public.%I', table_name);
    execute format('create trigger sync_publication_state before insert or update on public.%I for each row execute procedure public.sync_editorial_publication_state()', table_name);
  end loop;
end
$$;

-- Replace permissive public policies so scheduled items remain private until their release time.
drop policy if exists "Public can read published heritage" on public.heritage_items;
create policy "Public can read published heritage" on public.heritage_items for select
using (published and archived_at is null and (publish_at is null or publish_at <= now()));
drop policy if exists "Public can read published museums" on public.museums;
create policy "Public can read published museums" on public.museums for select
using (published and archived_at is null and (publish_at is null or publish_at <= now()));
drop policy if exists "Public can read published performances" on public.performances;
create policy "Public can read published performances" on public.performances for select
using (published and archived_at is null and (publish_at is null or publish_at <= now()));
drop policy if exists "Public can read published events" on public.events;
create policy "Public can read published events" on public.events for select
using (published and archived_at is null and (publish_at is null or publish_at <= now()));
drop policy if exists "Public can read published podcasts" on public.podcasts;
create policy "Public can read published podcasts" on public.podcasts for select
using (published and archived_at is null and (publish_at is null or publish_at <= now()));
drop policy if exists "Public can read published creative profiles" on public.creative_profiles;
create policy "Public can read published creative profiles" on public.creative_profiles for select
using (published and archived_at is null and (publish_at is null or publish_at <= now()));
drop policy if exists "Public can read published media" on public.media_items;
create policy "Public can read published media" on public.media_items for select
using (published and archived_at is null and (publish_at is null or publish_at <= now()));

-- Ensure media_items participates in editorial administration and audit history.
drop policy if exists "Editorial team can manage media" on public.media_items;
create policy "Editorial team can manage media" on public.media_items for all to authenticated
using (public.can_manage_content()) with check (public.can_manage_content());
grant insert, update, delete on public.media_items to authenticated;

drop trigger if exists audit_media_items on public.media_items;
create trigger audit_media_items after insert or update or delete on public.media_items
for each row execute procedure public.capture_admin_activity();
drop trigger if exists audit_media_assets on public.media_assets;
create trigger audit_media_assets after insert or update or delete on public.media_assets
for each row execute procedure public.capture_admin_activity();

-- Immutable snapshots support version comparison and one-click restoration in the studio.
create table if not exists public.content_versions (
  id uuid primary key default gen_random_uuid(),
  resource_type text not null,
  record_id uuid not null,
  action text not null check (action in ('UPDATE','DELETE')),
  snapshot jsonb not null,
  actor_id uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create index if not exists content_versions_record_idx
  on public.content_versions (resource_type, record_id, created_at desc);
alter table public.content_versions enable row level security;
drop policy if exists "Editorial team can read content versions" on public.content_versions;
create policy "Editorial team can read content versions" on public.content_versions for select to authenticated
using (public.can_manage_content());
grant select on public.content_versions to authenticated;

create or replace function public.capture_content_version()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.content_versions (resource_type, record_id, action, snapshot, actor_id)
  values (tg_table_name, old.id, tg_op, to_jsonb(old), auth.uid());
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'heritage_items','museums','performances','events','podcasts','creative_profiles','media_items'
  ] loop
    execute format('drop trigger if exists capture_content_version on public.%I', table_name);
    execute format('create trigger capture_content_version before update or delete on public.%I for each row execute procedure public.capture_content_version()', table_name);
  end loop;
end
$$;

commit;
