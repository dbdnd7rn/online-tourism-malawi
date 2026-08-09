const file = (name, width = 1600) =>
  `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(name)}?width=${width}`

export const images = {
  map: file('SVG-Koort Malawi.svg', 600),
  lake: file('Lake Malawi (2416718857).jpg'),
  lakeSunset: file('Sunset in lake malawi.jpg'),
  mulanje: file('Mount Mulanje.jpg'),
  nyika: file('Nyika grassland.jpg'),
  zomba: file('Emperors View- Zomba.jpg'),
  chongoni: file('Chongoni Rock-Art Area-110100.jpg'),
  gule: file('Gule Wamkulu.jpg'),
  gulePortrait: file('Gule Wamkulu 2.jpg'),
  guleArchive: file('Gule wamkulu, the Big dance.jpg'),
  dancer: file('Malawian Dancer.jpg'),
  childrenLake: file('Children playing in lake Malawi.jpg'),
  market: file('Local Dish Local Restaurant.jpg'),
  chichiri: file('Museum of Malawi.jpg'),
  karonga: file('Karonga Museum.jpg'),
  mission: file('Mua Mission church.jpg'),
  likoma: file('St Peters Cathedral Likoma.jpg'),
  tea: file('Tea plantation, Mulanje.jpg'),
  fishing: file('Fishing in Malawi.jpg'),
  ilala: file('Ilala 2 on Lake Malawi, July 1962.jpg'),
  fort: file('Fort Johnston in present day Mangochi, Malawi.jpg'),
}

export const creativeSegments = [
  {
    number: '01',
    title: 'Cultural & Natural Heritage',
    shortTitle: 'Heritage',
    route: '/explore',
    eyebrow: 'Place · Memory · Nature',
    copy: 'Encounter the places, landscapes and ecosystems that carry Malawi’s long story.',
    image: images.mulanje,
    imageAlt: 'Mount Mulanje and the surrounding cultural landscape',
    subcategories: [
      { title: 'Archaeological & Historical Places', copy: 'Rock art, mission sites, monuments and places where Malawi’s past remains visible.' },
      { title: 'Cultural Landscapes', copy: 'Living environments shaped through belief, work, settlement and shared memory.' },
      { title: 'Natural Heritage', copy: 'The lake, mountains, plateaux, forests, wildlife and protected ecosystems.' },
    ],
  },
  {
    number: '02',
    title: 'Performance & Celebration',
    shortTitle: 'Performance',
    route: '/performance',
    eyebrow: 'Movement · Sound · Gathering',
    copy: 'Feel the energy of performance, music and public celebration across Malawi.',
    image: images.gulePortrait,
    imageAlt: 'A Gule Wamkulu performer in ceremonial dress',
    subcategories: [
      { title: 'Performing Arts', copy: 'Dance, theatre, spoken word and performance traditions carried by communities and artists.' },
      { title: 'Music', copy: 'Traditional rhythm, choral music, live bands and the country’s evolving contemporary sound.' },
      { title: 'Festivals, Fairs & Feasts', copy: 'Gatherings where culture, food, performance, exchange and collective joy meet.' },
    ],
  },
  {
    number: '03',
    title: 'Visual Arts & Crafts',
    shortTitle: 'Visual Arts',
    route: '/visual-arts-crafts',
    eyebrow: 'Image · Material · Imagination',
    copy: 'Meet the artists and makers translating Malawian experience into image and form.',
    image: images.chichiri,
    imageAlt: 'Cultural objects and visual heritage in Malawi',
    subcategories: [
      { title: 'Fine Arts', copy: 'Painting, drawing, sculpture, printmaking and contemporary artistic practice.' },
      { title: 'Photography', copy: 'Documentary, editorial and fine-art photography framing Malawi through local eyes.' },
      { title: 'Crafts', copy: 'Basketry, carving, textiles, pottery and material knowledge made by hand.' },
    ],
  },
  {
    number: '04',
    title: 'Books & Press',
    shortTitle: 'Books & Press',
    route: '/books-press',
    eyebrow: 'Read · Record · Exchange',
    copy: 'Discover the writers, publishers and reading spaces shaping Malawi’s public imagination.',
    image: images.mission,
    imageAlt: 'Historic learning and cultural centre in Malawi',
    subcategories: [
      { title: 'Books', copy: 'Fiction, poetry, scholarship, children’s stories and independent publishing.' },
      { title: 'Newspapers & Magazines', copy: 'Journalism, criticism and periodicals recording the conversations of the day.' },
      { title: 'Library', copy: 'Public, community and specialist collections connecting readers with knowledge.' },
      { title: 'Book Fairs', copy: 'Author talks, readings, publishing showcases and gatherings built around books.' },
    ],
  },
  {
    number: '05',
    title: 'Audio Visual & Interactive Media',
    shortTitle: 'Media',
    route: '/media-library',
    eyebrow: 'Watch · Listen · Play',
    copy: 'Enter Malawi’s screen, broadcast, podcast and interactive storytelling landscape.',
    image: images.ilala,
    imageAlt: 'Historic media view of the Ilala on Lake Malawi',
    subcategories: [
      { title: 'Film & Video', copy: 'Documentary, cinema, music video and moving-image storytelling.' },
      { title: 'TV & Radio', copy: 'Broadcast voices, public-interest programming and entertainment across the country.' },
      { title: 'Podcasting', copy: 'On-demand conversations, reporting, oral history and cultural audio.' },
      { title: 'Video Games', copy: 'Interactive worlds, playful learning and a growing community of digital creators.' },
    ],
  },
  {
    number: '06',
    title: 'Design & Creative',
    shortTitle: 'Design',
    route: '/design-creative',
    eyebrow: 'Shape · Space · Identity',
    copy: 'Explore creative services that shape how Malawi looks, feels and inhabits space.',
    image: images.likoma,
    imageAlt: 'Architectural detail at St Peter’s Cathedral on Likoma Island',
    subcategories: [
      { title: 'Fashion Design', copy: 'Clothing, textiles, accessories and distinctive expressions of personal identity.' },
      { title: 'Architectural Services', copy: 'Buildings and civic spaces designed for Malawi’s climate, communities and future.' },
      { title: 'Graphic Design', copy: 'Brand identities, editorial systems, illustration and visual communication.' },
      { title: 'Interior Design', copy: 'Thoughtful spaces shaped through material, colour, furniture and local craft.' },
      { title: 'Landscape Design', copy: 'Outdoor environments connecting ecology, culture, movement and everyday life.' },
    ],
  },
]

