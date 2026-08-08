create extension if not exists "pgcrypto";

create table if not exists public.heritage_items (
  id uuid primary key default gen_random_uuid(), title text not null, location text not null,
  type text not null, image text not null, tag text not null, published boolean not null default true,
  sort_order integer not null default 0, created_at timestamptz not null default now()
);
create table if not exists public.museums (
  id uuid primary key default gen_random_uuid(), title text not null, location text not null,
  image text not null, detail text not null, hours text, published boolean not null default true,
  sort_order integer not null default 0, created_at timestamptz not null default now()
);
create table if not exists public.performances (
  id uuid primary key default gen_random_uuid(), title text not null, people text not null,
  image text not null, description text not null, label text not null, published boolean not null default true,
  sort_order integer not null default 0, created_at timestamptz not null default now()
);
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(), day text not null, month text not null, title text not null,
  place text not null, type text not null, image text not null, event_date date,
  published boolean not null default true, sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.podcasts (
  id uuid primary key default gen_random_uuid(), number text not null, title text not null,
  guest text not null, length text not null, image text not null, category text not null, audio_url text,
  published boolean not null default true, sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.heritage_items enable row level security;
alter table public.museums enable row level security;
alter table public.performances enable row level security;
alter table public.events enable row level security;
alter table public.podcasts enable row level security;

create policy "Public can read published heritage" on public.heritage_items for select using (published);
create policy "Public can read published museums" on public.museums for select using (published);
create policy "Public can read published performances" on public.performances for select using (published);
create policy "Public can read published events" on public.events for select using (published);
create policy "Public can read published podcasts" on public.podcasts for select using (published);

insert into public.heritage_items (title, location, type, image, tag, sort_order) values
('Chongoni Rock Art Area','Dedza','Heritage sites','https://commons.wikimedia.org/wiki/Special:Redirect/file/Chongoni%20Rock-Art%20Area-110100.jpg?width=1600','UNESCO World Heritage',1),
('Mount Mulanje','Southern Region','Landscapes','https://commons.wikimedia.org/wiki/Special:Redirect/file/Mount%20Mulanje.jpg?width=1600','Mountain & hiking',2),
('Lake Malawi','Central & Northern shores','Natural wonders','https://commons.wikimedia.org/wiki/Special:Redirect/file/Lake%20Malawi%20(2416718857).jpg?width=1600','Lake of Stars',3),
('Nyika Plateau','Rumphi','National parks','https://commons.wikimedia.org/wiki/Special:Redirect/file/Nyika%20grassland.jpg?width=1600','Highland wilderness',4);

insert into public.events (day, month, title, place, type, image, event_date, sort_order) values
('18','SEP','Lake of Stars: Cultural Weekend','Lake Malawi, Mangochi','Festival','https://commons.wikimedia.org/wiki/Special:Redirect/file/Sunset%20in%20lake%20malawi.jpg?width=1600','2026-09-18',1),
('04','OCT','Mulhako wa Alhomwe Cultural Festival','Chonde, Mulanje','Culture','https://commons.wikimedia.org/wiki/Special:Redirect/file/Mount%20Mulanje.jpg?width=1600','2026-10-04',2),
('12','OCT','Blantyre Arts Festival','Blantyre','Arts','https://commons.wikimedia.org/wiki/Special:Redirect/file/Malawian%20Dancer.jpg?width=1600','2026-10-12',3);

