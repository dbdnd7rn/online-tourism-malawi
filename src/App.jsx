import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  BookOpen,
  CalendarDays,
  Camera,
  Check,
  Clock3,
  Eye,
  EyeOff,
  Headphones,
  Heart,
  Globe2,
  Mail,
  MapPin,
  Menu,
  Mic2,
  MoveRight,
  Pause,
  Play,
  Search,
  Send,
  Sparkles,
  UsersRound,
  UserRound,
  Video,
  Volume2,
  X,
} from 'lucide-react'
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { useContent } from './context/ContentContext'
import { creativeSegments, images } from './data/content'
import { createContribution, loadSavedItems, removeSavedItem, saveItem, sendContactMessage, subscribeToNewsletter } from './services/memberService'

const AdminApp = lazy(() => import('./admin/AdminApp'))

const navigation = [
  { label: 'Home', to: '/' },
  { label: 'Sectors', to: '/segments' },
  { label: 'Museums', to: '/museums' },
  { label: 'Performance', to: '/performance' },
  { label: 'Events', to: '/events' },
  { label: 'Media', to: '/media-library' },
  { label: 'About', to: '/about-us' },
]

const slugify = (value = '') => value
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '')

const imageFallback = (event) => {
  event.currentTarget.style.opacity = '0'
  event.currentTarget.parentElement?.classList.add('image-fallback')
}

const reducedMotionQuery = '(prefers-reduced-motion: reduce)'

const prefersReducedMotion = () => (
  typeof window !== 'undefined' && window.matchMedia(reducedMotionQuery).matches
)

function useScrollProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const updateProgress = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      setProgress(scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0)
    }

    updateProgress()
    window.addEventListener('scroll', updateProgress, { passive: true })
    window.addEventListener('resize', updateProgress)
    return () => {
      window.removeEventListener('scroll', updateProgress)
      window.removeEventListener('resize', updateProgress)
    }
  }, [])

  return progress
}

function useRevealMotion(key) {
  useEffect(() => {
    const revealElements = () => document.querySelectorAll('[data-reveal]')

    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
      revealElements().forEach((element) => element.classList.add('is-visible'))
      return undefined
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      })
    }, { rootMargin: '0px 0px -72px 0px', threshold: 0.12 })

    const observe = () => {
      revealElements().forEach((element, index) => {
        if (element.dataset.revealReady) return
        element.dataset.revealReady = 'true'
        element.style.setProperty('--reveal-delay', element.dataset.revealDelay || `${Math.min(index % 7, 6) * 70}ms`)
        observer.observe(element)
      })
    }

    observe()
    const mutationObserver = new MutationObserver(observe)
    mutationObserver.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      mutationObserver.disconnect()
    }
  }, [key])
}

function handleTiltPointerMove(event) {
  if (prefersReducedMotion()) return
  const target = event.currentTarget
  const rect = target.getBoundingClientRect()
  const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2
  const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2
  target.style.setProperty('--tilt-x', `${(-y * 3.2).toFixed(2)}deg`)
  target.style.setProperty('--tilt-y', `${(x * 4.2).toFixed(2)}deg`)
  target.style.setProperty('--glow-x', `${((x + 1) * 50).toFixed(1)}%`)
  target.style.setProperty('--glow-y', `${((y + 1) * 50).toFixed(1)}%`)
}

function resetTiltPointer(event) {
  const target = event.currentTarget
  target.style.removeProperty('--tilt-x')
  target.style.removeProperty('--tilt-y')
  target.style.removeProperty('--glow-x')
  target.style.removeProperty('--glow-y')
}

function MotionLayer({ variant = 'page' }) {
  return (
    <div className={`motion-layer motion-layer--${variant}`} aria-hidden="true">
      <span className="motion-layer__ring motion-layer__ring--outer" />
      <span className="motion-layer__ring motion-layer__ring--inner" />
      <span className="motion-layer__thread motion-layer__thread--one" />
      <span className="motion-layer__thread motion-layer__thread--two" />
      <img className="motion-layer__map" src={images.map} alt="" onError={imageFallback} />
    </div>
  )
}

function MalawiMark({ compact = false }) {
  return (
    <Link to="/" className={`brand ${compact ? 'brand--compact' : ''}`} aria-label="Online Tourism Malawi home">
      <span className="brand__mark" aria-hidden="true">
        <img src={images.map} alt="" onError={imageFallback} />
      </span>
      <span className="brand__words">
        <small>Online Tourism</small>
        <strong>Malawi</strong>
      </span>
    </Link>
  )
}

function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const navigate = useNavigate()
  const { user, canManageContent } = useAuth()
  const closeOverlays = () => { setMenuOpen(false); setSearchOpen(false) }

  const submitSearch = (event) => {
    event.preventDefault()
    const query = new FormData(event.currentTarget).get('search')?.trim()
    closeOverlays()
    navigate(query ? `/search?q=${encodeURIComponent(query)}` : '/search')
  }

  return (
    <>
      <header className="site-header">
        <div className="site-header__inner shell shell--wide">
          <MalawiMark />
          <nav className="desktop-nav" aria-label="Primary navigation">
            {navigation.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={closeOverlays}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="header-actions">
            <button className="icon-button search-trigger" onClick={() => setSearchOpen((value) => !value)} aria-label="Search" aria-expanded={searchOpen}>
              {searchOpen ? <X size={19} /> : <Search size={19} />}
            </button>
            {canManageContent && <Link className="admin-shortcut" to="/admin" onClick={closeOverlays}><Sparkles size={15} /><span>Studio</span></Link>}
            {user ? (
              <Link className="account-pill sign-in-link" to="/account" title="Open your account">
                <span>{user.email?.slice(0, 1).toUpperCase()}</span>{user.email?.split('@')[0]}
              </Link>
            ) : <Link className="button button--gold button--small sign-in-link" to="/sign-in" onClick={closeOverlays}>Sign in</Link>}
            <button className="icon-button menu-trigger" onClick={() => setMenuOpen((value) => !value)} aria-label="Open menu" aria-expanded={menuOpen}>
              {menuOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
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
        <div className="mobile-panel__top">
          <MalawiMark compact />
          <button className="icon-button" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={21} /></button>
        </div>
        <nav aria-label="Mobile navigation">
          {navigation.map((item, index) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={closeOverlays}>
              <span>0{index + 1}</span>{item.label}<ArrowUpRight size={20} />
            </NavLink>
          ))}
        </nav>
        <div className="mobile-panel__footer">The warm heart of Africa, online.</div>
      </div>
      {menuOpen && <button className="panel-scrim" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}
    </>
  )
}

function Footer() {
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
          <div><strong>Discover</strong><Link to="/segments">Creative sectors</Link><Link to="/directory">Creative directory</Link><Link to="/plan-your-visit">Plan your visit</Link></div>
          <div><strong>Take part</strong><Link to="/events">Events</Link><Link to="/contribute">Contribute</Link><Link to="/account">My collection</Link></div>
          <div><strong>Keep in touch</strong><Link to="/contact">Contact us</Link><a href="mailto:hello@tourismmalawi.mw">hello@tourismmalawi.mw</a><span>Lilongwe, Malawi</span></div>
        </div>
      </div>
      <div className="shell shell--wide site-footer__bottom">
        <span>© 2026 Online Tourism Malawi</span>
        <span className="footer-legal"><Link to="/accessibility">Accessibility</Link><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link></span>
      </div>
    </footer>
  )
}

function Layout({ children }) {
  const location = useLocation()
  const scrollProgress = useScrollProgress()
  useRevealMotion(location.pathname)
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [location.pathname])
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <div className="scroll-progress" style={{ transform: `scaleX(${scrollProgress})` }} aria-hidden="true" />
      <Header />
      <main id="main-content" className="route-motion" key={location.pathname}>{children}</main>
      <Footer />
    </>
  )
}

function Eyebrow({ children }) {
  return <div className="eyebrow"><span />{children}</div>
}

function SectionHeading({ eyebrow, title, copy, action, inverse = false }) {
  return (
    <div className={`section-heading ${inverse ? 'section-heading--inverse' : ''}`} data-reveal="up">
      <div><Eyebrow>{eyebrow}</Eyebrow><h2>{title}</h2>{copy && <p>{copy}</p>}</div>
      {action && <Link to={action.to} className="text-link">{action.label}<ArrowUpRight size={17} /></Link>}
    </div>
  )
}

function Picture({ src, alt, className = '' }) {
  return <div className={`picture ${className}`}><img src={src} alt={alt} loading="lazy" onError={imageFallback} /></div>
}

function PageHero({ eyebrow, title, copy, image, imageAlt, children, tall = false }) {
  return (
    <section className={`page-hero ${tall ? 'page-hero--tall' : ''}`}>
      <Picture src={image} alt={imageAlt} className="page-hero__image" />
      <div className="page-hero__shade" />
      <MotionLayer variant="page" />
      <div className="shell page-hero__content" data-reveal="hero">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1>{title}</h1>
        <p>{copy}</p>
        {children}
      </div>
      <span className="page-hero__index" aria-hidden="true">MW</span>
    </section>
  )
}

