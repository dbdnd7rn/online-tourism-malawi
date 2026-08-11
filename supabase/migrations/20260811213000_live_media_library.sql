create table if not exists public.media_items (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text not null,
  media_type text not null,
  category text not null,
  location text,
  image text not null,
  duration text,
  source_name text not null,
  source_url text not null,
  embed_url text,
  media_url text,
  featured boolean not null default false,
  published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.media_items enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'media_items'
      and policyname = 'Public can read published media'
  ) then
    create policy "Public can read published media"
      on public.media_items
      for select
      using (published);
  end if;
end $$;

alter table public.podcasts add column if not exists description text;
alter table public.podcasts add column if not exists source_name text;
alter table public.podcasts add column if not exists source_url text;

insert into public.media_items
  (slug, title, description, media_type, category, location, image, duration, source_name, source_url, embed_url, media_url, featured, sort_order)
values
  (
    'lake-malawi-360',
    'Lake Malawi Virtual Tour',
    'Step into the Lake of Stars with an official 360° virtual experience from Visit Malawi.',
    'Virtual tour',
    'Lake & islands',
    'Lake Malawi',
    'https://commons.wikimedia.org/wiki/Special:Redirect/file/Lake%20Malawi%20%282416718857%29.jpg?width=1600',
    '360°',
    'Visit Malawi',
    'https://visitmalawi.mw/360-videos/',
    'https://www.youtube-nocookie.com/embed/OUpzh27UiTk',
    null,
    true,
    1
  ),
  (
    'nyika-360',
    'Nyika National Park Virtual Tour',
    'Travel across Malawi''s northern highlands and wide grassland landscapes in this official virtual tour.',
    'Virtual tour',
    'Nature & wildlife',
    'Nyika National Park',
    'https://commons.wikimedia.org/wiki/Special:Redirect/file/Nyika%20grassland.jpg?width=1600',
    '360°',
    'Visit Malawi',
    'https://visitmalawi.mw/360-videos/',
    'https://www.youtube-nocookie.com/embed/h7ovIBtul4M',
    null,
    true,
    2
  ),
  (
    'liwonde-360',
    'Liwonde National Park Virtual Tour',
    'An immersive official tour introducing one of Malawi''s best-known wildlife landscapes.',
    'Virtual tour',
    'Nature & wildlife',
    'Liwonde National Park',
    'https://commons.wikimedia.org/wiki/Special:Redirect/file/Children%20playing%20in%20lake%20Malawi.jpg?width=1600',
    '360°',
    'Visit Malawi',
    'https://visitmalawi.mw/360-videos/',
    'https://www.youtube-nocookie.com/embed/w_bMI05F0Iw',
    null,
    false,
    3
  ),
  (
    'zomba-360',
    'Zomba Plateau Virtual Tour',
    'Explore the viewpoints, forest and dramatic elevation of Zomba Plateau through an official Visit Malawi tour.',
    'Virtual tour',
    'Scenery',
    'Zomba',
    'https://commons.wikimedia.org/wiki/Special:Redirect/file/Emperors%20View-%20Zomba.jpg?width=1600',
    '360°',
    'Visit Malawi',
    'https://visitmalawi.mw/360-videos/',
    'https://www.youtube-nocookie.com/embed/2Vf-qVQq9Ug',
    null,
    false,
    4
  ),
  (
    'malawi-destination-film',
    'Welcome to Malawi',
    'A destination film bringing together Malawi''s lake, landscapes, wildlife and culture.',
    'Film',
    'Discover Malawi',
    'Across Malawi',
    'https://commons.wikimedia.org/wiki/Special:Redirect/file/Sunset%20in%20lake%20malawi.jpg?width=1600',
    'Film',
    'Malawi Tourism',
    'https://www.malawitourism.com/',
    'https://www.youtube-nocookie.com/embed/whJgUy09mrA',
    null,
    true,
    5
  ),
  (
    'gule-unesco',
    'Gule Wamkulu — UNESCO Archive',
    'UNESCO''s heritage video and contextual record of Gule Wamkulu across Malawi, Mozambique and Zambia.',
    'Archive video',
    'Living heritage',
    'Central & Southern Malawi',
    'https://commons.wikimedia.org/wiki/Special:Redirect/file/Gule%20wamkulu%2C%20the%20Big%20dance.jpg?width=1600',
    'Archive',
    'UNESCO',
    'https://ich.unesco.org/en/video/41677',
    null,
    null,
    false,
    6
  ),
  (
    'vimbuza-unesco',
    'Vimbuza Healing Dance — UNESCO Archive',
    'An official UNESCO video record of the Tumbuka Vimbuza healing dance tradition of northern Malawi.',
    'Archive video',
    'Living heritage',
    'Northern Malawi',
    'https://commons.wikimedia.org/wiki/Special:Redirect/file/Malawian%20Dancer.jpg?width=1600',
    'Archive',
    'UNESCO',
    'https://ich.unesco.org/en/video/41688',
    null,
    null,
    false,
    7
  ),
  (
    'malawi-anthem',
    'Mlungu dalitsani Malaŵi',
    'Listen to a public-domain performance of Malawi''s national anthem, performed by the United States Navy Band.',
    'Audio',
    'National memory',
    'Malawi',
    'https://commons.wikimedia.org/wiki/Special:Redirect/file/Sunset%20in%20lake%20malawi.jpg?width=1600',
    '0:52',
    'Wikimedia Commons',
    'https://commons.wikimedia.org/wiki/File:Malawian_national_anthem.oga',
    null,
    'https://commons.wikimedia.org/wiki/Special:Redirect/file/Malawian%20national%20anthem.oga',
    false,
    8
  )
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  media_type = excluded.media_type,
  category = excluded.category,
  location = excluded.location,
  image = excluded.image,
  duration = excluded.duration,
  source_name = excluded.source_name,
  source_url = excluded.source_url,
  embed_url = excluded.embed_url,
  media_url = excluded.media_url,
  featured = excluded.featured,
  published = true,
  sort_order = excluded.sort_order;
