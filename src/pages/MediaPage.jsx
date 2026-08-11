import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  ArrowUpRight,
  Camera,
  Check,
  Headphones,
  Mail,
  MapPin,
  Menu,
  Mic2,
  Play,
  Search,
  UsersRound,
  Video,
  Volume2,
  X,
} from 'lucide-react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useContent } from '../context/ContentContext'
import { images } from '../data/content'

const navigation = [
  { label: 'Home', to: '/' },
  { label: 'Explore', to: '/explore' },
  { label: 'Museums', to: '/museums' },
  { label: 'Performance', to: '/performance' },
  { label: 'Events', to: '/events' },
  { label: 'Media', to: '/media-library' },
  { label: 'About', to: '/about-us' },
]

const imageFallback = (event) => {
  event.currentTarget.style.opacity = '0'
  event.currentTarget.parentElement?.classList.add('image-fallback')
}

function Picture({ src, alt, className = '' }) {
  return <div className={`picture ${className}`}><img src={src} alt={alt} loading="lazy" onError={imageFallback} /></div>
}

function Eyebrow({ children }) {
  return <div className="eyebrow"><span />{children}</div>
}

function MalawiMark({ compact = false }) {
  return (
    <Link to="/" className={`brand ${compact ? 'brand--compact' : ''}`} aria-label="Online Tourism Malawi home">
      <span className="brand__mark" aria-hidden="true"><img src={images.map} alt="" onError={imageFallback} /></span>
      <span className="brand__words"><small>Online Tourism</small><strong>Malawi</strong></span>
    </Link>
  )
}

function MediaHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const close = () => { setMenuOpen(false); setSearchOpen(false) }
  const submitSearch = (event) => {
    event.preventDefault()
    const query = new FormData(event.currentTarget).get('search')?.trim()
    close()
    navigate(query ? `/explore?q=${encodeURIComponent(query)}` : '/explore')
  }

  return (
    <>
      <header className="site-header">
        <div className="site-header__inner shell shell--wide">
          <MalawiMark />
          <nav className="desktop-nav" aria-label="Primary navigation">
            {navigation.map((item) => <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={close}>{item.label}</NavLink>)}
          </nav>
          <div className="header-actions">
            <button className="icon-button search-trigger" onClick={() => setSearchOpen((value) => !value)} aria-label="Search" aria-expanded={searchOpen}>{searchOpen ? <X size={19} /> : <Search size={19} />}</button>
            {user ? (
              <button className="account-pill sign-in-link" onClick={signOut} title="Sign out"><span>{user.email?.slice(0, 1).toUpperCase()}</span>{user.email?.split('@')[0]}</button>
            ) : <Link className="button button--gold button--small sign-in-link" to="/sign-in" onClick={close}>Sign in</Link>}
            <button className="icon-button menu-trigger" onClick={() => setMenuOpen((value) => !value)} aria-label="Open menu" aria-expanded={menuOpen}>{menuOpen ? <X size={21} /> : <Menu size={21} />}</button>
          </div>
        </div>
        {searchOpen && (
          <div className="search-drawer">
            <form className="shell search-drawer__form" onSubmit={submitSearch}>
              <Search size={22} />
              <input name="search" autoFocus aria-label="Search the Malawi collection" placeholder="Search museums, places, traditions and stories" />
              <button className="button button--gold button--small" type="submit">Explore</button>
            </form>
          </div>
        )}
      </header>
      <div className={`mobile-panel ${menuOpen ? 'mobile-panel--open' : ''}`} aria-hidden={!menuOpen}>
        <div className="mobile-panel__top"><MalawiMark compact /><button className="icon-button" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={21} /></button></div>
        <nav aria-label="Mobile navigation">
          {navigation.map((item, index) => <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={close}><span>0{index + 1}</span>{item.label}<ArrowUpRight size={20} /></NavLink>)}
        </nav>
        <div className="mobile-panel__footer">The warm heart of Africa, online.</div>
      </div>
      {menuOpen && <button className="panel-scrim" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}
    </>
  )
}