function SaveButton({ item }) {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    if (!user) return undefined
    loadSavedItems(user.id).then((items) => {
      if (active) setSaved(items.some((savedItem) => savedItem.item_key === item.item_key))
    }).catch(() => {})
    return () => { active = false }
  }, [item.item_key, user])

  const toggleSaved = async () => {
    if (!user) {
      navigate(`/sign-in?next=${encodeURIComponent(location.pathname)}`)
      return
    }
    setBusy(true)
    try {
      if (saved) await removeSavedItem(user.id, item.item_key)
      else await saveItem(user.id, item)
      setSaved((value) => !value)
    } finally { setBusy(false) }
  }

  return (
    <button className={`save-button ${saved ? 'save-button--saved' : ''}`} onClick={toggleSaved} disabled={busy}>
      {saved ? <Heart size={18} fill="currentColor" /> : <Bookmark size={18} />}{busy ? 'Saving…' : saved ? 'Saved to collection' : 'Save to collection'}
    </button>
  )
}

function HomePage() {
  const { events } = useContent()
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const submit = (event) => { event.preventDefault(); navigate(query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : '/search') }
  return (
    <>
      <section className="home-hero">
        <Picture src={images.gule} alt="A Gule Wamkulu performance in Malawi" className="home-hero__image" />
        <div className="home-hero__veil" />
        <MotionLayer variant="home" />
        <div className="shell shell--wide home-hero__content">
          <div className="home-hero__copy" data-reveal="hero">
            <Eyebrow>Culture · Nature · Memory</Eyebrow>
            <h1>Malawi,<br /><em>alive in every story.</em></h1>
            <p>Step into the Warm Heart of Africa—where ancient rock art, living traditions and unforgettable landscapes meet.</p>
            <div className="home-hero__actions">
              <Link className="button button--gold" to="/explore">Begin exploring <ArrowRight size={18} /></Link>
              <Link className="round-link" to="/media-library" aria-label="Listen to stories"><Play size={17} fill="currentColor" /></Link>
              <span className="round-link-label">Listen to Malawi</span>
            </div>
          </div>
          <form className="discovery-search" onSubmit={submit} data-reveal="up" data-reveal-delay="180ms">
            <span><Search size={20} /></span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} aria-label="What would you like to discover?" placeholder="What would you like to discover?" />
            <button aria-label="Search" type="submit"><ArrowRight size={20} /></button>
          </form>
          <div className="hero-side-note"><span>Scroll to wander</span><ArrowDownRight size={18} /></div>
        </div>
      </section>

      <div className="motion-ticker" aria-hidden="true">
        <div>
          {['Lake Malawi', 'Chongoni', 'Mount Mulanje', 'Gule Wamkulu', 'Karonga', 'Nyika Plateau', 'Warm Heart'].concat(['Lake Malawi', 'Chongoni', 'Mount Mulanje', 'Gule Wamkulu', 'Karonga', 'Nyika Plateau', 'Warm Heart']).map((item, index) => <span key={`${item}-${index}`}>{item}</span>)}
        </div>
      </div>

      <section className="intro-band">
        <div className="shell intro-band__grid" data-reveal="up">
          <div><span className="dropcap">W</span><p>e believe a country is best understood through the voices, places and memories that shape it.</p></div>
          <blockquote>“Takulandirani”<small>Welcome, in Chichewa</small></blockquote>
          <div className="intro-stat"><strong>500+</strong><span>stories, objects<br />and experiences</span></div>
        </div>
      </section>

      <section className="section section--ivory">
        <div className="shell">
          <SectionHeading eyebrow="Six creative sectors" title={<>A country of <em>many worlds</em></>} copy="Explore Malawi through heritage, performance, image, publishing, media and design." action={{ label: 'See all sectors', to: '/segments' }} />
          <div className="path-grid path-grid--six">
            {creativeSegments.map((item, index) => (
              <Link className="path-card" to={item.route} key={item.title} data-reveal="card" data-tilt data-reveal-delay={`${index * 75}ms`} onPointerMove={handleTiltPointerMove} onPointerLeave={resetTiltPointer}>
                <Picture src={item.image} alt={item.imageAlt} />
                <span className="path-card__no">{item.number}</span>
                <div className="path-card__content"><h3>{item.title}</h3><p>{item.copy}</p><small>{item.subcategories.map((subcategory) => subcategory.title).join(' · ')}</small><span className="path-card__arrow"><ArrowUpRight size={19} /></span></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="feature-split" data-reveal="up">
        <Picture src={images.chongoni} alt="Ancient rock art in Malawi" className="feature-split__image" />
        <div className="feature-split__body">
          <Eyebrow>Featured story</Eyebrow>
          <span className="feature-split__number">01 / 04</span>
          <h2>Messages<br /><em>on stone</em></h2>
          <p>At Chongoni, paintings left by hunter-gatherers and farming communities hold a layered record of belief, ritual and continuity.</p>
          <Link to="/explore" className="button button--outline">Read the story <ArrowRight size={18} /></Link>
          <div className="feature-split__controls"><button aria-label="Previous story"><ArrowLeft /></button><button aria-label="Next story"><ArrowRight /></button></div>
        </div>
      </section>

      <section className="section section--dark">
        <div className="shell">
          <SectionHeading inverse eyebrow="Gather in Malawi" title={<>What’s <em>happening</em></>} copy="Festivals, talks, performances and cultural encounters across the country." action={{ label: 'View all events', to: '/events' }} />
          <div className="event-strip">
            {events.slice(0, 3).map((event) => <EventCard key={event.title} event={event} />)}
          </div>
        </div>
      </section>

      <Newsletter />
    </>
  )
}

function Newsletter() {
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const submitNewsletter = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const email = new FormData(event.currentTarget).get('email')
      await subscribeToNewsletter(email)
      setSent(true)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to join the list right now.')
    } finally { setBusy(false) }
  }
  return (
    <section className="newsletter">
      <div className="shell newsletter__inner">
        <div><Eyebrow>Letters from Malawi</Eyebrow><h2>Stay close to<br /><em>the story.</em></h2></div>
        {sent ? <div className="form-success"><Check size={21} /> Zikomo! Your next letter is on its way.</div> : (
          <form onSubmit={submitNewsletter}>
            <label htmlFor="newsletter-email">Your email address</label>
            <div><input id="newsletter-email" name="email" type="email" required placeholder="you@example.com" /><button type="submit" disabled={busy}>{busy ? 'Joining…' : 'Join us'} <MoveRight size={18} /></button></div>
            {error && <small className="form-error" role="alert">{error}</small>}
            <small>Monthly stories, cultural notes and event highlights. No clutter.</small>
          </form>
        )}
      </div>
    </section>
  )
}

