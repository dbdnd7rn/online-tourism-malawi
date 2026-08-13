const siteOrigin = 'https://online-tourism-malawi.vercel.app'

const defaultSeo = {
  title: 'Online Tourism Malawi',
  description: 'Discover the art, heritage, museums, landscapes and living traditions of Malawi.',
}

const routeSeo = new Map([
  ['/', [defaultSeo.title, defaultSeo.description]],
  ['/segments', ['Creative Sectors | Online Tourism Malawi', 'Explore Malawi through heritage, performance, visual arts, books, media, design and creative industries.']],
  ['/explore', ['Cultural & Natural Heritage | Online Tourism Malawi', 'Explore Malawi heritage places, museums, cultural landscapes and natural wonders in one living collection.']],
  ['/museums', ['Museums & Collections | Online Tourism Malawi', 'Meet the museums, archives and cultural centres preserving Malawi history, objects and public memory.']],
  ['/performance', ['Performance & Celebration | Online Tourism Malawi', 'Discover Malawian performing arts, music, festivals, fairs and celebrations rooted in community life.']],
  ['/visual-arts-crafts', ['Visual Arts & Crafts | Online Tourism Malawi', 'Find Malawian fine arts, photography, craft traditions and creative makers across the country.']],
  ['/books-press', ['Books & Press | Online Tourism Malawi', 'Explore Malawi books, newspapers, magazines, libraries and literary gatherings.']],
  ['/media-library', ['Media Library & Podcasts | Online Tourism Malawi', 'Watch, listen and explore Malawi through video, audio, podcasting, archives and interactive media.']],
  ['/design-creative', ['Design & Creative | Online Tourism Malawi', 'Discover Malawi fashion, architecture, graphic design, interiors and landscape design.']],
  ['/events', ['Events | Online Tourism Malawi', 'Find festivals, performances, exhibitions and cultural gatherings across Malawi.']],
  ['/directory', ['Creative Directory | Online Tourism Malawi', 'Browse Malawian makers, studios, organisations and cultural enterprises across the creative sectors.']],
  ['/plan-your-visit', ['Plan Your Visit | Online Tourism Malawi', 'Build a thoughtful Malawi route around heritage places, museums, events, media and local context.']],
  ['/about-us', ['About Us | Online Tourism Malawi', 'Learn how Online Tourism Malawi connects culture, heritage, responsible travel and digital access.']],
  ['/contact', ['Contact | Online Tourism Malawi', 'Contact the Online Tourism Malawi team about partnerships, collections, events and platform questions.']],
  ['/contribute', ['Contribute | Online Tourism Malawi', 'Submit a story, event, correction or creative profile for editorial review.']],
  ['/account', ['My Collection | Online Tourism Malawi', 'View and manage saved Malawi stories, places, events and media.']],
  ['/sign-in', ['Sign In | Online Tourism Malawi', 'Sign in to save discoveries and access the Online Tourism Malawi editorial studio.']],
  ['/register', ['Create Account | Online Tourism Malawi', 'Create an account to save Malawi discoveries and contribute to the platform.']],
  ['/forgot-password', ['Recover Account | Online Tourism Malawi', 'Request a secure password reset for your Online Tourism Malawi account.']],
  ['/reset-password', ['Set New Password | Online Tourism Malawi', 'Choose a new password for your Online Tourism Malawi account.']],
  ['/accessibility', ['Accessibility | Online Tourism Malawi', 'Read the accessibility approach and report an access barrier.']],
  ['/privacy', ['Privacy | Online Tourism Malawi', 'Understand how Online Tourism Malawi handles account and contribution data.']],
  ['/terms', ['Terms | Online Tourism Malawi', 'Read the terms for using Online Tourism Malawi.']],
])

function setDocumentMeta(selector, attribute, value) {
  let element = document.head.querySelector(selector)
  if (!element) {
    element = document.createElement(selector.startsWith('link') ? 'link' : 'meta')
    const nameMatch = selector.match(/\[(name|property|rel)="([^"]+)"\]/)
    if (nameMatch) element.setAttribute(nameMatch[1], nameMatch[2])
    document.head.appendChild(element)
  }
  element.setAttribute(attribute, value)
}

export function applyRouteSeo(pathname) {
  const detailRoute = pathname.startsWith('/heritage/') || pathname.startsWith('/museums/') || pathname.startsWith('/events/') || pathname.startsWith('/directory/')
  const matched = routeSeo.get(pathname)
  const title = detailRoute ? 'Malawi Discovery | Online Tourism Malawi' : matched?.[0] || defaultSeo.title
  const description = detailRoute
    ? 'Explore this Malawi story with context, practical details and related discoveries.'
    : matched?.[1] || defaultSeo.description
  const canonical = `${siteOrigin}${pathname === '/' ? '/' : pathname}`

  document.title = title
  setDocumentMeta('meta[name="description"]', 'content', description)
  setDocumentMeta('meta[property="og:title"]', 'content', title)
  setDocumentMeta('meta[property="og:description"]', 'content', description)
  setDocumentMeta('meta[property="og:url"]', 'content', canonical)
  setDocumentMeta('meta[name="twitter:title"]', 'content', title)
  setDocumentMeta('meta[name="twitter:description"]', 'content', description)
  setDocumentMeta('link[rel="canonical"]', 'href', canonical)
}
