import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Camera,
  Check,
  Clock3,
  Eye,
  EyeOff,
  Headphones,
  Mail,
  MapPin,
  Menu,
  Mic2,
  MoveRight,
  Pause,
  Play,
  Search,
  Sparkles,
  UsersRound,
  Video,
  Volume2,
  X,
} from 'lucide-react'
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { useContent } from './context/ContentContext'
import { images } from './data/content'

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
  const { user, signOut } = useAuth()
  const closeOverlays = () => { setMenuOpen(false); setSearchOpen(false) }

  const submitSearch = (event) => {
    event.preventDefault()
    const query = new FormData(event.currentTarget).get('search')?.trim()
    closeOverlays()
    navigate(query ? `/explore?q=${encodeURIComponent(query)}` : '/explore')
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
            {user ? (
              <button className="account-pill sign-in-link" onClick={signOut} title="Sign out">
                <span>{user.email?.slice(0, 1).toUpperCase()}</span>{user.email?.split('@')[0]}
              </button>
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
          <div><strong>Discover</strong><Link to="/explore">Arts & heritage</Link><Link to="/museums">Museums</Link><Link to="/performance">Living traditions</Link></div>
          <div><strong>Visit online</strong><Link to="/events">Events</Link><Link to="/media-library">Podcasts</Link><Link to="/about-us">Our story</Link></div>
          <div><strong>Keep in touch</strong><a href="mailto:hello@tourismmalawi.mw">hello@tourismmalawi.mw</a><span>Lilongwe, Malawi</span><span>Mon–Fri · 08:00–17:00</span></div>
        </div>
      </div>
      <div className="shell shell--wide site-footer__bottom">
        <span>© 2026 Online Tourism Malawi</span>
        <span>Built to honour, preserve and share.</span>
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

function HomePage() {
  const { events } = useContent()
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const submit = (event) => { event.preventDefault(); navigate(query.trim() ? `/explore?q=${encodeURIComponent(query.trim())}` : '/explore') }
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
          <SectionHeading eyebrow="Choose your path" title={<>A country of <em>many worlds</em></>} copy="Move through Malawi by landscape, memory or the rhythm of a living tradition." />
          <div className="path-grid">
            {[
              { no: '01', title: 'Arts & Natural Heritage', copy: 'Rock art, mountains, wildlife and the lake that holds a nation’s imagination.', image: images.mulanje, to: '/explore' },
              { no: '02', title: 'Museums & Collections', copy: 'Meet the objects and institutions safeguarding Malawi’s many histories.', image: images.karonga, to: '/museums' },
              { no: '03', title: 'Performance & Celebration', copy: 'Enter a world of masks, drums, ceremony, dance and collective joy.', image: images.gulePortrait, to: '/performance' },
            ].map((item, index) => (
              <Link className="path-card" to={item.to} key={item.title} data-reveal="card" data-tilt data-reveal-delay={`${index * 90}ms`} onPointerMove={handleTiltPointerMove} onPointerLeave={resetTiltPointer}>
                <Picture src={item.image} alt={item.title} />
                <span className="path-card__no">{item.no}</span>
                <div className="path-card__content"><h3>{item.title}</h3><p>{item.copy}</p><span className="path-card__arrow"><ArrowUpRight size={19} /></span></div>
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
  return (
    <section className="newsletter">
      <div className="shell newsletter__inner">
        <div><Eyebrow>Letters from Malawi</Eyebrow><h2>Stay close to<br /><em>the story.</em></h2></div>
        {sent ? <div className="form-success"><Check size={21} /> Zikomo! Your next letter is on its way.</div> : (
          <form onSubmit={(e) => { e.preventDefault(); setSent(true) }}>
            <label htmlFor="newsletter-email">Your email address</label>
            <div><input id="newsletter-email" type="email" required placeholder="you@example.com" /><button type="submit">Join us <MoveRight size={18} /></button></div>
            <small>Monthly stories, cultural notes and event highlights. No clutter.</small>
          </form>
        )}
      </div>
    </section>
  )
}

function ExplorePage() {
  const { heritageItems } = useContent()
  const location = useLocation()
  const initialQuery = new URLSearchParams(location.search).get('q') || ''
  const [filter, setFilter] = useState('All')
  const [query, setQuery] = useState(initialQuery)
  const filters = ['All', 'Heritage sites', 'Landscapes', 'Natural wonders', 'National parks']
  const filtered = useMemo(() => heritageItems.filter((item) => {
    const typeMatch = filter === 'All' || item.type === filter
    const queryMatch = `${item.title} ${item.location} ${item.type}`.toLowerCase().includes(query.toLowerCase())
    return typeMatch && queryMatch
  }), [filter, query, heritageItems])
  return (
    <>
      <PageHero eyebrow="Explore Malawi" title={<>Arts & Natural<br /><em>Heritage</em></>} copy="Follow the stories written into Malawi’s rock, water, forests and highlands." image={images.mulanje} imageAlt="Mount Mulanje rising over the landscape" tall />
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
  return (
    <article className={`heritage-card ${index === 0 ? 'heritage-card--large' : ''}`} data-reveal="card" data-tilt data-reveal-delay={`${index * 70}ms`} onPointerMove={handleTiltPointerMove} onPointerLeave={resetTiltPointer}>
      <Picture src={item.image} alt={item.title} />
      <div className="heritage-card__shade" />
      <div className="heritage-card__top"><span>{item.tag}</span><span>0{index + 1}</span></div>
      <div className="heritage-card__body"><small><MapPin size={14} />{item.location}</small><h3>{item.title}</h3><button aria-label={`Explore ${item.title}`}><ArrowUpRight size={20} /></button></div>
    </article>
  )
}

function EmptyState() {
  return <div className="empty-state" data-reveal="up"><Search size={26} /><h3>No stories found</h3><p>Try a broader word or choose another category.</p></div>
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
              <button className="round-arrow" aria-label={`View ${museum.title}`}><ArrowUpRight /></button>
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
  return (
    <>
      <PageHero eyebrow="Living heritage" title={<>Performance &<br /><em>Celebration</em></>} copy="Feel Malawi through movement, rhythm, ceremony and the shared energy of a gathered community." image={images.gule} imageAlt="Gule Wamkulu dancers performing in Malawi" tall>
        <Link className="button button--gold" to="/media-library">Listen to the stories <Headphones size={18} /></Link>
      </PageHero>
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
      <section className="event-cta"><div className="shell event-cta__inner" data-reveal="up"><div><Eyebrow>Hosting something?</Eyebrow><h2>Put your event<br /><em>on the map.</em></h2></div><div><p>Community organisations, museums and cultural groups can share eligible public events with our editorial team.</p><a href="mailto:events@tourismmalawi.mw" className="button button--gold">Submit an event <ArrowRight size={18} /></a></div></div></section>
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

function MediaPage() {
  const { podcasts } = useContent()
  const [playing, setPlaying] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const selected = podcasts[playing]
  const selectEpisode = (index) => { setPlaying(index); setIsPlaying(true) }
  return (
    <>
      <PageHero eyebrow="Watch · Listen · Remember" title={<>Media Library<br />& <em>Podcasts</em></>} copy="Let Malawi come closer through documentary shorts, field recordings, conversations and voices from the archive." image={images.ilala} imageAlt="Historic view of the Ilala on Lake Malawi">
        <div className="media-counts" data-reveal="up"><span><strong>42</strong> films</span><span><strong>68</strong> audio stories</span><span><strong>12</strong> collections</span></div>
      </PageHero>
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
      <section className="archive-banner"><div className="shell archive-banner__inner" data-reveal="up"><Mic2 size={34} /><div><Eyebrow>Contribute a memory</Eyebrow><h2>Your story belongs<br /><em>in the archive.</em></h2></div><div><p>We’re building a community audio collection. Tell us about a place, celebration, object or journey you want future generations to hear.</p><a href="mailto:stories@tourismmalawi.mw" className="button button--outline">Share your story <ArrowRight size={18} /></a></div></div></section>
    </>
  )
}

function SignInPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [magicSent, setMagicSent] = useState(false)
  const { user, configured, signIn, sendMagicLink } = useAuth()

  const handleSignIn = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await signIn(email, password)
      setSubmitted(true)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to sign in')
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
        {submitted || user ? <div className="auth-success"><span><Check size={27} /></span><Eyebrow>Welcome back</Eyebrow><h1>Your journey<br /><em>continues.</em></h1><p>{configured ? `Signed in securely as ${user?.email || email}.` : 'Preview session active. Add the Supabase environment keys to enable secure production authentication.'}</p><Link to="/explore" className="button button--gold">Continue exploring <ArrowRight size={18} /></Link></div> : <>
          <Eyebrow>Member access</Eyebrow><h1>Welcome<br /><em>back.</em></h1><p>Sign in to save stories, build collections and continue listening.</p>
          <span className={`auth-mode ${configured ? 'auth-mode--live' : ''}`}>{configured ? 'Secure authentication connected' : 'Preview mode · backend keys pending'}</span>
          <form onSubmit={handleSignIn}>
            <label>Email address<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>
            <label>Password<span className="password-field"><input type={showPassword ? 'text' : 'password'} required minLength="6" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span></label>
            <div className="auth-options"><label><input type="checkbox" /> Remember me</label><a href="mailto:support@tourismmalawi.mw">Forgot password?</a></div>
            {error && <div className="auth-error" role="alert">{error}</div>}
            <button className="button button--gold button--full" type="submit" disabled={busy}>{busy ? 'Please wait…' : 'Sign in'} <ArrowRight size={18} /></button>
          </form>
          <div className="auth-divider"><span>or</span></div>
          <button className="button button--quiet button--full" disabled={busy} onClick={handleMagicLink}><Mail size={18} />{magicSent ? 'Magic link sent' : 'Continue with a magic link'}</button>
          <small className="auth-create">New here? <Link to="/about-us">Learn about membership</Link></small>
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
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/arts-natural-heritage" element={<Navigate to="/explore" replace />} />
        <Route path="/museums" element={<MuseumsPage />} />
        <Route path="/museums-collections" element={<Navigate to="/museums" replace />} />
        <Route path="/performance" element={<PerformancePage />} />
        <Route path="/performance-celebration" element={<Navigate to="/performance" replace />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/about-us" element={<AboutPage />} />
        <Route path="/about" element={<Navigate to="/about-us" replace />} />
        <Route path="/media-library" element={<MediaPage />} />
        <Route path="/media" element={<Navigate to="/media-library" replace />} />
        <Route path="/podcasts" element={<Navigate to="/media-library" replace />} />
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/login" element={<Navigate to="/sign-in" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  )
}

export default App