function MediaFooter() {
  return (
    <footer className="site-footer">
      <div className="shell shell--wide site-footer__top">
        <div className="footer-intro">
          <MalawiMark />
          <p>A living digital gateway to Malawi’s landscapes, collections, stories and celebrations.</p>
          <div className="socials" aria-label="Social media">
            <a href="https://www.instagram.com/" aria-label="Instagram"><Camera size={18} /></a>
            <a href="https://www.facebook.com/" aria-label="Facebook"><UsersRound size={18} /></a>
            <a href="https://www.youtube.com/" aria-label="YouTube"><Video size={19} /></a>
          </div>
        </div>
        <div className="footer-links">
          <div><strong>Discover</strong><Link to="/explore">Arts & heritage</Link><Link to="/museums">Museums</Link><Link to="/performance">Living traditions</Link></div>
          <div><strong>Visit online</strong><Link to="/events">Events</Link><Link to="/media-library">Media & podcasts</Link><Link to="/about-us">Our story</Link></div>
          <div><strong>Keep in touch</strong><a href="mailto:hello@tourismmalawi.mw">hello@tourismmalawi.mw</a><span>Lilongwe, Malawi</span><span>Mon–Fri · 08:00–17:00</span></div>
        </div>
      </div>
      <div className="shell shell--wide site-footer__bottom"><span>© 2026 Online Tourism Malawi</span><span>Built to honour, preserve and share.</span></div>
    </footer>
  )
}

const mediaGroup = (item) => {
  const type = item.media_type?.toLowerCase() || ''
  if (item.media_url || type.includes('audio')) return 'Listen'
  if (type.includes('archive')) return 'Archives'
  return 'Watch'
}

function MediaCard({ item, onOpen }) {
  const group = mediaGroup(item)
  return (
    <button className="media-live-card" type="button" onClick={() => onOpen(item)} aria-label={`Open ${item.title}`}>
      <div className="media-live-card__visual">
        <Picture src={item.image} alt={item.title} />
        <span className="media-live-card__type">{item.media_type}</span>
        <span className="media-live-card__play">{group === 'Listen' ? <Volume2 size={20} /> : <Play size={20} fill="currentColor" />}</span>
        {item.duration && <span className="media-live-card__duration">{item.duration}</span>}
      </div>
      <div className="media-live-card__body">
        <small>{item.category}{item.location ? ` · ${item.location}` : ''}</small>
        <h3>{item.title}</h3>
        <p>{item.description}</p>
        <span className="media-live-card__source">{item.source_name}<ArrowUpRight size={15} /></span>
      </div>
    </button>
  )
}

function MediaViewer({ item, onClose }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const closeOnEscape = (event) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [onClose])

  return (
    <div className="media-viewer" role="dialog" aria-modal="true" aria-label={item.title} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div className="media-viewer__panel">
        <button className="media-viewer__close" onClick={onClose} aria-label="Close media viewer"><X size={22} /></button>
        <div className="media-viewer__stage">
          {item.embed_url ? (
            <iframe
              src={`${item.embed_url}?autoplay=1&rel=0`}
              title={item.title}
              allow="autoplay; encrypted-media; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          ) : item.media_url ? (
            <div className="media-viewer__audio">
              <Picture src={item.image} alt={item.title} />
              <audio controls autoPlay preload="metadata" src={item.media_url}>Your browser does not support audio playback.</audio>
            </div>
          ) : <Picture src={item.image} alt={item.title} className="media-viewer__image" />}
        </div>
        <div className="media-viewer__details">
          <div><small>{item.media_type} · {item.category}</small><h2>{item.title}</h2><p>{item.description}</p></div>
          <div className="media-viewer__meta">
            {item.location && <span><MapPin size={15} />{item.location}</span>}
            <span>Source: {item.source_name}</span>
            <a className="button button--gold button--small" href={item.source_url} target="_blank" rel="noreferrer">Open official source <ArrowUpRight size={16} /></a>
          </div>
        </div>
      </div>
    </div>
  )
}

