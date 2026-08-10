-- Complete the production content catalogue so every major frontend section
-- is served by Supabase instead of relying on the local editorial fallback.

insert into public.heritage_items
  (slug, title, location, type, image, tag, summary, body, region, published, sort_order)
values
  ('chongoni-rock-art-area', 'Chongoni Rock Art Area', 'Dedza', 'Archaeological & Historical Places', 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Chongoni%20Rock-Art%20Area-110100.jpg?width=1600', 'UNESCO World Heritage', 'A remarkable concentration of rock art preserving generations of ritual, memory and artistic expression.', 'Across the forested hills of Dedza, painted shelters connect present-day communities with long histories of settlement, ceremony and storytelling.', 'Central Region', true, 1),
  ('mount-mulanje', 'Mount Mulanje', 'Southern Region', 'Natural Heritage', 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Mount%20Mulanje.jpg?width=1600', 'Mountain & hiking', 'Malawi''s great granite massif rises above tea country with distinctive peaks, forests and highland trails.', 'Mulanje is both a dramatic natural landmark and a cultural landscape shaped by local knowledge, livelihoods and stories.', 'Southern Region', true, 2),
  ('lake-malawi', 'Lake Malawi', 'Central & Northern shores', 'Natural Heritage', 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Lake%20Malawi%20%282416718857%29.jpg?width=1600', 'Lake of Stars', 'The lake at the heart of Malawi supports extraordinary biodiversity and a vibrant network of shoreline communities.', 'From fishing traditions and ferries to protected waters and beach settlements, Lake Malawi carries ecological and cultural significance.', 'Central & Northern Regions', true, 3),
  ('nyika-plateau', 'Nyika Plateau', 'Rumphi', 'Natural Heritage', 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Nyika%20grassland.jpg?width=1600', 'Highland wilderness', 'Rolling montane grasslands, wildflowers and far-reaching views define Malawi''s largest national park.', 'Nyika offers a high-altitude landscape of rare plants, wildlife, walking routes and seasonal transformations.', 'Northern Region', true, 4),
  ('zomba-plateau', 'Zomba Plateau', 'Zomba', 'Cultural Landscapes', 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Emperors%20View-%20Zomba.jpg?width=1600', 'Scenic heritage', 'A forested plateau overlooking the former capital, shaped by paths, viewpoints and layers of public memory.', 'Zomba Plateau combines natural beauty with historic routes, working landscapes and a close relationship to the city below.', 'Southern Region', true, 5),
  ('mua-mission', 'Mua Mission', 'Dedza', 'Archaeological & Historical Places', 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Mua%20Mission%20church.jpg?width=1600', 'Living culture', 'A long-standing cultural and learning centre known for the Chamare Museum and community arts practice.', 'Mua Mission brings together faith history, material culture, performance, carving and research into Malawi''s living traditions.', 'Central Region', true, 6)
on conflict (slug) where slug is not null do update set
  title = excluded.title, location = excluded.location, type = excluded.type,
  image = excluded.image, tag = excluded.tag, summary = excluded.summary,
  body = excluded.body, region = excluded.region, published = excluded.published,
  sort_order = excluded.sort_order;

insert into public.museums
  (slug, title, location, image, detail, hours, body, published, sort_order)
values
  ('museum-of-malawi-chichiri', 'Museum of Malawi - Chichiri', 'Blantyre', 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Museum%20of%20Malawi.jpg?width=1600', 'Archaeology, ethnography and the story of Malawi from prehistory to independence.', 'Mon-Fri · 8:00-16:00', 'Chichiri presents national collections spanning archaeology, transport, natural history and everyday cultural life.', true, 1),
  ('cultural-museum-centre-karonga', 'Cultural & Museum Centre Karonga', 'Karonga', 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Karonga%20Museum.jpg?width=1600', 'Dinosaurs, early humans and the cultural history of Malawi''s far north.', 'Daily · 8:00-17:00', 'Karonga connects internationally significant fossil discoveries with the histories and living cultures of northern Malawi.', true, 2),
  ('kungoni-centre-of-culture-art', 'Kungoni Centre of Culture & Art', 'Mua, Dedza', 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Mua%20Mission%20church.jpg?width=1600', 'A remarkable Chamare Museum collection centred on Chewa, Ngoni and Yao traditions.', 'Mon-Sat · 8:00-16:30', 'The centre combines museum collections, carving workshops, dance documentation and cultural learning in one living campus.', true, 3),
  ('lake-malawi-museum', 'Lake Malawi Museum', 'Mangochi', 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Fort%20Johnston%20in%20present%20day%20Mangochi%2C%20Malawi.jpg?width=1600', 'Maritime histories, early steamships and the communities of the southern lakeshore.', 'Mon-Fri · 8:00-16:00', 'The collection explores movement, trade, transport and daily life around the southern reaches of Lake Malawi.', true, 4)
on conflict (slug) where slug is not null do update set
  title = excluded.title, location = excluded.location, image = excluded.image,
  detail = excluded.detail, hours = excluded.hours, body = excluded.body,
  published = excluded.published, sort_order = excluded.sort_order;

insert into public.performances
  (slug, title, people, image, description, label, body, published, sort_order)
values
  ('gule-wamkulu', 'Gule Wamkulu', 'Chewa', 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Gule%20Wamkulu.jpg?width=1600', 'The great dance links ancestral memory, masked performance and community teaching.', 'Intangible heritage', 'Gule Wamkulu is sustained through community knowledge, music, movement, mask-making and ceremonial responsibility.', true, 1),
  ('vimbuza-healing-dance', 'Vimbuza Healing Dance', 'Tumbuka', 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Malawian%20Dancer.jpg?width=1600', 'A northern Malawi healing tradition where drumming, movement and song create a shared ritual space.', 'Ritual & wellbeing', 'The tradition brings participants and musicians together through layered rhythms, collective care and embodied knowledge.', true, 2),
  ('ingoma', 'Ingoma', 'Ngoni', 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Gule%20wamkulu%2C%20the%20Big%20dance.jpg?width=1600', 'A powerful ceremonial dance marked by precision, call-and-response singing and collective pride.', 'Dance & ceremony', 'Ingoma performance expresses history, discipline and social identity through coordinated movement and song.', true, 3)
on conflict (slug) where slug is not null do update set
  title = excluded.title, people = excluded.people, image = excluded.image,
  description = excluded.description, label = excluded.label, body = excluded.body,
  published = excluded.published, sort_order = excluded.sort_order;

insert into public.events
  (slug, day, month, title, place, type, image, event_date, summary, published, sort_order)
values
  ('lake-of-stars-cultural-weekend', '18', 'SEP', 'Lake of Stars: Cultural Weekend', 'Lake Malawi, Mangochi', 'Festival', 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Sunset%20in%20lake%20malawi.jpg?width=1600', '2026-09-18', 'A lakeside programme of music, conversation, food and creative exchange.', true, 1),
  ('mulhako-wa-alhomwe-cultural-festival', '04', 'OCT', 'Mulhako wa Alhomwe Cultural Festival', 'Chonde, Mulanje', 'Culture', 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Mount%20Mulanje.jpg?width=1600', '2026-10-04', 'A major gathering celebrating Lhomwe heritage, performance, language and community.', true, 2),
  ('blantyre-arts-festival', '12', 'OCT', 'Blantyre Arts Festival', 'Blantyre', 'Arts', 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Malawian%20Dancer.jpg?width=1600', '2026-10-12', 'A city-wide showcase for performance, visual art and creative collaboration.', true, 3),
  ('sounds-of-malawi', '26', 'OCT', 'Sounds of Malawi', 'Lilongwe', 'Music', 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Gule%20wamkulu%2C%20the%20Big%20dance.jpg?width=1600', '2026-10-26', 'An evening programme connecting traditional and contemporary Malawian sound.', true, 4),
  ('chongoni-storytelling-walk', '08', 'NOV', 'Chongoni Storytelling Walk', 'Dedza', 'Heritage', 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Chongoni%20Rock-Art%20Area-110100.jpg?width=1600', '2026-11-08', 'A guided cultural landscape walk introducing rock art, memory and conservation.', true, 5),
  ('lake-heritage-film-night', '22', 'NOV', 'Lake Heritage Film Night', 'Mangochi', 'Film', 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Ilala%202%20on%20Lake%20Malawi%2C%20July%201962.jpg?width=1600', '2026-11-22', 'Documentary screenings and conversation focused on communities around Lake Malawi.', true, 6)
on conflict (slug) where slug is not null do update set
  day = excluded.day, month = excluded.month, title = excluded.title,
  place = excluded.place, type = excluded.type, image = excluded.image,
  event_date = excluded.event_date, summary = excluded.summary,
  published = excluded.published, sort_order = excluded.sort_order;

insert into public.podcasts
  (slug, number, title, guest, length, image, category, description, published, sort_order)
values
  ('the-living-masks-of-gule-wamkulu', '01', 'The Living Masks of Gule Wamkulu', 'Memory and ceremony with cultural custodians', '32 min', 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Gule%20Wamkulu%202.jpg?width=1600', 'Living heritage', 'A conversation about masks, memory, responsibility and performance.', true, 1),
  ('where-the-mountain-makes-the-rain', '02', 'Where the Mountain Makes the Rain', 'Stories from Mount Mulanje', '26 min', 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Mount%20Mulanje.jpg?width=1600', 'Landscapes', 'Local perspectives on the mountain''s water, weather, paths and stories.', true, 2),
  ('lake-of-stories', '03', 'Lake of Stories', 'Fishers, ferries and life by the water', '41 min', 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Fishing%20in%20Malawi.jpg?width=1600', 'Oral histories', 'Voices from the shoreline explore work, movement and belonging.', true, 3),
  ('under-the-rock-paintings', '04', 'Under the Rock Paintings', 'Reading Chongoni across generations', '29 min', 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Chongoni%20Rock-Art%20Area-110100.jpg?width=1600', 'Deep history', 'A field conversation about interpretation, stewardship and living connections to rock art.', true, 4)
on conflict (slug) where slug is not null do update set
  number = excluded.number, title = excluded.title, guest = excluded.guest,
  length = excluded.length, image = excluded.image, category = excluded.category,
  description = excluded.description, published = excluded.published,
  sort_order = excluded.sort_order;

insert into public.creative_profiles
  (slug, name, segment, location, focus, description, image, website, verified, published, sort_order)
values
  ('malawi-image-makers', 'Malawi Image Makers', 'Visual Arts & Crafts', 'Mzuzu', 'Photography · archives · visual storytelling', 'An illustrative northern network profile for photographers, image researchers and visual storytellers.', 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Nyika%20grassland.jpg?width=1600', null, false, true, 6)
on conflict (slug) do update set
  name = excluded.name, segment = excluded.segment, location = excluded.location,
  focus = excluded.focus, description = excluded.description, image = excluded.image,
  website = excluded.website, verified = excluded.verified,
  published = excluded.published, sort_order = excluded.sort_order,
  updated_at = now();