export const heritageItems = [
  { title: 'Chongoni Rock Art Area', location: 'Dedza', type: 'Archaeological & Historical Places', image: images.chongoni, tag: 'UNESCO World Heritage' },
  { title: 'Mount Mulanje', location: 'Southern Region', type: 'Natural Heritage', image: images.mulanje, tag: 'Mountain & hiking' },
  { title: 'Lake Malawi', location: 'Central & Northern shores', type: 'Natural Heritage', image: images.lake, tag: 'Lake of Stars' },
  { title: 'Nyika Plateau', location: 'Rumphi', type: 'Natural Heritage', image: images.nyika, tag: 'Highland wilderness' },
  { title: 'Zomba Plateau', location: 'Zomba', type: 'Cultural Landscapes', image: images.zomba, tag: 'Scenic heritage' },
  { title: 'Mua Mission', location: 'Dedza', type: 'Archaeological & Historical Places', image: images.mission, tag: 'Living culture' },
]

export const museums = [
  { title: 'Museum of Malawi — Chichiri', location: 'Blantyre', image: images.chichiri, detail: 'Archaeology, ethnography and the story of Malawi from prehistory to independence.', hours: 'Mon–Fri · 8:00–16:00' },
  { title: 'Cultural & Museum Centre Karonga', location: 'Karonga', image: images.karonga, detail: 'Dinosaurs, early humans and the cultural history of Malawi’s far north.', hours: 'Daily · 8:00–17:00' },
  { title: 'Kungoni Centre of Culture & Art', location: 'Mua, Dedza', image: images.mission, detail: 'A remarkable Chamare Museum collection centred on Chewa, Ngoni and Yao traditions.', hours: 'Mon–Sat · 8:00–16:30' },
  { title: 'Lake Malawi Museum', location: 'Mangochi', image: images.fort, detail: 'Maritime histories, early steamships and the communities of the southern lakeshore.', hours: 'Mon–Fri · 8:00–16:00' },
]

export const performances = [
  { title: 'Gule Wamkulu', people: 'Chewa', image: images.gule, description: 'The great dance links ancestral memory, masked performance and community teaching.', label: 'Intangible heritage' },
  { title: 'Vimbuza Healing Dance', people: 'Tumbuka', image: images.dancer, description: 'A northern Malawi healing tradition where drumming, movement and song create a shared ritual space.', label: 'Ritual & wellbeing' },
  { title: 'Ingoma', people: 'Ngoni', image: images.guleArchive, description: 'A powerful ceremonial dance marked by precision, call-and-response singing and collective pride.', label: 'Dance & ceremony' },
]