function PodcastStage({ podcasts }) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const safeIndex = podcasts.length ? Math.min(selectedIndex, podcasts.length - 1) : 0
  const selected = podcasts[safeIndex]

  if (!selected) return null

  return (
    <section className="media-podcast-stage">
      <div className="shell">
        <div className="media-section-heading media-section-heading--inverse">
          <div><Eyebrow>Original podcast</Eyebrow><h2>Voices of the<br /><em>Warm Heart</em></h2><p>Long-form conversations about place, practice and memory. Audio published in the live library plays directly here.</p></div>
          <Headphones size={38} />
        </div>

        <div className="media-podcast-player">
          <Picture src={selected.image} alt={selected.title} className="media-podcast-player__image" />
          <div className="media-podcast-player__copy">
            <span>Episode {selected.number} · {selected.category}</span>
            <h3>{selected.title}</h3>
            <strong>{selected.guest}</strong>
            <p>{selected.description || 'A story from Malawi’s living cultural and natural heritage.'}</p>
            {selected.audio_url ? (
              <div className="media-native-audio"><audio key={selected.audio_url} controls preload="metadata" src={selected.audio_url}>Your browser does not support audio playback.</audio></div>
            ) : (
              <div className="media-podcast-source">
                <Mic2 size={21} />
                <div><strong>Source-led episode page</strong><small>The original programme audio can be added through the live content library without changing the website code.</small></div>
                {selected.source_url && <a href={selected.source_url} target="_blank" rel="noreferrer">Explore source <ArrowUpRight size={15} /></a>}
              </div>
            )}
          </div>
        </div>

        <div className="media-episode-list" aria-label="Podcast episodes">
          {podcasts.map((episode, index) => (
            <button key={episode.id || episode.title} type="button" className={safeIndex === index ? 'active' : ''} onClick={() => setSelectedIndex(index)}>
              <span>{episode.number}</span>
              <Picture src={episode.image} alt="" />
              <div><strong>{episode.title}</strong><small>{episode.guest}</small></div>
              <span>{episode.length}</span>
              <i>{episode.audio_url ? <Play size={15} fill="currentColor" /> : <ArrowRight size={16} />}</i>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function MediaPage() {
  const { podcasts = [], mediaItems = [], source, loading } = useContent()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')
  const [activeMedia, setActiveMedia] = useState(null)

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [])

  const filteredMedia = useMemo(() => mediaItems.filter((item) => {
    const groupMatch = filter === 'All' || mediaGroup(item) === filter
    const haystack = `${item.title} ${item.description} ${item.category} ${item.location || ''} ${item.source_name || ''}`.toLowerCase()
    return groupMatch && haystack.includes(query.trim().toLowerCase())
  }), [filter, mediaItems, query])

  const videoCount = mediaItems.filter((item) => Boolean(item.embed_url) || mediaGroup(item) === 'Watch').length
  const audioCount = podcasts.length + mediaItems.filter((item) => mediaGroup(item) === 'Listen').length
  const collectionCount = new Set([...mediaItems.map((item) => item.category), ...podcasts.map((item) => item.category)]).size
  const statusLabel = source === 'supabase' ? 'Live collection' : source === 'hybrid' ? 'Live + curated collection' : 'Curated collection'

  return (
    <>
      <a className="skip-link" href="#media-main">Skip to media</a>
      <MediaHeader />
      <main id="media-main">
        <section className="page-hero media-live-hero">
          <Picture src={images.ilala} alt="Historic view of the Ilala on Lake Malawi" className="page-hero__image" />
          <div className="page-hero__shade" />
          <div className="shell page-hero__content">
            <Eyebrow>Watch · Listen · Remember</Eyebrow>
            <h1>Media Library<br />& <em>Podcasts</em></h1>
            <p>Explore Malawi through official virtual tours, cultural archive films, audio, field stories and trusted source material.</p>
            <div className="media-live-status"><i />{loading ? 'Refreshing library…' : statusLabel}</div>
            <div className="media-counts">
              <span><strong>{videoCount}</strong> films & tours</span>
              <span><strong>{audioCount}</strong> audio stories</span>
              <span><strong>{collectionCount}</strong> collections</span>
            </div>
          </div>
          <span className="page-hero__index" aria-hidden="true">MEDIA</span>
        </section>

        <section className="media-featured-strip">
          <div className="shell media-featured-strip__inner">
            <div><Eyebrow>Now in the library</Eyebrow><h2>Real Malawi.<br /><em>Real sources.</em></h2></div>
            <p>The library prioritises official tourism, heritage and openly licensed material. Every item identifies its source so visitors can keep exploring beyond this website.</p>
            <div className="media-source-logos"><span>Visit Malawi</span><span>UNESCO</span><span>Wikimedia Commons</span></div>
          </div>
        </section>

        <PodcastStage podcasts={podcasts} />

        <section className="section section--ivory media-library-section">
          <div className="shell">
            <div className="media-section-heading">
              <div><Eyebrow>Browse the library</Eyebrow><h2>Watch, listen<br />& <em>go deeper</em></h2><p>Search by place, theme or source, then open a film, audio recording or archive entry.</p></div>
              <span>{String(filteredMedia.length).padStart(2, '0')} results</span>
            </div>

            <div className="media-library-toolbar">
              <label><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Lake Malawi, Gule Wamkulu, Nyika…" aria-label="Search media library" />{query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search"><X size={16} /></button>}</label>
              <div className="media-filter-row" role="group" aria-label="Filter media">
                {['All', 'Watch', 'Listen', 'Archives'].map((item) => <button type="button" key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>{item}</button>)}
              </div>
            </div>

            {filteredMedia.length ? (
              <div className="media-live-grid">{filteredMedia.map((item) => <MediaCard key={item.id || item.slug || item.title} item={item} onOpen={setActiveMedia} />)}</div>
            ) : (
              <div className="media-empty"><Search size={28} /><h3>No media found</h3><p>Try another keyword or switch the filter back to All.</p><button className="button button--gold button--small" type="button" onClick={() => { setQuery(''); setFilter('All') }}>Reset library</button></div>
            )}
          </div>
        </section>

        <section className="media-info-section">
          <div className="shell">
            <div className="media-section-heading media-section-heading--inverse"><div><Eyebrow>About the collection</Eyebrow><h2>Useful context,<br /><em>not just content.</em></h2></div></div>
            <div className="media-info-grid">
              <article><span>01</span><Check size={22} /><h3>Rights & credits</h3><p>Each media item keeps its source visible. Copyright and reuse terms remain with the original institution, creator or licence.</p><a href="https://commons.wikimedia.org/" target="_blank" rel="noreferrer">Open media commons <ArrowUpRight size={16} /></a></article>
              <article><span>02</span><Headphones size={22} /><h3>Accessible media</h3><p>Where publishers provide captions, transcripts or descriptive context, the library points visitors back to those accessible source experiences.</p><Link to="/about-us">Our approach <ArrowUpRight size={16} /></Link></article>
              <article><span>03</span><Mic2 size={22} /><h3>Contribute a memory</h3><p>Museums, communities, guides and creators can propose original photography, recordings, oral histories or documentary material for review.</p><a href="mailto:stories@tourismmalawi.mw?subject=Media%20Library%20Contribution">Submit media <Mail size={15} /></a></article>
            </div>
          </div>
        </section>

        <section className="media-contribute-banner">
          <div className="shell media-contribute-banner__inner">
            <Mic2 size={38} />
            <div><Eyebrow>Community archive</Eyebrow><h2>Your story belongs<br /><em>in the record.</em></h2></div>
            <div><p>Share a place, celebration, object, memory or journey. Contributions should be original, properly credited and shared with the consent of the people represented.</p><a href="mailto:stories@tourismmalawi.mw?subject=Share%20a%20Malawi%20Story" className="button button--outline">Share your story <ArrowRight size={18} /></a></div>
          </div>
        </section>
      </main>
      <MediaFooter />
      {activeMedia && <MediaViewer item={activeMedia} onClose={() => setActiveMedia(null)} />}
    </>
  )
}
