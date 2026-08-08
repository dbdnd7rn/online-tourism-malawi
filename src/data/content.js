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

export const heritageItems = [
  { title: 'Chongoni Rock Art Area', location: 'Dedza', type: 'Heritage sites', image: images.chongoni, tag: 'UNESCO World Heritage' },
  { title: 'Mount Mulanje', location: 'Southern Region', type: 'Landscapes', image: images.mulanje, tag: 'Mountain & hiking' },
  { title: 'Lake Malawi', location: 'Central & Northern shores', type: 'Natural wonders', image: images.lake, tag: 'Lake of Stars' },
  { title: 'Nyika Plateau', location: 'Rumphi', type: 'National parks', image: images.nyika, tag: 'Highland wilderness' },
  { title: 'Zomba Plateau', location: 'Zomba', type: 'Landscapes', image: images.zomba, tag: 'Scenic heritage' },
  { title: 'Mua Mission', location: 'Dedza', type: 'Heritage sites', image: images.mission, tag: 'Living culture' },
]

export const museums = [
  { title: 'Museum of Malawi â€” Chichiri', location: 'Blantyre', image: images.chichiri, detail: 'Archaeology, ethnography and the story of Malawi from prehistory to independence.', hours: 'Monâ€“Fri Â· 8:00â€“16:00' },
  { title: 'Cultural & Museum Centre Karonga', location: 'Karonga', image: images.karonga, detail: 'Dinosaurs, early humans and the cultural history of Malawiâ€™s far north.', hours: 'Daily Â· 8:00â€“17:00' },
  { title: 'Kungoni Centre of Culture & Art', location: 'Mua, Dedza', image: images.mission, detail: 'A remarkable Chamare Museum collection centred on Chewa, Ngoni and Yao traditions.', hours: 'Monâ€“Sat Â· 8:00â€“16:30' },
  { title: 'Lake Malawi Museum', location: 'Mangochi', image: images.fort, detail: 'Maritime histories, early steamships and the communities of the southern lakeshore.', hours: 'Monâ€“Fri Â· 8:00â€“16:00' },
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

export const photoCredits = [
  ['Malawi outline', 'Slomox', 'Public domain'],
  ['Mount Mulanje', 'africankelli', 'CC BY 2.0'],
  ['Gule Wamkulu images', 'Wikimedia Commons contributors', 'See source file'],
  ['Malawi landscape and archive images', 'Wikimedia Commons contributors', 'See source file'],
]