function SegmentPillars({ segment, inverse = false }) {
  return (
    <section className={`section segment-pillars ${inverse ? 'section--dark segment-pillars--inverse' : 'section--paper'}`}>
      <div className="shell">
        <SectionHeading
          inverse={inverse}
          eyebrow={`${segment.number} · ${segment.shortTitle}`}
          title={<>Inside the <em>segment</em></>}
          copy="Use these official areas to move directly to the creative work, institutions and stories that interest you."
        />
        <div className={`segment-pillar-grid ${segment.subcategories.length > 4 ? 'segment-pillar-grid--five' : ''}`}>
          {segment.subcategories.map((subcategory, index) => (
            <article key={subcategory.title} data-reveal="card" data-reveal-delay={`${index * 70}ms`}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{subcategory.title}</h3>
              <p>{subcategory.copy}</p>
              <i aria-hidden="true"><ArrowUpRight size={18} /></i>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function SegmentsPage() {
  return (
    <>
      <PageHero
        eyebrow="Malawi’s creative economy"
        title={<>Six sectors.<br /><em>One living story.</em></>}
        copy="Discover the official cultural and creative segments that organise this gateway to Malawi."
        image={images.market}
        imageAlt="A colourful gathering around Malawian food, culture and creative life"
        tall
      >
        <a href="#segment-directory" className="button button--gold">Explore all six <ArrowDownRight size={18} /></a>
      </PageHero>
      <section id="segment-directory" className="section section--ivory segment-directory">
        <div className="shell">
          <SectionHeading eyebrow="Find your way in" title={<>The cultural &<br /><em>creative landscape</em></>} copy="Each segment opens onto its own practices, organisations, people and public experiences." />
          <div className="segment-directory__grid">
            {creativeSegments.map((segment, index) => (
              <article className="segment-directory-card" key={segment.title} data-reveal="card" data-tilt data-reveal-delay={`${index * 70}ms`} onPointerMove={handleTiltPointerMove} onPointerLeave={resetTiltPointer}>
                <Picture src={segment.image} alt={segment.imageAlt} />
                <div className="segment-directory-card__body">
                  <span>{segment.number}</span>
                  <small>{segment.eyebrow}</small>
                  <h2>{segment.title}</h2>
                  <p>{segment.copy}</p>
                  <ul>{segment.subcategories.map((subcategory) => <li key={subcategory.title}><ArrowRight size={14} />{subcategory.title}</li>)}</ul>
                  <Link className="text-link" to={segment.route}>Enter this segment <ArrowUpRight size={18} /></Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="sector-bridge">
        <div className="shell sector-bridge__inner" data-reveal="up">
          <div><Eyebrow>Collections across sectors</Eyebrow><h2>Objects, archives<br />and <em>living ideas.</em></h2></div>
          <div><p>Museums and collections connect every part of Malawi’s creative landscape—from archaeology and craft to publishing, broadcasting and contemporary design.</p><Link className="button button--outline" to="/museums">Explore museums <ArrowRight size={18} /></Link></div>
        </div>
      </section>
    </>
  )
}

function SegmentDetailPage({ segment }) {
  return (
    <>
      <PageHero eyebrow={segment.eyebrow} title={<>{segment.title.split(' & ')[0]} &<br /><em>{segment.title.split(' & ').slice(1).join(' & ')}</em></>} copy={segment.copy} image={segment.image} imageAlt={segment.imageAlt} tall>
        <a href="#segment-areas" className="button button--gold">Explore the areas <ArrowDownRight size={18} /></a>
      </PageHero>
      <div id="segment-areas"><SegmentPillars segment={segment} /></div>
      <section className="sector-editorial">
        <div className="shell sector-editorial__grid" data-reveal="up">
          <Picture src={segment.title === 'Books & Press' ? images.fort : segment.title === 'Design & Creative' ? images.tea : images.guleArchive} alt={`A Malawi story connected to ${segment.title}`} />
          <div><Eyebrow>Creative Malawi</Eyebrow><h2>Local practice.<br /><em>Global imagination.</em></h2><p>Meet established practitioners, emerging talent, community organisations and learning spaces. This first collection is a realistic editorial foundation ready to grow through verified Malawian partnerships.</p><div className="sector-editorial__links"><Link className="button button--outline" to="/events">Find related events <ArrowRight size={18} /></Link><Link className="text-link" to="/about-us">How we curate <ArrowUpRight size={18} /></Link></div></div>
        </div>
      </section>
    </>
  )
}

function SearchPage() {
  const { heritageItems, museums, performances, events, podcasts, creatives } = useContent()
  const location = useLocation()
  const navigate = useNavigate()
  const urlQuery = new URLSearchParams(location.search).get('q') || ''

  const index = useMemo(() => [
    ...creativeSegments.map((item) => ({ title: item.title, copy: item.copy, type: 'Creative sector', image: item.image, route: item.route, meta: item.eyebrow })),
    ...heritageItems.map((item) => ({ title: item.title, copy: item.tag, type: item.type, image: item.image, route: `/heritage/${item.slug || slugify(item.title)}`, meta: item.location })),
    ...museums.map((item) => ({ title: item.title, copy: item.detail, type: 'Museum & collection', image: item.image, route: `/museums/${item.slug || slugify(item.title)}`, meta: item.location })),
    ...performances.map((item) => ({ title: item.title, copy: item.description, type: 'Performance', image: item.image, route: '/performance', meta: item.people })),
    ...events.map((item) => ({ title: item.title, copy: `${item.day} ${item.month} · ${item.place}`, type: item.type, image: item.image, route: `/events/${item.slug || slugify(item.title)}`, meta: 'Event' })),
    ...podcasts.map((item) => ({ title: item.title, copy: item.guest, type: 'Podcast', image: item.image, route: '/media-library', meta: item.length })),
    ...creatives.map((item) => ({ title: item.name, copy: item.description, type: item.segment, image: item.image, route: `/directory/${item.slug}`, meta: item.location })),
  ], [creatives, events, heritageItems, museums, performances, podcasts])
  const normalized = urlQuery.trim().toLowerCase()
  const results = normalized ? index.filter((item) => `${item.title} ${item.copy} ${item.type} ${item.meta}`.toLowerCase().includes(normalized)) : index.slice(0, 8)
  const submit = (event) => {
    event.preventDefault()
    const nextQuery = new FormData(event.currentTarget).get('search')?.trim()
    navigate(nextQuery ? `/search?q=${encodeURIComponent(nextQuery)}` : '/search')
  }

  return (
    <>
      <section className="search-page-hero">
        <MotionLayer variant="page" />
        <div className="shell" data-reveal="hero"><Eyebrow>Search all of Malawi</Eyebrow><h1>What would you like<br />to <em>discover?</em></h1><form onSubmit={submit}><Search size={23} /><input key={urlQuery} name="search" autoFocus defaultValue={urlQuery} placeholder="Try ‘Mulanje’, ‘crafts’ or ‘music’" aria-label="Search all content" /><button type="submit"><ArrowRight size={20} /></button></form></div>
      </section>
      <section className="section section--ivory search-results">
        <div className="shell"><div className="result-note" data-reveal="up"><span>{String(results.length).padStart(2, '0')}</span>{normalized ? `results for “${urlQuery}”` : 'featured discoveries'}</div>
          {results.length ? <div className="search-results__grid">{results.map((item, indexNumber) => <Link to={item.route} className="search-result-card" key={`${item.type}-${item.title}`} data-reveal="card" data-reveal-delay={`${indexNumber * 55}ms`}><Picture src={item.image} alt={item.title} /><div><span>{item.type}</span><h2>{item.title}</h2><p>{item.copy}</p><small>{item.meta}<ArrowUpRight size={16} /></small></div></Link>)}</div> : <EmptyState />}
        </div>
      </section>
    </>
  )
}

function DirectoryPage() {
  const { creatives } = useContent()
  const [filter, setFilter] = useState('All sectors')
  const filters = ['All sectors', ...creativeSegments.map((segment) => segment.title)]
  const visible = filter === 'All sectors' ? creatives : creatives.filter((profile) => profile.segment === filter)
  return (
    <>
      <PageHero eyebrow="People · Studios · Organisations" title={<>Malawi’s Creative<br /><em>Directory</em></>} copy="Find makers, cultural organisations, production teams, publishers and creative practices across the six sectors." image={images.market} imageAlt="Malawian creative people gathering around local culture" tall>
        <a className="button button--gold" href="#directory-list">Browse the directory <ArrowDownRight size={18} /></a>
      </PageHero>
      <section id="directory-list" className="section section--ivory directory-page"><div className="shell">
        <div className="directory-toolbar" data-reveal="up"><div className="filter-row" role="group" aria-label="Filter creative directory">{filters.map((item) => <button key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>{item}</button>)}</div><Link className="button button--outline" to="/contribute?type=creative_profile">Join the directory <ArrowRight size={17} /></Link></div>
        <p className="directory-note" data-reveal="up">Verified profiles are marked. Unverified entries are realistic editorial placeholders for the launch experience.</p>
        <div className="directory-grid">{visible.map((profile, index) => <Link className="directory-card" to={`/directory/${profile.slug}`} key={profile.slug} data-reveal="card" data-tilt data-reveal-delay={`${index * 65}ms`} onPointerMove={handleTiltPointerMove} onPointerLeave={resetTiltPointer}><Picture src={profile.image} alt={profile.name} /><div><span>{profile.verified ? <><Check size={13} /> Verified profile</> : 'Directory preview'}</span><h2>{profile.name}</h2><p>{profile.focus}</p><small><MapPin size={14} />{profile.location}</small><i><ArrowUpRight size={18} /></i></div></Link>)}</div>
      </div></section>
    </>
  )
}

function CreatorDetailPage() {
  const { creatives } = useContent()
  const { slug } = useParams()
  const profile = creatives.find((item) => item.slug === slug)
  if (!profile) return <NotFoundPage />
  return (
    <>
      <PageHero eyebrow={profile.segment} title={<>{profile.name}</>} copy={profile.description} image={profile.image} imageAlt={profile.name} tall>
        <div className="hero-detail-actions"><Link className="button button--gold" to="/directory"><ArrowLeft size={18} />Directory</Link><span><MapPin size={16} />{profile.location}</span></div>
      </PageHero>
      <section className="section section--paper creator-profile"><div className="shell creator-profile__grid">
        <aside data-reveal="up"><span className={profile.verified ? 'verified-badge' : 'preview-badge'}>{profile.verified ? <><Check size={14} />Verified</> : 'Editorial preview'}</span><SaveButton item={{ item_key: `creative:${profile.slug}`, item_type: 'creative_profile', title: profile.name, route: `/directory/${profile.slug}`, image: profile.image, metadata: { location: profile.location, segment: profile.segment } }} /></aside>
        <article data-reveal="up"><Eyebrow>Creative profile</Eyebrow><h2>Practice rooted<br /><em>in place.</em></h2><p className="lead">{profile.description}</p><div className="creator-profile__facts"><div><span>Focus</span><strong>{profile.focus}</strong></div><div><span>Location</span><strong>{profile.location}</strong></div><div><span>Sector</span><strong>{profile.segment}</strong></div></div><div className="creator-profile__actions">{profile.website && <a className="button button--outline" href={profile.website} target="_blank" rel="noreferrer">Visit website <Globe2 size={17} /></a>}<Link className="text-link" to="/contact">Contact the directory team <ArrowUpRight size={17} /></Link></div></article>
      </div></section>
      <section className="sector-bridge"><div className="shell sector-bridge__inner" data-reveal="up"><div><Eyebrow>Build the directory</Eyebrow><h2>Know a creative<br /><em>we should meet?</em></h2></div><div><p>Help us grow a useful, verified map of Malawi’s creative economy.</p><Link className="button button--outline" to="/contribute?type=creative_profile">Suggest a profile <ArrowRight size={18} /></Link></div></div></section>
    </>
  )
}

function ExplorePage() {
  const { heritageItems } = useContent()
  const location = useLocation()
  const initialQuery = new URLSearchParams(location.search).get('q') || ''
  const [filter, setFilter] = useState('All')
  const [query, setQuery] = useState(initialQuery)
  const segment = creativeSegments[0]
  const filters = ['All', ...segment.subcategories.map((subcategory) => subcategory.title)]
  const filtered = useMemo(() => heritageItems.filter((item) => {
    const typeMatch = filter === 'All' || item.type === filter
    const queryMatch = `${item.title} ${item.location} ${item.type}`.toLowerCase().includes(query.toLowerCase())
    return typeMatch && queryMatch
  }), [filter, query, heritageItems])
  return (
    <>
      <PageHero eyebrow={segment.eyebrow} title={<>Cultural & Natural<br /><em>Heritage</em></>} copy={segment.copy} image={images.mulanje} imageAlt="Mount Mulanje rising over the landscape" tall />
      <SegmentPillars segment={segment} />
      <section className="section section--ivory">
        <div className="shell">
          <div className="collection-toolbar" data-reveal="up">
            <div className="filter-row" role="group" aria-label="Filter destinations">{filters.map((item) => <button className={filter === item ? 'active' : ''} onClick={() => setFilter(item)} key={item}>{item}</button>)}</div>
            <label className="inline-search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the collection" aria-label="Search heritage collection" /></label>
          </div>
          <div className="result-note" data-reveal="up"><span>{String(filtered.length).padStart(2, '0')}</span> places to wander</div>
          {filtered.length ? <div className="heritage-grid">{filtered.map((item, index) => <HeritageCard key={item.title} item={item} index={index} />)}</div> : <EmptyState />}
        </div>
      </section>
      <section className="map-feature">
        <div className="shell map-feature__inner" data-reveal="up">
          <div><Eyebrow>North to south</Eyebrow><h2>One long,<br /><em>beautiful journey</em></h2><p>Malawi stretches along the Great Rift Valley. Discover high plateaux in the north, the vast lake through the centre, and dramatic massifs in the south.</p><Link className="text-link" to="/events">Plan around an event <ArrowUpRight size={18} /></Link></div>
          <div className="malawi-map-display"><img src={images.map} alt="Accurate outline map of Malawi" onError={imageFallback} /><span className="map-pin map-pin--north">Nyika<small>Northern Region</small></span><span className="map-pin map-pin--centre">Lake Malawi<small>Central Region</small></span><span className="map-pin map-pin--south">Mulanje<small>Southern Region</small></span></div>
        </div>
      </section>
    </>
  )
}

function HeritageCard({ item, index }) {
  const route = `/heritage/${item.slug || slugify(item.title)}`
  return (
    <article className={`heritage-card ${index === 0 ? 'heritage-card--large' : ''}`} data-reveal="card" data-tilt data-reveal-delay={`${index * 70}ms`} onPointerMove={handleTiltPointerMove} onPointerLeave={resetTiltPointer}>
      <Picture src={item.image} alt={item.title} />
      <div className="heritage-card__shade" />
      <div className="heritage-card__top"><span>{item.tag}</span><span>0{index + 1}</span></div>
      <div className="heritage-card__body"><small><MapPin size={14} />{item.location}</small><h3>{item.title}</h3><Link to={route} aria-label={`Explore ${item.title}`}><ArrowUpRight size={20} /></Link></div>
    </article>
  )
}

function EmptyState() {
  return <div className="empty-state" data-reveal="up"><Search size={26} /><h3>No stories found</h3><p>Try a broader word or choose another category.</p></div>
}

function ContentDetailPage({ kind }) {
  const content = useContent()
  const { slug } = useParams()
  const collections = {
    heritage: content.heritageItems,
    museum: content.museums,
    event: content.events,
  }
  const collection = collections[kind] || []
  const item = collection.find((entry) => (entry.slug || slugify(entry.title)) === slug)
  if (!item) return <NotFoundPage />

  const configs = {
    heritage: {
      eyebrow: item.type,
      location: item.location,
      backTo: '/explore',
      backLabel: 'All heritage',
      itemType: 'heritage',
      intro: item.summary || `${item.title} is part of Malawi’s layered cultural and natural inheritance—a place to encounter slowly, respectfully and with local guidance.`,
      heading: 'A place held in memory',
      facts: [['Category', item.type], ['Location', item.location], ['Recognition', item.tag], ['Best for', 'Context-rich discovery']],
    },
    museum: {
      eyebrow: 'Museum & Collection',
      location: item.location,
      backTo: '/museums',
      backLabel: 'All museums',
      itemType: 'museum',
      intro: item.detail,
      heading: 'Inside the collection',
      facts: [['Location', item.location], ['Opening hours', item.hours || 'Confirm before visiting'], ['Collection', 'History · culture · learning'], ['Access', 'Contact the institution']],
    },
    event: {
      eyebrow: `${item.type} · ${item.month} ${item.day}`,
      location: item.place,
      backTo: '/events',
      backLabel: 'All events',
      itemType: 'event',
      intro: item.summary || `${item.title} brings people together through culture, creativity and a shared sense of place. Programme details are illustrative until confirmed by the organiser.`,
      heading: 'Gather around the story',
      facts: [['Date', `${item.day} ${item.month} 2026`], ['Location', item.place], ['Event type', item.type], ['Planning note', 'Confirm details before travel']],
    },
  }
  const config = configs[kind]
  const routePrefix = kind === 'heritage' ? '/heritage' : kind === 'museum' ? '/museums' : '/events'
  const related = collection.filter((entry) => entry !== item).slice(0, 3)

  return (
    <>
      <PageHero eyebrow={config.eyebrow} title={<>{item.title}</>} copy={config.intro} image={item.image} imageAlt={item.title} tall>
        <div className="hero-detail-actions"><Link className="button button--gold" to={config.backTo}><ArrowLeft size={18} />{config.backLabel}</Link><span><MapPin size={16} />{config.location}</span></div>
      </PageHero>
      <section className="section section--ivory detail-story">
        <div className="shell detail-story__grid">
          <aside data-reveal="up"><span className="section-index">01</span><SaveButton item={{ item_key: `${config.itemType}:${item.slug || slugify(item.title)}`, item_type: config.itemType, title: item.title, route: `${routePrefix}/${item.slug || slugify(item.title)}`, image: item.image, metadata: { location: config.location } }} /></aside>
          <article data-reveal="up"><Eyebrow>Know before you go</Eyebrow><h2>{config.heading}</h2><p className="lead">{config.intro}</p><p>{item.body || 'This editorial page is a foundation for verified contributions from custodians, curators, organisers and communities. It brings practical discovery together with the context needed to engage thoughtfully.'}</p><p>Information may change. For an in-person visit or event, confirm access, dates, photography guidance and local arrangements with the relevant host.</p></article>
        </div>
        <div className="shell detail-facts" data-reveal="up">{config.facts.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
      </section>
      <section className="section section--paper related-stories">
        <div className="shell"><SectionHeading eyebrow="Continue exploring" title="Related discoveries" action={{ label: config.backLabel, to: config.backTo }} />
          <div className="related-stories__grid">{related.map((entry, index) => <Link to={`${routePrefix}/${entry.slug || slugify(entry.title)}`} key={entry.title} data-reveal="card" data-reveal-delay={`${index * 70}ms`}><Picture src={entry.image} alt={entry.title} /><span>{String(index + 1).padStart(2, '0')}</span><h3>{entry.title}</h3><small>{entry.location || entry.place}</small></Link>)}</div>
        </div>
      </section>
    </>
  )
}

function MuseumsPage() {
  const { museums } = useContent()
  return (
    <>
      <PageHero eyebrow="Places of memory" title={<>Museums &<br /><em>Collections</em></>} copy="Meet the keepers, objects and archives that carry Malawi’s histories forward." image={images.karonga} imageAlt="A museum collection in Malawi">
        <a href="#museum-list" className="button button--gold">Browse museums <ArrowDownRight size={18} /></a>
      </PageHero>
      <section className="museum-intro section section--ivory">
        <div className="shell museum-intro__grid" data-reveal="up"><div><Eyebrow>More than objects</Eyebrow><h2>Every collection is<br /><em>a conversation.</em></h2></div><p>From fossil discoveries in Karonga to the expressive masks of Mua, Malawi’s collections connect scientific discovery with lived cultural knowledge. Explore slowly—and listen to the voices around each object.</p></div>
      </section>
      <section id="museum-list" className="section section--paper">
        <div className="shell">
          <SectionHeading eyebrow="Across the regions" title="Museums to discover" copy="Practical information is illustrative and should be confirmed with each institution before travel." />
          <div className="museum-list">{museums.map((museum, index) => (
            <article className="museum-row" key={museum.title} data-reveal="up" data-reveal-delay={`${index * 70}ms`}>
              <span className="museum-row__index">0{index + 1}</span>
              <Picture src={museum.image} alt={museum.title} />
              <div className="museum-row__copy"><small><MapPin size={14} />{museum.location}</small><h3>{museum.title}</h3><p>{museum.detail}</p><span><Clock3 size={15} />{museum.hours}</span></div>
              <Link className="round-arrow" to={`/museums/${museum.slug || slugify(museum.title)}`} aria-label={`View ${museum.title}`}><ArrowUpRight /></Link>
            </article>
          ))}</div>
        </div>
      </section>
      <section className="object-feature">
        <div className="shell object-feature__inner" data-reveal="up"><Picture src={images.gulePortrait} alt="Gule Wamkulu ceremonial attire" /><div><Eyebrow>Object stories</Eyebrow><span className="object-feature__tag">From the living collection</span><h2>Not simply<br /><em>a mask</em></h2><p>In Gule Wamkulu, costume, character, movement and audience are inseparable. Cultural meaning lives in performance—not only behind museum glass.</p><Link className="button button--outline" to="/performance">Meet the tradition <ArrowRight size={18} /></Link></div></div>
      </section>
    </>
  )
}

function PerformancePage() {
  const { performances } = useContent()
  const [active, setActive] = useState(0)
  const current = performances[active]
  const segment = creativeSegments[1]
  return (
    <>
      <PageHero eyebrow={segment.eyebrow} title={<>Performance &<br /><em>Celebration</em></>} copy={segment.copy} image={images.gule} imageAlt="Gule Wamkulu dancers performing in Malawi" tall>
        <Link className="button button--gold" to="/media-library">Listen to the stories <Headphones size={18} /></Link>
      </PageHero>
      <SegmentPillars segment={segment} />
      <section className="section section--dark performance-browser">
        <div className="shell">
          <SectionHeading inverse eyebrow="Traditions in motion" title={<>Carried by<br /><em>the community</em></>} copy="Select a tradition to begin. Each one remains connected to its own people, place and purpose." />
          <div className="performance-browser__grid">
            <div className="performance-tabs" role="tablist" aria-label="Performance traditions" data-reveal="up">{performances.map((item, index) => <button role="tab" aria-selected={active === index} className={active === index ? 'active' : ''} onClick={() => setActive(index)} key={item.title}><span>0{index + 1}</span><strong>{item.title}</strong><small>{item.people}</small><ArrowRight size={18} /></button>)}</div>
            <article className="performance-focus" key={current.title} data-reveal="card" data-tilt onPointerMove={handleTiltPointerMove} onPointerLeave={resetTiltPointer}>
              <Picture src={current.image} alt={`${current.title} tradition`} />
              <div className="performance-focus__shade" />
              <div className="performance-focus__body"><span>{current.label}</span><h3>{current.title}</h3><p>{current.description}</p><Link to="/media-library">Hear the full story <Play size={14} fill="currentColor" /></Link></div>
            </article>
          </div>
        </div>
      </section>
      <section className="section section--ivory rhythm-section">
        <div className="shell rhythm-section__grid" data-reveal="up"><div><span className="giant-quote">“</span><blockquote>When the drum speaks, everybody understands.</blockquote><small>— A saying carried across generations</small></div><div><Eyebrow>More than spectacle</Eyebrow><h2>Come with<br /><em>respect.</em></h2><p>Many performances are ceremonies, not staged attractions. Ask before photographing, follow community guidance and remember that cultural custodians decide how traditions are shared.</p><Link className="text-link" to="/about-us">Our approach to cultural respect <ArrowUpRight size={18} /></Link></div></div>
      </section>
    </>
  )
}

function EventCard({ event }) {
  return (
    <article className="event-card" data-reveal="card" data-tilt onPointerMove={handleTiltPointerMove} onPointerLeave={resetTiltPointer}>
      <Picture src={event.image} alt={event.title} />
      <div className="event-card__shade" />
      <div className="event-card__date"><strong>{event.day}</strong><span>{event.month}</span></div>
      <div className="event-card__body"><span>{event.type}</span><h3>{event.title}</h3><small><MapPin size={14} />{event.place}</small></div>
      <Link className="event-card__link" to={`/events/${event.slug || slugify(event.title)}`} aria-label={`View ${event.title}`}><ArrowUpRight size={19} /></Link>
    </article>
  )
}

function EventsPage() {
  const { events } = useContent()
  const [filter, setFilter] = useState('All events')
  const types = ['All events', 'Festival', 'Culture', 'Arts', 'Music', 'Heritage', 'Film']
  const visible = filter === 'All events' ? events : events.filter((event) => event.type === filter)
  return (
    <>
      <PageHero eyebrow="Come together" title={<>Events &<br /><em>Gatherings</em></>} copy="Find the festivals, performances, exhibitions and conversations bringing Malawi’s cultural calendar to life." image={images.lakeSunset} imageAlt="Sunset gathering at Lake Malawi">
        <div className="hero-meta"><span><CalendarDays size={17} />September — November 2026</span><span><MapPin size={17} />Across Malawi</span></div>
      </PageHero>
      <section className="section section--ivory">
        <div className="shell">
          <div className="events-toolbar" data-reveal="up"><div className="filter-row" role="group" aria-label="Filter events">{types.map((type) => <button key={type} className={filter === type ? 'active' : ''} onClick={() => setFilter(type)}>{type}</button>)}</div><span>{visible.length} upcoming</span></div>
          <div className="events-page-grid">{visible.map((event) => <EventCard key={event.title} event={event} />)}</div>
        </div>
      </section>
      <section className="event-cta"><div className="shell event-cta__inner" data-reveal="up"><div><Eyebrow>Hosting something?</Eyebrow><h2>Put your event<br /><em>on the map.</em></h2></div><div><p>Community organisations, museums and cultural groups can share eligible public events with our editorial team.</p><Link to="/contribute?type=event" className="button button--gold">Submit an event <ArrowRight size={18} /></Link></div></div></section>
    </>
  )
}

function AboutPage() {
  return (
    <>
      <PageHero eyebrow="Our purpose" title={<>Malawi deserves<br />to be <em>felt.</em></>} copy="We are building a generous, living digital doorway into the country’s heritage—made for Malawians and curious visitors everywhere." image={images.childrenLake} imageAlt="Children enjoying Lake Malawi" tall />
      <section className="section section--ivory about-manifesto">
        <div className="shell about-manifesto__grid" data-reveal="up"><span className="section-index">01</span><div><Eyebrow>Why we exist</Eyebrow><h2>Not a catalogue.<br /><em>A connection.</em></h2></div><div><p className="lead">Online Tourism Malawi brings collections, landscapes and living traditions into one thoughtful experience.</p><p>We believe digital tourism can invite deeper travel, make cultural knowledge more accessible and help institutions share their work without flattening Malawi into a postcard.</p></div></div>
      </section>
      <section className="values-section">
        <div className="shell"><SectionHeading inverse eyebrow="What guides us" title="Four promises" />
          <div className="values-grid">{[
            ['01', 'Malawian voices first', 'Stories should be shaped with the people and institutions who carry them.'],
            ['02', 'Culture with context', 'We share more than beautiful images: meaning, place and responsibility matter.'],
            ['03', 'Access with dignity', 'Digital access should widen curiosity while respecting sacred and sensitive knowledge.'],
            ['04', 'Travel that gives back', 'Discovery is strongest when it supports communities, custodians and local economies.'],
          ].map(([no, title, copy], index) => <article key={title} data-reveal="card" data-reveal-delay={`${index * 80}ms`}><span>{no}</span><Sparkles size={21} /><h3>{title}</h3><p>{copy}</p></article>)}</div>
        </div>
      </section>
      <section className="section section--paper story-timeline">
        <div className="shell story-timeline__grid" data-reveal="up"><Picture src={images.lake} alt="A view across Lake Malawi" /><div><Eyebrow>Our north star</Eyebrow><h2>A digital home<br /><em>with open doors.</em></h2><p>This first version is a foundation. The long-term vision is a platform where museums, artists, guides, scholars and communities can publish, teach and connect directly with audiences.</p><ul><li><Check size={17} />Museum and archive partnerships</li><li><Check size={17} />Community-led oral histories</li><li><Check size={17} />Accessible virtual exhibitions</li><li><Check size={17} />Responsible trip-planning tools</li></ul></div></div>
      </section>
      <Newsletter />
    </>
  )
}

function PlanVisitPage() {
  const regions = [
    ['Northern Malawi', 'High plateaux, living traditions and long horizons.', images.nyika, 'Nyika · Karonga · Mzuzu'],
    ['Central Malawi', 'The capital, cultural landscapes and the lake’s broad centre.', images.lake, 'Lilongwe · Dedza · Salima'],
    ['Southern Malawi', 'Historic cities, tea country and dramatic mountain massifs.', images.mulanje, 'Blantyre · Zomba · Mulanje'],
  ]
  return (
    <>
      <PageHero eyebrow="Travel with context" title={<>Plan Your<br /><em>Malawi Journey</em></>} copy="Build a thoughtful route through the Warm Heart of Africa—from cultural spaces and creative events to mountains, wildlife and the lake." image={images.lakeSunset} imageAlt="Sunset across Lake Malawi" tall>
        <a href="#regions" className="button button--gold">Explore the regions <ArrowDownRight size={18} /></a>
      </PageHero>
      <section id="regions" className="section section--ivory"><div className="shell"><SectionHeading eyebrow="North · Centre · South" title={<>Three regions.<br /><em>Endless ways in.</em></>} copy="Use these regional starting points, then check current transport, access and safety information before departure." />
        <div className="region-grid">{regions.map(([title, copy, image, places], index) => <article key={title} data-reveal="card" data-reveal-delay={`${index * 75}ms`}><Picture src={image} alt={title} /><span>0{index + 1}</span><div><h2>{title}</h2><p>{copy}</p><small>{places}</small></div></article>)}</div>
      </div></section>
      <section className="visit-essentials"><div className="shell"><SectionHeading inverse eyebrow="Before you travel" title="Practical essentials" />
        <div className="essential-grid">{[
          ['01', 'Confirm current guidance', 'Check official entry, health, weather and transport information close to departure.'],
          ['02', 'Plan realistic distances', 'Malawi is long from north to south. Leave generous time for road journeys and local connections.'],
          ['03', 'Book local knowledge', 'Community guides and cultural hosts bring context while keeping more value in local economies.'],
          ['04', 'Ask before recording', 'Photography and audio are not appropriate everywhere. Follow the guidance of custodians and participants.'],
        ].map(([number, title, copy], index) => <article key={title} data-reveal="card" data-reveal-delay={`${index * 70}ms`}><span>{number}</span><h3>{title}</h3><p>{copy}</p></article>)}</div>
      </div></section>
      <section className="section section--paper visit-cta"><div className="shell visit-cta__grid" data-reveal="up"><div><Eyebrow>Start with a date</Eyebrow><h2>Let culture shape<br /><em>the route.</em></h2></div><div><p>Browse public gatherings, exhibitions and performances, then build the landscape journey around them.</p><div><Link className="button button--gold" to="/events">Browse events <CalendarDays size={17} /></Link><Link className="text-link" to="/contact">Ask the team <ArrowUpRight size={17} /></Link></div></div></div></section>
    </>
  )
}

function ContactPage() {
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    const form = new FormData(event.currentTarget)
    try {
      await sendContactMessage({ name: form.get('name'), email: form.get('email'), subject: form.get('subject'), message: form.get('message') })
      setSent(true)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to send your message.')
    } finally { setBusy(false) }
  }
  return (
    <>
      <PageHero eyebrow="We would love to hear from you" title={<>Contact<br /><em>the Team</em></>} copy="Ask about the platform, suggest a correction, explore a partnership or point us towards a story." image={images.childrenLake} imageAlt="People connecting beside Lake Malawi" />
      <section className="section section--ivory contact-page"><div className="shell contact-page__grid">
        <aside data-reveal="up"><Eyebrow>Online Tourism Malawi</Eyebrow><h2>Let’s begin a<br /><em>conversation.</em></h2><p>Our launch contact details are editorial placeholders until the operating organisation confirms them.</p><div className="contact-details"><a href="mailto:hello@tourismmalawi.mw"><Mail size={18} /><span>Email<strong>hello@tourismmalawi.mw</strong></span></a><div><MapPin size={18} /><span>Office<strong>Lilongwe, Malawi</strong></span></div><div><Clock3 size={18} /><span>Hours<strong>Mon–Fri · 08:00–17:00</strong></span></div></div></aside>
        <div className="form-panel" data-reveal="up">{sent ? <div className="submission-success"><span><Check size={28} /></span><Eyebrow>Message received</Eyebrow><h2>Zikomo.</h2><p>Thank you for reaching out. The team will reply using the address you provided.</p><button className="button button--outline" onClick={() => setSent(false)}>Send another message</button></div> : <form onSubmit={submit}><div className="form-grid"><label>Full name<input name="name" required /></label><label>Email address<input name="email" type="email" required /></label></div><label>Subject<select name="subject" required defaultValue=""><option value="" disabled>Choose a subject</option><option>General enquiry</option><option>Partnership</option><option>Content correction</option><option>Media request</option><option>Technical support</option></select></label><label>Message<textarea name="message" rows="7" required placeholder="Tell us how we can help" /></label>{error && <div className="auth-error" role="alert">{error}</div>}<button className="button button--gold" type="submit" disabled={busy}>{busy ? 'Sending…' : 'Send message'} <Send size={17} /></button></form>}</div>
      </div></section>
    </>
  )
}

function ContributePage() {
  const location = useLocation()
  const { user } = useAuth()
  const initialType = new URLSearchParams(location.search).get('type') || 'story'
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    const form = new FormData(event.currentTarget)
    try {
      await createContribution({
        user_id: user?.id === 'preview-user' ? null : user?.id || null,
        submission_type: form.get('submission_type'),
        name: form.get('name'),
        email: form.get('email'),
        title: form.get('title'),
        description: form.get('description'),
        payload: { location: form.get('location'), website: form.get('website') },
      })
      setSent(true)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to submit your contribution.')
    } finally { setBusy(false) }
  }
  return (
    <>
      <PageHero eyebrow="Build the archive with us" title={<>Contribute<br /><em>a Story</em></>} copy="Share an event, creative profile, correction or story lead with the editorial team." image={images.chongoni} imageAlt="Layered stories at the Chongoni Rock Art Area" />
      <section className="section section--paper contribute-page"><div className="shell contribute-page__grid">
        <aside data-reveal="up"><Eyebrow>What happens next</Eyebrow><h2>Received with care.<br /><em>Reviewed by people.</em></h2><ol><li><span>01</span>We acknowledge the submission.</li><li><span>02</span>An editor checks context and contact details.</li><li><span>03</span>We seek consent and verification before publishing.</li></ol><p>Sensitive cultural knowledge should only be submitted with the permission of the appropriate custodians.</p></aside>
        <div className="form-panel" data-reveal="up">{sent ? <div className="submission-success"><span><Check size={28} /></span><Eyebrow>Contribution received</Eyebrow><h2>Zikomo.</h2><p>Your submission is now in the editorial review queue.</p><button className="button button--outline" onClick={() => setSent(false)}>Submit another</button></div> : <form onSubmit={submit}><label>Contribution type<select name="submission_type" defaultValue={initialType}><option value="story">Story or oral history</option><option value="event">Event</option><option value="creative_profile">Creative directory profile</option><option value="correction">Correction or update</option></select></label><div className="form-grid"><label>Your name<input name="name" required defaultValue={user?.user_metadata?.display_name || ''} /></label><label>Email address<input name="email" type="email" required defaultValue={user?.email || ''} /></label></div><label>Title<input name="title" required placeholder="A short, clear title" /></label><div className="form-grid"><label>Location<input name="location" placeholder="Town, district or region" /></label><label>Website or reference link<input name="website" type="url" placeholder="https://" /></label></div><label>Tell us about it<textarea name="description" rows="7" required placeholder="Include the context, people involved and why this belongs in the collection." /></label>{error && <div className="auth-error" role="alert">{error}</div>}<button className="button button--gold" type="submit" disabled={busy}>{busy ? 'Submitting…' : 'Send for review'} <Send size={17} /></button></form>}</div>
      </div></section>
    </>
  )
}

function AccountPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let active = true
    if (!user) return undefined
    loadSavedItems(user.id).then((saved) => { if (active) setItems(saved) }).catch(() => {}).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [user])
  const remove = async (itemKey) => { await removeSavedItem(user.id, itemKey); setItems((current) => current.filter((item) => item.item_key !== itemKey)) }
  if (!user) return <section className="account-empty"><MotionLayer variant="auth" /><div data-reveal="hero"><UserRound size={36} /><Eyebrow>Your Malawi collection</Eyebrow><h1>Save the stories<br /><em>that call you back.</em></h1><p>Sign in to keep places, events and creative profiles together.</p><Link className="button button--gold" to="/sign-in?next=/account">Sign in <ArrowRight size={18} /></Link></div></section>
  return (
    <>
      <section className="account-hero"><MotionLayer variant="page" /><div className="shell account-hero__inner" data-reveal="hero"><div><Eyebrow>Member space</Eyebrow><h1>Your Malawi<br /><em>collection.</em></h1><p>Welcome, {user.user_metadata?.display_name || user.email?.split('@')[0]}.</p></div><button className="button button--outline" onClick={async () => { await signOut(); navigate('/') }}>Sign out</button></div></section>
      <section className="section section--ivory account-library"><div className="shell"><SectionHeading eyebrow="Saved discoveries" title={items.length ? `${items.length} in your collection` : 'Begin your collection'} copy="Save heritage places, museums, events and creative profiles as you explore." action={!items.length ? { label: 'Browse sectors', to: '/segments' } : undefined} />
        {loading ? <div className="loading-state">Loading your collection…</div> : items.length ? <div className="saved-grid">{items.map((item, index) => <article key={item.item_key} data-reveal="card" data-reveal-delay={`${index * 60}ms`}><Picture src={item.image || images.lake} alt={item.title} /><div><span>{item.item_type.replaceAll('_', ' ')}</span><h2><Link to={item.route}>{item.title}</Link></h2><small>{item.metadata?.location || item.metadata?.segment}</small><button onClick={() => remove(item.item_key)}><X size={16} />Remove</button></div></article>)}</div> : <div className="empty-collection" data-reveal="up"><Bookmark size={30} /><h2>Nothing saved yet</h2><p>Look for “Save to collection” on detail and directory pages.</p><Link className="button button--gold" to="/segments">Start exploring <ArrowRight size={17} /></Link></div>}
      </div></section>
    </>
  )
}

function LegalPage({ type }) {
  const pages = {
    privacy: ['Privacy', 'How information is handled', [['Information you provide', 'We receive information when you create an account, subscribe, contact the team, save an item or submit a contribution.'], ['How it is used', 'Information supports the service you requested, editorial review, platform security and responsible product improvement.'], ['Your choices', 'You may request access, correction or deletion through the contact page. Production retention periods should be confirmed with the operating organisation.']]],
    terms: ['Terms of Use', 'A respectful shared space', [['Editorial information', 'Travel details and dates may change. Confirm important information with the relevant institution, organiser or official authority.'], ['Cultural responsibility', 'Do not reproduce sensitive knowledge or imagery outside the context and permissions described by custodians.'], ['Submissions', 'You must have the right and permission to share material you submit. Acceptance does not guarantee publication.']]],
    accessibility: ['Accessibility', 'A doorway designed for everyone', [['Our approach', 'The interface uses semantic structure, keyboard-friendly controls, visible focus, responsive layouts and reduced-motion support.'], ['Known limitations', 'External media, evolving partner content and some long-form material may require further descriptions or transcripts.'], ['Help us improve', 'Tell us about an access barrier through the contact page and include the page, device and assistance you need.']]],
  }
  const [title, heading, sections] = pages[type]
  return <><section className="legal-hero"><MotionLayer variant="page" /><div className="shell" data-reveal="hero"><Eyebrow>Online Tourism Malawi</Eyebrow><h1>{title}</h1><p>Launch edition · Updated 9 August 2026</p></div></section><section className="section section--paper legal-page"><div className="shell legal-page__grid"><aside><BookOpen size={28} /><h2>{heading}</h2><Link className="text-link" to="/contact">Ask a question <ArrowUpRight size={17} /></Link></aside><article>{sections.map(([sectionTitle, copy], index) => <section key={sectionTitle} data-reveal="up"><span>0{index + 1}</span><h2>{sectionTitle}</h2><p>{copy}</p></section>)}</article></div></section></>
}

function MediaPage() {
  const { podcasts } = useContent()
  const [playing, setPlaying] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const selected = podcasts[playing]
  const selectEpisode = (index) => { setPlaying(index); setIsPlaying(true) }
  const segment = creativeSegments[4]
  return (
    <>
      <PageHero eyebrow="Media Library & Podcasts" title={<>Audio Visual &<br /><em>Interactive Media</em></>} copy={segment.copy} image={images.ilala} imageAlt="Historic view of the Ilala on Lake Malawi">
        <div className="media-counts" data-reveal="up"><span><strong>42</strong> films</span><span><strong>68</strong> audio stories</span><span><strong>12</strong> broadcasts</span><span><strong>08</strong> interactive works</span></div>
      </PageHero>
      <SegmentPillars segment={segment} />
      <section className="podcast-stage">
        <div className="shell">
          <SectionHeading inverse eyebrow="Original podcast" title={<>Voices of the<br /><em>Warm Heart</em></>} copy="Intimate conversations about place, practice and memory." />
          <div className="podcast-player" data-reveal="up">
            <Picture src={selected.image} alt={selected.title} />
            <div className="podcast-player__copy"><span>Episode {selected.number} · {selected.category}</span><h3>{selected.title}</h3><p>{selected.guest}</p><div className={`wave ${isPlaying ? 'wave--playing' : ''}`} aria-hidden="true">{Array.from({ length: 42 }, (_, i) => <i key={i} style={{ height: `${12 + ((i * 19) % 42)}px`, '--bar-index': i }} />)}</div><div className="player-controls"><button onClick={() => setIsPlaying((value) => !value)} aria-label={isPlaying ? 'Pause episode' : 'Play episode'}>{isPlaying ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}</button><span>08:14</span><div className={`progress ${isPlaying ? 'progress--playing' : ''}`}><i /></div><span>{selected.length}</span><Volume2 size={18} /></div></div>
          </div>
          <div className="episode-list">{podcasts.map((episode, index) => <button className={playing === index ? 'active' : ''} onClick={() => selectEpisode(index)} key={episode.title} data-reveal="up" data-reveal-delay={`${index * 65}ms`}><span>{episode.number}</span><Picture src={episode.image} alt="" /><div><strong>{episode.title}</strong><small>{episode.guest}</small></div><span>{episode.length}</span><i>{playing === index && isPlaying ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}</i></button>)}</div>
        </div>
      </section>
      <section className="section section--ivory">
        <div className="shell"><SectionHeading eyebrow="From the library" title="Watch & discover" action={{ label: 'Browse all media', to: '/media-library' }} />
          <div className="video-grid">{[
            ['The Great Dance', 'A short introduction to Gule Wamkulu', images.guleArchive, '12:08'],
            ['Mountain of Islands', 'Life, forest and water around Mulanje', images.mulanje, '18:42'],
            ['Across the Living Lake', 'Journeys and livelihoods on Lake Malawi', images.fishing, '09:35'],
          ].map(([title, copy, image, time], index) => <article key={title} data-reveal="card" data-tilt data-reveal-delay={`${index * 85}ms`} onPointerMove={handleTiltPointerMove} onPointerLeave={resetTiltPointer}><Picture src={image} alt={title} /><button aria-label={`Play ${title}`}><Play fill="currentColor" /></button><span>{time}</span><div><small>Documentary short</small><h3>{title}</h3><p>{copy}</p></div></article>)}</div>
        </div>
      </section>
      <section className="archive-banner"><div className="shell archive-banner__inner" data-reveal="up"><Mic2 size={34} /><div><Eyebrow>Contribute a memory</Eyebrow><h2>Your story belongs<br /><em>in the archive.</em></h2></div><div><p>We’re building a community audio collection. Tell us about a place, celebration, object or journey you want future generations to hear.</p><Link to="/contribute?type=story" className="button button--outline">Share your story <ArrowRight size={18} /></Link></div></div></section>
    </>
  )
}

function SignInPage() {
  const location = useLocation()
  const requestedNext = new URLSearchParams(location.search).get('next')
  const nextRoute = requestedNext?.startsWith('/') && !requestedNext.startsWith('//') ? requestedNext : '/account'
  const [authMode, setAuthMode] = useState(location.pathname === '/register' ? 'register' : 'signin')
  const [showPassword, setShowPassword] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [magicSent, setMagicSent] = useState(false)
  const { user, configured, signIn, signUp, sendMagicLink } = useAuth()

  const handleSignIn = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (authMode === 'register') await signUp(email, password, displayName)
      else await signIn(email, password)
      setSubmitted(true)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : authMode === 'register' ? 'Unable to create your account' : 'Unable to sign in')
    } finally { setBusy(false) }
  }

  const handleMagicLink = async () => {
    if (!email) { setError('Enter your email address first.'); return }
    setBusy(true)
    setError('')
    try {
      await sendMagicLink(email)
      setMagicSent(true)
      if (!configured) setSubmitted(true)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to send a magic link')
    } finally { setBusy(false) }
  }

  return (
    <section className="auth-page">
      <Picture src={images.lakeSunset} alt="Lake Malawi at sunset" className="auth-page__image" />
      <div className="auth-page__veil" />
      <MotionLayer variant="auth" />
      <div className="auth-page__brand"><MalawiMark /><Link to="/"><ArrowLeft size={17} />Back to Malawi</Link></div>
      <div className="auth-card" data-reveal="hero">
        {submitted || user ? <div className="auth-success"><span><Check size={27} /></span><Eyebrow>{authMode === 'register' ? 'Account created' : 'Welcome back'}</Eyebrow><h1>Your journey<br /><em>continues.</em></h1><p>{configured ? authMode === 'register' ? `Your account is ready. Check ${email} if email confirmation is enabled.` : `Signed in securely as ${user?.email || email}.` : 'Preview session active. Add the Supabase environment keys to enable secure production authentication.'}</p><Link to={nextRoute} className="button button--gold">{nextRoute.startsWith('/admin') ? 'Continue to the studio' : 'Continue to your collection'} <ArrowRight size={18} /></Link></div> : <>
          <Eyebrow>Member access</Eyebrow><h1>{authMode === 'register' ? <>Join the<br /><em>journey.</em></> : <>Welcome<br /><em>back.</em></>}</h1><p>{authMode === 'register' ? 'Create an account to save discoveries and contribute to the collection.' : 'Sign in to save stories, build collections and continue listening.'}</p>
          <span className={`auth-mode ${configured ? 'auth-mode--live' : ''}`}>{configured ? 'Secure authentication connected' : 'Preview mode · backend keys pending'}</span>
          <form onSubmit={handleSignIn}>
            {authMode === 'register' && <label>Display name<input type="text" required value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="How should we welcome you?" /></label>}
            <label>Email address<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>
            <label>Password<span className="password-field"><input type={showPassword ? 'text' : 'password'} required minLength="6" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span></label>
            <div className="auth-options"><label><input type="checkbox" /> Remember me</label><Link to="/forgot-password">Forgot password?</Link></div>
            {error && <div className="auth-error" role="alert">{error}</div>}
            <button className="button button--gold button--full" type="submit" disabled={busy}>{busy ? 'Please wait…' : authMode === 'register' ? 'Create account' : 'Sign in'} <ArrowRight size={18} /></button>
          </form>
          {authMode === 'signin' && <><div className="auth-divider"><span>or</span></div><button className="button button--quiet button--full" disabled={busy} onClick={handleMagicLink}><Mail size={18} />{magicSent ? 'Magic link sent' : 'Continue with a magic link'}</button></>}
          <small className="auth-create">{authMode === 'register' ? 'Already a member?' : 'New here?'} <button type="button" onClick={() => { setAuthMode((mode) => mode === 'register' ? 'signin' : 'register'); setError('') }}>{authMode === 'register' ? 'Sign in' : 'Create an account'}</button></small>
        </>}
      </div>
      <span className="auth-page__caption">Lake Malawi · The Lake of Stars</span>
    </section>
  )
}

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const { configured, requestPasswordReset } = useAuth()

  const handleResetRequest = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await requestPasswordReset(email)
      setSent(true)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to send the recovery email')
    } finally { setBusy(false) }
  }

  return (
    <section className="auth-page">
      <Picture src={images.lakeSunset} alt="Lake Malawi at sunset" className="auth-page__image" />
      <div className="auth-page__veil" />
      <MotionLayer variant="auth" />
      <div className="auth-page__brand"><MalawiMark /><Link to="/sign-in"><ArrowLeft size={17} />Back to sign in</Link></div>
      <div className="auth-card" data-reveal="hero">
        {sent ? <div className="auth-success"><span><Mail size={27} /></span><Eyebrow>Recovery email sent</Eyebrow><h1>Check your<br /><em>inbox.</em></h1><p>If an account exists for {email}, Supabase has sent a secure link. Open it on this device to choose a new password.</p><Link to="/sign-in" className="button button--gold">Return to sign in <ArrowRight size={18} /></Link></div> : <>
          <Eyebrow>Secure account recovery</Eyebrow><h1>Find your<br /><em>way back.</em></h1><p>Enter the email address connected to your account. We will send a time-limited recovery link.</p>
          <span className={`auth-mode ${configured ? 'auth-mode--live' : ''}`}>{configured ? 'Secure recovery connected' : 'Preview mode · backend keys pending'}</span>
          <form onSubmit={handleResetRequest}>
            <label>Email address<input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>
            {error && <div className="auth-error" role="alert">{error}</div>}
            <button className="button button--gold button--full" type="submit" disabled={busy}>{busy ? 'Sending secure link…' : 'Send recovery link'} <ArrowRight size={18} /></button>
          </form>
          <small className="auth-create">Remembered your password? <Link to="/sign-in">Sign in</Link></small>
        </>}
      </div>
      <span className="auth-page__caption">Lake Malawi · The Lake of Stars</span>
    </section>
  )
}

