import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  ArrowUpRight,
  Camera,
  LockKeyhole,
  Menu,
  Search,
  Sparkles,
  UsersRound,
  Video,
  X,
} from 'lucide-react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useContent } from '../context/ContentContext'
import { creativeSegments, images } from '../data/content'

const navigation = [
  { label: 'Home', to: '/' },
  { label: 'Sectors', to: '/segments' },
  { label: 'Heritage', to: '/explore' },
  { label: 'Performance', to: '/performance' },
  { label: 'Events', to: '/events' },
  { label: 'Media', to: '/media-library' },
  { label: 'About', to: '/about-us' },
]

const sitePages = [
  { title: 'Home', copy: 'Discover Malawi through landscapes, heritage, culture, events and stories.', type: 'Website page', route: '/', meta: 'Online Tourism Malawi', keywords: 'home discover malawi tourism travel culture' },
  { title: 'Creative sectors', copy: 'Explore Malawi’s creative industries and cultural sectors.', type: 'Website page', route: '/segments', meta: 'Sectors', keywords: 'creative sectors arts culture industry' },
  { title: 'Heritage', copy: 'Explore Malawi’s natural and cultural heritage places and stories.', type: 'Website page', route: '/explore', meta: 'Heritage', keywords: 'heritage unesco places history nature culture' },
  { title: 'Museums & collections', copy: 'Browse museums, collections and cultural institutions.', type: 'Website page', route: '/museums', meta: 'Museums', keywords: 'museum museums collections archive institution' },
  { title: 'Living performance', copy: 'Discover performance, music, dance and living traditions.', type: 'Website page', route: '/performance', meta: 'Performance', keywords: 'performance music dance tradition ceremony' },
  { title: 'Events', copy: 'Find cultural events, festivals and public programmes.', type: 'Website page', route: '/events', meta: 'Events', keywords: 'events festival calendar programme' },
  { title: 'Media Library & Podcasts', copy: 'Watch films and virtual tours, listen to podcasts and explore media archives.', type: 'Website page', route: '/media-library', meta: 'Media', keywords: 'media video film virtual tour podcast audio archive watch listen' },
  { title: 'Creative directory', copy: 'Meet creators, organisations and cultural practitioners.', type: 'Website page', route: '/directory', meta: 'Directory', keywords: 'creative directory creators organisations practitioners artists' },
  { title: 'Plan your visit', copy: 'Practical inspiration for exploring Malawi and its cultural places.', type: 'Website page', route: '/plan-your-visit', meta: 'Visitor guide', keywords: 'visit travel plan trip guide destination' },
  { title: 'Contribute', copy: 'Share a story, correction, event or cultural contribution for editorial review.', type: 'Website page', route: '/contribute', meta: 'Community', keywords: 'contribute submit story correction event community' },
  { title: 'About Online Tourism Malawi', copy: 'Learn about the platform, its purpose and approach.', type: 'Website page', route: '/about-us', meta: 'About', keywords: 'about mission platform online tourism malawi' },
  { title: 'Contact us', copy: 'Send a message to the Online Tourism Malawi team.', type: 'Website page', route: '/contact', meta: 'Contact', keywords: 'contact message email support enquiry' },
  { title: 'Premium membership', copy: 'Unlock Premium films, audio and cultural collections for 30 days.', type: 'Website page', route: '/premium', meta: 'Membership', keywords: 'premium membership subscription pay payment mwk usd paychangu' },
]

const slugify = (value = '') => value
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '')

const clean = (value) => String(value ?? '').trim()

const searchableText = (item) => [
  item.title,
  item.copy,
  item.type,
  item.meta,
  item.keywords,
].map(clean).join(' ').toLowerCase()

const scoreResult = (item, query) => {
  const title = clean(item.title).toLowerCase()
  const text = searchableText(item)
  if (title === query) return 120
  if (title.startsWith(query)) return 100
  if (title.includes(query)) return 80
  if (text.includes(query)) return 40
  return 0
}

function Picture({ src, alt }) {
  return (
    <div className="picture">
      {src ? <img src={src} alt={alt} loading="lazy" decoding="async" onError={(event) => { event.currentTarget.style.opacity = '0'; event.currentTarget.parentElement?.classList.add('image-fallback') }} /> : null}
    </div>
  )
}

function MalawiMark({ compact = false }) {
  return (
    <Link to="/" className={`brand ${compact ? 'brand--compact' : ''}`} aria-label="Online Tourism Malawi home">
      <span className="brand__mark" aria-hidden="true"><img src={images.map} alt="" /></span>
      <span className="brand__words"><small>Online Tourism</small><strong>Malawi</strong></span>
    </Link>
  )
}

function GlobalHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const navigate = useNavigate()
  const { user, canManageContent } = useAuth()
  const close = () => { setMenuOpen(false); setSearchOpen(false) }

  useEffect(() => {
    if (!menuOpen && !searchOpen) return undefined
    const previousOverflow = document.body.style.overflow
    if (menuOpen) document.body.style.overflow = 'hidden'
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') close()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [menuOpen, searchOpen])

  const submit = (event) => {
    event.preventDefault()
    const query = new FormData(event.currentTarget).get('search')?.trim()
    close()
    navigate(query ? `/search?q=${encodeURIComponent(query)}` : '/search')
  }

  return (
    <>
      <header className="site-header">
        <div className="site-header__inner shell shell--wide">
          <MalawiMark />
          <nav className="desktop-nav" aria-label="Primary navigation">
            {navigation.map((item) => <NavLink key={item.to} to={item.to} end={item.to === '/'}>{item.label}</NavLink>)}
          </nav>
          <div className="header-actions">
            <button className="icon-button search-trigger" type="button" onClick={() => setSearchOpen((value) => !value)} aria-label={searchOpen ? 'Close search' : 'Open search'}>{searchOpen ? <X size={19} /> : <Search size={19} />}</button>
            {canManageContent && <Link className="admin-shortcut" to="/admin"><Sparkles size={15} /><span>Studio</span></Link>}
            {user ? <Link className="account-pill sign-in-link" to="/account"><span>{user.email?.slice(0, 1).toUpperCase()}</span>{user.email?.split('@')[0]}</Link> : <Link className="button button--gold button--small sign-in-link" to="/sign-in">Sign in</Link>}
            <button className="icon-button menu-trigger" type="button" onClick={() => setMenuOpen((value) => !value)} aria-label={menuOpen ? 'Close menu' : 'Open menu'}>{menuOpen ? <X size={21} /> : <Menu size={21} />}</button>
          </div>
        </div>
        {searchOpen && (
          <div className="search-drawer">
            <form className="shell search-drawer__form" onSubmit={submit}>
              <Search size={22} />
              <input name="search" autoFocus aria-label="Search all public content" placeholder="Search all of Online Tourism Malawi" />
              <button className="button button--gold button--small" type="submit">Search</button>
            </form>
          </div>
        )}
      </header>
      <div className={`mobile-panel ${menuOpen ? 'mobile-panel--open' : ''}`} role="dialog" aria-modal="true" aria-label="Site navigation" aria-hidden={!menuOpen} inert={!menuOpen ? true : undefined}>
        <div className="mobile-panel__top"><MalawiMark compact /><button className="icon-button" type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={21} /></button></div>
        <nav aria-label="Mobile navigation">{navigation.map((item, index) => <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={close}><span>0{index + 1}</span>{item.label}<ArrowUpRight size={20} /></NavLink>)}</nav>
        <div className="mobile-panel__footer">The warm heart of Africa, online.</div>
      </div>
      {menuOpen && <button className="panel-scrim" type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}
    </>
  )
}

function GlobalFooter() {
  return (
    <footer className="site-footer">
      <div className="shell shell--wide site-footer__top">
        <div className="footer-intro">
          <MalawiMark />
          <p>A living digital gateway to Malawi’s landscapes, collections, stories and celebrations.</p>
          <div className="socials" aria-label="Social media"><a href="https://www.instagram.com/" aria-label="Instagram"><Camera size={18} /></a><a href="https://www.facebook.com/" aria-label="Facebook"><UsersRound size={18} /></a><a href="https://www.youtube.com/" aria-label="YouTube"><Video size={19} /></a></div>
        </div>
        <div className="footer-links">
          <div><strong>Discover</strong><Link to="/segments">Creative sectors</Link><Link to="/directory">Creative directory</Link><Link to="/plan-your-visit">Plan your visit</Link></div>
          <div><strong>Take part</strong><Link to="/events">Events</Link><Link to="/contribute">Contribute</Link><Link to="/media-library">Media & podcasts</Link></div>
          <div><strong>Keep in touch</strong><Link to="/contact">Contact us</Link><a href="mailto:hello@tourismmalawi.mw">hello@tourismmalawi.mw</a><span>Lilongwe, Malawi</span></div>
        </div>
      </div>
      <div className="shell shell--wide site-footer__bottom"><span>© 2026 Online Tourism Malawi</span><span>Search covers published public content only.</span></div>
    </footer>
  )
}

export default function GlobalSearchPage() {
  const {
    heritageItems = [],
    museums = [],
    performances = [],
    events = [],
    mediaItems = [],
    podcasts = [],
    creatives = [],
    loading,
  } = useContent()
  const location = useLocation()
  const navigate = useNavigate()
  const urlQuery = new URLSearchParams(location.search).get('q') || ''
  const normalized = urlQuery.trim().toLowerCase()

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [location.search])

  const index = useMemo(() => [
    ...sitePages,
    ...creativeSegments.map((item) => ({ title: item.title, copy: item.copy, type: 'Creative sector', image: item.image, route: item.route, meta: item.eyebrow, keywords: `${item.eyebrow || ''} ${(item.subcategories || []).map((entry) => entry.title).join(' ')}` })),
    ...heritageItems.map((item) => ({ title: item.title, copy: item.summary || item.description || item.tag, type: item.type || 'Heritage', image: item.image, route: `/heritage/${item.slug || slugify(item.title)}`, meta: item.location || item.region || 'Heritage', keywords: `${item.tag || ''} ${item.region || ''} ${item.category || ''}` })),
    ...museums.map((item) => ({ title: item.title, copy: item.detail || item.description || item.summary, type: 'Museum & collection', image: item.image, route: `/museums/${item.slug || slugify(item.title)}`, meta: item.location || 'Museum', keywords: `${item.type || ''} ${item.region || ''}` })),
    ...performances.map((item) => ({ title: item.title, copy: item.description || item.summary, type: 'Performance', image: item.image, route: '/performance', meta: item.people || item.location || 'Performance', keywords: `${item.category || ''} ${item.region || ''} ${item.tag || ''}` })),
    ...events.map((item) => ({ title: item.title, copy: item.description || `${item.day || ''} ${item.month || ''} · ${item.place || ''}`, type: item.type || 'Event', image: item.image, route: `/events/${item.slug || slugify(item.title)}`, meta: item.place || item.location || 'Event', keywords: `${item.day || ''} ${item.month || ''} ${item.category || ''}` })),
    ...mediaItems.map((item) => ({ title: item.title, copy: item.description, type: item.access_level === 'premium' ? 'Premium media' : 'Media', image: item.image, route: '/media-library', meta: [item.media_type, item.category, item.location, item.access_level === 'premium' ? 'Premium' : 'Free'].filter(Boolean).join(' · '), keywords: `${item.source_name || ''} ${item.source_url || ''} ${item.media_type || ''} ${item.category || ''} ${item.location || ''}` })),
    ...podcasts.map((item) => ({ title: item.title, copy: item.description || item.guest, type: item.access_level === 'premium' ? 'Premium podcast' : 'Podcast', image: item.image, route: '/media-library', meta: [item.guest, item.category, item.length, item.access_level === 'premium' ? 'Premium' : 'Free'].filter(Boolean).join(' · '), keywords: `${item.source_name || ''} ${item.guest || ''} ${item.category || ''}` })),
    ...creatives.map((item) => ({ title: item.name || item.title, copy: item.description || item.focus, type: item.segment || 'Creative profile', image: item.image, route: `/directory/${item.slug || slugify(item.name || item.title)}`, meta: item.location || item.focus || 'Creative directory', keywords: `${item.focus || ''} ${item.website || ''} ${item.category || ''}` })),
  ], [creatives, events, heritageItems, mediaItems, museums, performances, podcasts])

  const results = useMemo(() => {
    if (!normalized) return index.slice(0, 16)
    return index
      .map((item) => ({ ...item, __score: scoreResult(item, normalized) }))
      .filter((item) => item.__score > 0)
      .sort((a, b) => b.__score - a.__score || clean(a.title).localeCompare(clean(b.title)))
  }, [index, normalized])

  const submit = (event) => {
    event.preventDefault()
    const query = new FormData(event.currentTarget).get('search')?.trim() || ''
    navigate(query ? `/search?q=${encodeURIComponent(query)}` : '/search')
  }

  return (
    <>
      <a className="skip-link" href="#global-search-main">Skip to search results</a>
      <GlobalHeader />
      <main id="global-search-main" tabIndex={-1}>
        <section className="search-page-hero">
          <div className="shell" data-reveal="hero">
            <div className="eyebrow"><span />Search all of Malawi</div>
            <h1>Search the whole<br />public <em>collection.</em></h1>
            <form onSubmit={submit}>
              <Search size={23} />
              <input key={urlQuery} name="search" autoFocus defaultValue={urlQuery} placeholder="Try ‘Premium Test’, ‘Lake Malawi’, ‘Gule Wamkulu’…" aria-label="Search all published public content" />
              <button type="submit" aria-label="Search"><ArrowRight size={20} /></button>
            </form>
            <p className="global-search-scope">Searches published heritage, museums, performances, events, media, podcasts, creative profiles, sectors and main website pages. Private member and admin records are never indexed.</p>
          </div>
        </section>

        <section className="section section--ivory search-results">
          <div className="shell">
            <div className="result-note" data-reveal="up"><span>{loading ? '…' : String(results.length).padStart(2, '0')}</span>{normalized ? `results for “${urlQuery}”` : 'featured discoveries across the website'}</div>
            {results.length ? (
              <div className="search-results__grid">
                {results.map((item, indexNumber) => (
                  <Link to={item.route} className="search-result-card" key={`${item.type}-${item.title}-${indexNumber}`} data-reveal="card" data-reveal-delay={`${Math.min(indexNumber, 12) * 45}ms`}>
                    <Picture src={item.image} alt={item.title} />
                    <div>
                      <span>{item.type}{item.type.startsWith('Premium') ? <LockKeyhole size={13} aria-label="Premium" /> : null}</span>
                      <h2>{item.title}</h2>
                      <p>{item.copy || 'Explore this part of the Online Tourism Malawi collection.'}</p>
                      <small>{item.meta || 'Online Tourism Malawi'}<ArrowUpRight size={16} /></small>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="empty-state"><Search size={30} /><h2>No public results found</h2><p>Try another place, title, creator, category, source or theme.</p><Link className="button button--gold" to="/media-library">Browse the media library</Link></div>
            )}
          </div>
        </section>
      </main>
      <GlobalFooter />
    </>
  )
}