export const events = [
  { day: '18', month: 'SEP', title: 'Lake of Stars: Cultural Weekend', place: 'Lake Malawi, Mangochi', type: 'Festival', image: images.lakeSunset },
  { day: '04', month: 'OCT', title: 'Mulhako wa Alhomwe Cultural Festival', place: 'Chonde, Mulanje', type: 'Culture', image: images.mulanje },
  { day: '12', month: 'OCT', title: 'Blantyre Arts Festival', place: 'Blantyre', type: 'Arts', image: images.dancer },
  { day: '26', month: 'OCT', title: 'Sounds of Malawi', place: 'Lilongwe', type: 'Music', image: images.guleArchive },
  { day: '08', month: 'NOV', title: 'Chongoni Storytelling Walk', place: 'Dedza', type: 'Heritage', image: images.chongoni },
  { day: '22', month: 'NOV', title: 'Lake Heritage Film Night', place: 'Mangochi', type: 'Film', image: images.ilala },
]

export const podcasts = [
  { number: '01', title: 'The Living Masks of Gule Wamkulu', guest: 'Memory and ceremony with cultural custodians', length: '32 min', image: images.gulePortrait, category: 'Living heritage' },
  { number: '02', title: 'Where the Mountain Makes the Rain', guest: 'Stories from Mount Mulanje', length: '26 min', image: images.mulanje, category: 'Landscapes' },
  { number: '03', title: 'Lake of Stories', guest: 'Fishers, ferries and life by the water', length: '41 min', image: images.fishing, category: 'Oral histories' },
  { number: '04', title: 'Under the Rock Paintings', guest: 'Reading Chongoni across generations', length: '29 min', image: images.chongoni, category: 'Deep history' },
]

export const creativeDirectory = [
  {
    slug: 'kungoni-makers-collective',
    name: 'Kungoni Makers Collective',
    segment: 'Visual Arts & Crafts',
    location: 'Mua, Dedza',
    focus: 'Carving · textiles · cultural learning',
    description: 'An illustrative directory profile connecting visitors with makers, workshops and the material knowledge surrounding the Kungoni cultural landscape.',
    image: images.mission,
    website: 'https://www.kungoni.org/',
    verified: true,
  },
  {
    slug: 'warm-heart-stage-lab',
    name: 'Warm Heart Stage Lab',
    segment: 'Performance & Celebration',
    location: 'Lilongwe',
    focus: 'Theatre · dance · artist development',
    description: 'A realistic placeholder for a multidisciplinary performance hub supporting rehearsal, public programmes and emerging Malawian artists.',
    image: images.dancer,
    verified: false,
  },
  {
    slug: 'lakehouse-film-studio',
    name: 'Lakehouse Film Studio',
    segment: 'Audio Visual & Interactive Media',
    location: 'Mangochi',
    focus: 'Documentary · film · post-production',
    description: 'An illustrative lakeshore production profile focused on documentary storytelling, community crews and location services.',
    image: images.ilala,
    verified: false,
  },
  {
    slug: 'warm-heart-press',
    name: 'Warm Heart Press',
    segment: 'Books & Press',
    location: 'Blantyre',
    focus: 'Books · criticism · young readers',
    description: 'A realistic independent-publishing placeholder for books, literary conversations and reading programmes by Malawian voices.',
    image: images.fort,
    verified: false,
  },
  {
    slug: 'mudzi-design-studio',
    name: 'Mudzi Design Studio',
    segment: 'Design & Creative',
    location: 'Zomba',
    focus: 'Identity · interiors · spatial design',
    description: 'An illustrative multidisciplinary practice bringing local materials, visual identity and climate-aware spatial thinking together.',
    image: images.zomba,
    verified: false,
  },
  {
    slug: 'malawi-image-makers',
    name: 'Malawi Image Makers',
    segment: 'Visual Arts & Crafts',
    location: 'Mzuzu',
    focus: 'Photography · archives · visual essays',
    description: 'A realistic collective profile for photographers documenting everyday life, landscapes and cultural change across the northern region.',
    image: images.nyika,
    verified: false,
  },
]

export const photoCredits = [
  ['Malawi outline', 'Slomox', 'Public domain'],
  ['Mount Mulanje', 'africankelli', 'CC BY 2.0'],
  ['Gule Wamkulu images', 'Wikimedia Commons contributors', 'See source file'],
  ['Malawi landscape and archive images', 'Wikimedia Commons contributors', 'See source file'],
]