function ResetPasswordPage() {
  const location = useLocation()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [complete, setComplete] = useState(false)
  const [error, setError] = useState('')
  const { configured, loading, isPasswordRecovery, updatePassword } = useAuth()
  const redirectError = new URLSearchParams(location.hash.replace(/^#/, '')).get('error_description')

  const handlePasswordUpdate = async (event) => {
    event.preventDefault()
    setError('')
    if (password.length < 8) { setError('Use at least 8 characters for your new password.'); return }
    if (password !== confirmation) { setError('The passwords do not match.'); return }
    setBusy(true)
    try {
      await updatePassword(password)
      setComplete(true)
      setPassword('')
      setConfirmation('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to update your password')
    } finally { setBusy(false) }
  }

  const invalidRecovery = redirectError || (!loading && configured && !isPasswordRecovery)

  return (
    <section className="auth-page">
      <Picture src={images.lakeSunset} alt="Lake Malawi at sunset" className="auth-page__image" />
      <div className="auth-page__veil" />
      <MotionLayer variant="auth" />
      <div className="auth-page__brand"><MalawiMark /><Link to="/"><ArrowLeft size={17} />Back to Malawi</Link></div>
      <div className="auth-card" data-reveal="hero">
        {complete ? <div className="auth-success"><span><Check size={27} /></span><Eyebrow>Password updated</Eyebrow><h1>You are<br /><em>secure.</em></h1><p>Your new password is active. You can now sign in and continue to the editorial studio.</p><Link to="/sign-in?next=/admin" className="button button--gold">Sign in to the studio <ArrowRight size={18} /></Link></div> : invalidRecovery ? <div className="auth-success"><span><X size={27} /></span><Eyebrow>Recovery link unavailable</Eyebrow><h1>Request a<br /><em>fresh link.</em></h1><p>{redirectError ? decodeURIComponent(redirectError.replace(/\+/g, ' ')) : 'This recovery link has expired, has already been used, or was opened without a valid recovery session.'}</p><Link to="/forgot-password" className="button button--gold">Send a new recovery link <ArrowRight size={18} /></Link></div> : <>
          <Eyebrow>Choose a new password</Eyebrow><h1>Secure your<br /><em>account.</em></h1><p>Create a password with at least eight characters. Use something memorable that you do not reuse elsewhere.</p>
          <span className={`auth-mode ${configured ? 'auth-mode--live' : ''}`}>{loading ? 'Validating secure link…' : configured ? 'Recovery session verified' : 'Preview mode · backend keys pending'}</span>
          <form onSubmit={handlePasswordUpdate}>
            <label>New password<span className="password-field"><input type={showPassword ? 'text' : 'password'} required minLength="8" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide passwords' : 'Show passwords'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span></label>
            <label>Confirm new password<input type={showPassword ? 'text' : 'password'} required minLength="8" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Repeat your new password" /></label>
            {error && <div className="auth-error" role="alert">{error}</div>}
            <button className="button button--gold button--full" type="submit" disabled={busy || loading}>{busy ? 'Updating password…' : 'Set new password'} <ArrowRight size={18} /></button>
          </form>
        </>}
      </div>
      <span className="auth-page__caption">Lake Malawi · The Lake of Stars</span>
    </section>
  )
}

function NotFoundPage() {
  return <section className="not-found"><div data-reveal="hero"><span>404</span><Eyebrow>Off the map</Eyebrow><h1>This trail ends here.</h1><p>The page you’re looking for may have moved, but there is plenty more Malawi to discover.</p><Link className="button button--gold" to="/">Return home <ArrowRight size={18} /></Link></div></section>
}

function App() {
  const location = useLocation()
  if (location.pathname.startsWith('/admin')) return <Suspense fallback={<div className="loading-state">Preparing the editorial studio…</div>}><AdminApp /></Suspense>
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/segments" element={<SegmentsPage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/heritage/:slug" element={<ContentDetailPage kind="heritage" />} />
        <Route path="/cultural-natural-heritage" element={<Navigate to="/explore" replace />} />
        <Route path="/arts-natural-heritage" element={<Navigate to="/explore" replace />} />
        <Route path="/museums" element={<MuseumsPage />} />
        <Route path="/museums/:slug" element={<ContentDetailPage kind="museum" />} />
        <Route path="/museums-collections" element={<Navigate to="/museums" replace />} />
        <Route path="/performance" element={<PerformancePage />} />
        <Route path="/performance-celebration" element={<Navigate to="/performance" replace />} />
        <Route path="/visual-arts-crafts" element={<SegmentDetailPage segment={creativeSegments[2]} />} />
        <Route path="/books-press" element={<SegmentDetailPage segment={creativeSegments[3]} />} />
        <Route path="/design-creative" element={<SegmentDetailPage segment={creativeSegments[5]} />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/:slug" element={<ContentDetailPage kind="event" />} />
        <Route path="/directory" element={<DirectoryPage />} />
        <Route path="/directory/:slug" element={<CreatorDetailPage />} />
        <Route path="/plan-your-visit" element={<PlanVisitPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/contribute" element={<ContributePage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/about-us" element={<AboutPage />} />
        <Route path="/about" element={<Navigate to="/about-us" replace />} />
        <Route path="/media-library" element={<MediaPage />} />
        <Route path="/audio-visual-interactive-media" element={<Navigate to="/media-library" replace />} />
        <Route path="/media" element={<Navigate to="/media-library" replace />} />
        <Route path="/podcasts" element={<Navigate to="/media-library" replace />} />
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/register" element={<SignInPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/login" element={<Navigate to="/sign-in" replace />} />
        <Route path="/privacy" element={<LegalPage type="privacy" />} />
        <Route path="/terms" element={<LegalPage type="terms" />} />
        <Route path="/accessibility" element={<LegalPage type="accessibility" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  )
}

export default App
