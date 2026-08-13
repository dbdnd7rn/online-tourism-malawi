create extension if not exists "pgcrypto";

alter table public.heritage_items add column if not exists slug text;
alter table public.heritage_items add column if not exists summary text;
alter table public.heritage_items add column if not exists body text;
alter table public.heritage_items add column if not exists region text;
alter table public.heritage_items add column if not exists website text;
alter table public.museums add column if not exists slug text;
alter table public.museums add column if not exists body text;
alter table public.museums add column if not exists website text;
alter table public.performances add column if not exists slug text;
alter table public.performances add column if not exists body text;
alter table public.events add column if not exists slug text;
alter table public.events add column if not exists summary text;
alter table public.events add column if not exists body text;
alter table public.events add column if not exists booking_url text;
alter table public.events add column if not exists end_date date;
alter table public.podcasts add column if not exists slug text;
alter table public.podcasts add column if not exists description text;

update public.heritage_items set slug = lower(regexp_replace(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g')) where slug is null;
update public.museums set slug = lower(regexp_replace(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g')) where slug is null;
update public.performances set slug = lower(regexp_replace(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g')) where slug is null;
update public.events set slug = lower(regexp_replace(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g')) where slug is null;
update public.podcasts set slug = lower(regexp_replace(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g')) where slug is null;

create unique index if not exists heritage_items_slug_idx on public.heritage_items (slug) where slug is not null;
create unique index if not exists museums_slug_idx on public.museums (slug) where slug is not null;
create unique index if not exists performances_slug_idx on public.performances (slug) where slug is not null;
create unique index if not exists events_slug_idx on public.events (slug) where slug is not null;
create unique index if not exists podcasts_slug_idx on public.podcasts (slug) where slug is not null;

update public.heritage_items set type = 'Archaeological & Historical Places' where type = 'Heritage sites';
update public.heritage_items set type = 'Cultural Landscapes' where type = 'Landscapes';
update public.heritage_items set type = 'Natural Heritage' where type in ('Natural wonders', 'National parks');

create table if not exists public.creative_profiles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  segment text not null,
  location text not null,
  focus text not null,
  description text not null,
  image text not null,
  website text,
  email text,
  verified boolean not null default false,
  published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  home_region text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_key text not null,
  item_type text not null,
  title text not null,
  route text not null,
  image text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(user_id, item_key)
);

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (position('@' in email) > 1),
  source text not null default 'website',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null check (position('@' in email) > 1),
  subject text not null,
  message text not null,
  status text not null default 'new' check (status in ('new', 'in_progress', 'resolved', 'spam')),
  created_at timestamptz not null default now()
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  submission_type text not null check (submission_type in ('story', 'event', 'creative_profile', 'correction')),
  name text not null,
  email text not null check (position('@' in email) > 1),
  title text not null,
  description text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'received' check (status in ('received', 'reviewing', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.creative_profiles enable row level security;
alter table public.profiles enable row level security;
alter table public.saved_items enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.contact_messages enable row level security;
alter table public.submissions enable row level security;

drop policy if exists "Public can read published creative profiles" on public.creative_profiles;
create policy "Public can read published creative profiles" on public.creative_profiles for select using (published);

drop policy if exists "Members can read their profile" on public.profiles;
create policy "Members can read their profile" on public.profiles for select using (auth.uid() = id);
drop policy if exists "Members can update their profile" on public.profiles;
create policy "Members can update their profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Members can read saved items" on public.saved_items;
create policy "Members can read saved items" on public.saved_items for select using (auth.uid() = user_id);
drop policy if exists "Members can save items" on public.saved_items;
create policy "Members can save items" on public.saved_items for insert with check (auth.uid() = user_id);
drop policy if exists "Members can update saved items" on public.saved_items;
create policy "Members can update saved items" on public.saved_items for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Members can remove saved items" on public.saved_items;
create policy "Members can remove saved items" on public.saved_items for delete using (auth.uid() = user_id);

drop policy if exists "Visitors can subscribe" on public.newsletter_subscribers;
create policy "Visitors can subscribe" on public.newsletter_subscribers for insert with check (true);
drop policy if exists "Visitors can send contact messages" on public.contact_messages;
create policy "Visitors can send contact messages" on public.contact_messages for insert with check (true);
drop policy if exists "Visitors can create submissions" on public.submissions;
create policy "Visitors can create submissions" on public.submissions for insert with check (user_id is null or auth.uid() = user_id);
drop policy if exists "Members can read their submissions" on public.submissions;
create policy "Members can read their submissions" on public.submissions for select using (auth.uid() = user_id);

grant select on public.creative_profiles to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.saved_items to authenticated;
grant insert on public.newsletter_subscribers to anon, authenticated;
grant insert on public.contact_messages to anon, authenticated;
grant insert on public.submissions to anon, authenticated;
grant select on public.submissions to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

insert into public.creative_profiles (slug, name, segment, location, focus, description, image, website, verified, sort_order) values
('kungoni-makers-collective','Kungoni Makers Collective','Visual Arts & Crafts','Mua, Dedza','Carving · textiles · cultural learning','An illustrative directory profile connecting visitors with makers, workshops and material knowledge in the Kungoni cultural landscape.','https://commons.wikimedia.org/wiki/Special:Redirect/file/Mua%20Mission%20church.jpg?width=1600','https://www.kungoni.org/',true,1),
('warm-heart-stage-lab','Warm Heart Stage Lab','Performance & Celebration','Lilongwe','Theatre · dance · artist development','A realistic placeholder for a multidisciplinary performance hub supporting rehearsal, public programmes and emerging Malawian artists.','https://commons.wikimedia.org/wiki/Special:Redirect/file/Malawian%20Dancer.jpg?width=1600',null,false,2),
('lakehouse-film-studio','Lakehouse Film Studio','Audio Visual & Interactive Media','Mangochi','Documentary · film · post-production','An illustrative lakeshore production profile focused on documentary storytelling, community crews and location services.','https://commons.wikimedia.org/wiki/Special:Redirect/file/Ilala%202%20on%20Lake%20Malawi%2C%20July%201962.jpg?width=1600',null,false,3),
('warm-heart-press','Warm Heart Press','Books & Press','Blantyre','Books · criticism · young readers','A realistic independent-publishing placeholder for books, literary conversations and reading programmes by Malawian voices.','https://commons.wikimedia.org/wiki/Special:Redirect/file/Fort%20Johnston%20in%20present%20day%20Mangochi%2C%20Malawi.jpg?width=1600',null,false,4),
('mudzi-design-studio','Mudzi Design Studio','Design & Creative','Zomba','Identity · interiors · spatial design','An illustrative multidisciplinary practice bringing local materials, visual identity and climate-aware spatial thinking together.','https://commons.wikimedia.org/wiki/Special:Redirect/file/Emperors%20View-%20Zomba.jpg?width=1600',null,false,5)
on conflict (slug) do update set
  name = excluded.name,
  segment = excluded.segment,
  location = excluded.location,
  focus = excluded.focus,
  description = excluded.description,
  image = excluded.image,
  website = excluded.website,
  verified = excluded.verified,
  sort_order = excluded.sort_order,
  updated_at = now();
