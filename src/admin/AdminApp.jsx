import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  Archive,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  Clock3,
  ChevronRight,
  CircleUserRound,
  Database,
  ExternalLink,
  FileText,
  FolderKanban,
  Image,
  Images,
  Inbox,
  Landmark,
  LayoutDashboard,
  LockKeyhole,
  Mail,
  Menu,
  MessageSquareText,
  MoreHorizontal,
  Music2,
  Palette,
  Pencil,
  Plus,
  Podcast,
  RefreshCw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  UserCog,
  UsersRound,
  Video,
  X,
} from 'lucide-react'
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { images } from '../data/content'
import {
  deleteAdminRecord,
  buildSubscriberCsv,
  loadAdminDashboard,
  loadAdminResource,
  loadAuditLog,
  loadContentVersions,
  loadMembers,
  markSubmissionConverted,
  restoreContentVersion,
  saveAdminRecord,
  setMemberRole,
  submissionToDraft,
  updateWorkflowState,
} from '../services/adminService'
import { adminResources, adminRoles, publicationStates, resourceEntries, workflowEntries, workflowResources } from './adminConfig'
import MediaAssetField from './MediaAssetField'
import './admin.css'

const AdminMediaLibrary = lazy(() => import('./AdminMediaLibrary'))

const iconMap = {
  calendar: CalendarDays,
  inbox: Inbox,
  landmark: Landmark,
  mail: Mail,
  museum: Landmark,
  music: Music2,
  palette: Palette,
  podcast: Podcast,
  send: Send,
  video: Video,
}

const slugify = (value = '') => value
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '')

const formatDate = (value, withTime = false) => {
  if (!value) return 'Not set'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-MW', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date)
}

const titleCase = (value = '') => value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())

function AdminBrand() {
  return (
    <Link className="admin-brand" to="/admin" aria-label="Online Tourism Malawi administration home">
      <span><img src={images.map} alt="" /></span>
      <span><small>Online Tourism Malawi</small><strong>Editorial Studio</strong></span>
    </Link>
  )
}

function AdminLoading({ label = 'Preparing the studio' }) {
  return <div className="admin-loading"><span><i /><i /><i /></span><strong>{label}</strong><small>Secure workspace loading</small></div>
}

function AdminNotice({ icon: Icon = Sparkles, title, copy, action }) {
  return <div className="admin-notice"><span><Icon size={21} /></span><div><strong>{title}</strong><p>{copy}</p></div>{action}</div>
}

function AdminSignIn() {
  return (
    <main className="admin-gate">
      <img src={images.lakeSunset} alt="Lake Malawi at sunset" />
      <div className="admin-gate__veil" />
      <div className="admin-gate__brand"><AdminBrand /></div>
      <section>
        <span className="admin-kicker"><LockKeyhole size={15} /> Protected workspace</span>
        <h1>Shape the story<br /><em>with care.</em></h1>
        <p>Sign in with an approved administrator or editor account to manage Malawi's public cultural gateway.</p>
        <Link className="admin-primary-action" to="/sign-in?next=/admin">Sign in to the studio <ArrowRight size={18} /></Link>
        <Link className="admin-text-link" to="/"><ArrowLeft size={16} /> Return to the public site</Link>
      </section>
      <small className="admin-gate__caption">Role-based access · Supabase RLS · Full audit trail</small>
    </main>
  )
}

function AdminAccessDenied() {
  const { profile, user, signOut } = useAuth()
  const navigate = useNavigate()
  return (
    <main className="admin-denied">
      <div><span><ShieldCheck size={30} /></span><small>Access protected</small><h1>This workspace is<br /><em>for the editorial team.</em></h1><p>You are signed in as {user?.email}, but your current role is <strong>{profile?.role || 'member'}</strong>. Ask an existing administrator to approve editorial access.</p><div><Link className="admin-primary-action" to="/">View the public site</Link><button onClick={async () => { await signOut(); navigate('/sign-in?next=/admin') }}>Use another account</button></div></div>
    </main>
  )
}

function AdminGuard() {
  const { user, loading, profileLoading, canManageContent } = useAuth()
  if (loading || profileLoading) return <AdminLoading label="Checking editorial access" />
  if (!user) return <AdminSignIn />
  if (!canManageContent) return <AdminAccessDenied />
  return <AdminShell />
}

function AdminOnlyRoute({ children }) {
  const { isAdmin } = useAuth()
  return isAdmin ? children : <Navigate to="/admin" replace />
}

function AdminShell() {
  const { user, profile, configured, isAdmin, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const navigationGroups = [
    {
      label: 'Workspace',
      links: [
        { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
        { to: '/admin/media-assets', label: 'Media assets', icon: Images },
      ],
    },
    {
      label: 'Collections',
      links: resourceEntries.map(([key, definition]) => ({
        to: `/admin/content/${key}`,
        label: definition.shortLabel,
        icon: iconMap[definition.icon] || FolderKanban,
      })),
    },
    ...(isAdmin ? [{
      label: 'Operations',
      links: [
        ...workflowEntries.map(([key, definition]) => ({
          to: `/admin/inbox/${key}`,
          label: key === 'contact' ? 'Contact inbox' : key === 'submissions' ? 'Submissions' : 'Subscribers',
          icon: iconMap[definition.icon] || Inbox,
        })),
        { to: '/admin/members', label: 'Members & roles', icon: UsersRound },
        { to: '/admin/activity', label: 'Activity log', icon: Activity },
        { to: '/admin/settings', label: 'Studio settings', icon: Settings },
      ],
    }] : []),
  ]

  const currentLabel = navigationGroups.flatMap((group) => group.links).find((link) => (
    link.end ? location.pathname === link.to : location.pathname.startsWith(link.to)
  ))?.label || 'Editorial Studio'

  return (
    <div className="admin-app">
      <button className="admin-mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Open administration navigation"><Menu /></button>
      <aside className={`admin-sidebar ${menuOpen ? 'admin-sidebar--open' : ''}`}>
        <div className="admin-sidebar__head"><AdminBrand /><button onClick={() => setMenuOpen(false)} aria-label="Close navigation"><X /></button></div>
        <nav aria-label="Administration navigation">
          {navigationGroups.map((group) => <div className="admin-nav-group" key={group.label}><small>{group.label}</small>{group.links.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} onClick={() => setMenuOpen(false)}><Icon size={18} /><span>{label}</span><ChevronRight size={14} /></NavLink>)}</div>)}
        </nav>
        <div className="admin-sidebar__foot">
          <div className="admin-profile-chip"><span>{(profile?.display_name || user.email || 'A').slice(0, 1).toUpperCase()}</span><div><strong>{profile?.display_name || user.email?.split('@')[0]}</strong><small>{titleCase(profile?.role || 'editor')}</small></div><button aria-label="Sign out" onClick={async () => { await signOut(); navigate('/') }}><MoreHorizontal size={18} /></button></div>
          <div className={`admin-connection ${configured ? 'admin-connection--live' : ''}`}><i />{configured ? 'Live Supabase workspace' : 'Local preview workspace'}</div>
        </div>
      </aside>
      {menuOpen && <button className="admin-sidebar-scrim" onClick={() => setMenuOpen(false)} aria-label="Close navigation" />}
      <div className="admin-workspace">
        <header className="admin-topbar">
          <div><small>Online Tourism Malawi</small><strong>{currentLabel}</strong></div>
          <div className="admin-topbar__actions">
            <Link to="/search" className="admin-command"><Search size={16} /><span>Search the public archive</span><kbd>⌘ K</kbd></Link>
            <button className="admin-icon-button" aria-label="Notifications"><Bell size={18} /><i /></button>
            <Link to="/" className="admin-view-site">View website <ExternalLink size={15} /></Link>
          </div>
        </header>
        <main className="admin-main">
          <Routes>
            <Route path="/admin" element={<AdminOverview />} />
            <Route path="/admin/media-assets" element={<Suspense fallback={<AdminLoading label="Opening media storage" />}><AdminMediaLibrary /></Suspense>} />
            <Route path="/admin/content/:resource" element={<AdminResourcePage />} />
            <Route path="/admin/inbox/:workflow" element={<AdminOnlyRoute><AdminWorkflowPage /></AdminOnlyRoute>} />
            <Route path="/admin/members" element={<AdminOnlyRoute><AdminMembersPage /></AdminOnlyRoute>} />
            <Route path="/admin/activity" element={<AdminOnlyRoute><AdminActivityPage /></AdminOnlyRoute>} />
            <Route path="/admin/settings" element={<AdminOnlyRoute><AdminSettingsPage /></AdminOnlyRoute>} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

function AdminPageHeader({ eyebrow, title, copy, actions }) {
  return <header className="admin-page-header"><div><small>{eyebrow}</small><h1>{title}</h1><p>{copy}</p></div>{actions && <div>{actions}</div>}</header>
}

function AdminOverview() {
  const { configured } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = () => {
    setLoading(true)
    setError('')
    loadAdminDashboard().then(setData).catch((reason) => setError(reason.message || 'Unable to load dashboard')).finally(() => setLoading(false))
  }
  useEffect(() => {
    let active = true
    loadAdminDashboard()
      .then((result) => { if (active) setData(result) })
      .catch((reason) => { if (active) setError(reason.message || 'Unable to load dashboard') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])
  if (loading) return <AdminLoading label="Gathering today's picture" />
  if (error) return <AdminError error={error} retry={load} />

  const contentTotal = ['heritage', 'museums', 'performances', 'events', 'podcasts', 'creatives', 'media'].reduce((total, key) => total + (data.counts[key] || 0), 0)
  const stats = [
    { label: 'Editorial records', value: contentTotal, change: 'Across all public collections', icon: BookOpen, tone: 'gold' },
    { label: 'Editorial queue', value: data.counts.submissions, change: 'Awaiting review', icon: FolderKanban, tone: 'green' },
    { label: 'Active audience', value: data.counts.subscribers, change: 'Newsletter subscribers', icon: Send, tone: 'blue' },
    { label: 'Member community', value: data.counts.members, change: `${data.counts.inbox} new messages`, icon: UsersRound, tone: 'rose' },
  ]

  return (
    <div className="admin-dashboard">
      <AdminPageHeader eyebrow="Studio overview" title="Good work starts with a clear view." copy="Monitor the public collection, editorial queue and community activity from one place." actions={<><button className="admin-secondary-action" onClick={load}><RefreshCw size={16} /> Refresh</button><Link className="admin-primary-action" to="/admin/content/events"><Plus size={17} /> Add an event</Link></>} />
      {!configured && <AdminNotice icon={Sparkles} title="Preview workspace active" copy="Explore every administration feature safely. Connect Supabase to make changes persistent for the live website." />}
      <section className="admin-stat-grid" aria-label="Studio statistics">
        {stats.map(({ label, value, change, icon: Icon, tone }) => <article className={`admin-stat admin-stat--${tone}`} key={label}><span><Icon size={20} /></span><small>{label}</small><strong>{String(value).padStart(2, '0')}</strong><p>{change}</p><i /></article>)}
      </section>
      <section className="admin-dashboard-grid">
        <article className="admin-panel admin-collection-health">
          <div className="admin-panel__head"><div><small>Collection health</small><h2>One connected Malawi story.</h2></div><Link to="/admin/content/heritage">Manage content <ArrowRight size={16} /></Link></div>
          <div>{resourceEntries.map(([key, definition], index) => { const Icon = iconMap[definition.icon] || FileText; const count = data.counts[key] || 0; return <Link to={`/admin/content/${key}`} key={key}><span><Icon size={18} /></span><div><strong>{definition.shortLabel}</strong><small>{count} records</small></div><i style={{ '--health': `${Math.min(100, 45 + count * 8)}%` }} /><b>{String(index + 1).padStart(2, '0')}</b></Link> })}</div>
        </article>
        <article className="admin-panel admin-queue-panel">
          <div className="admin-panel__head"><div><small>Contribution queue</small><h2>Stories waiting for care.</h2></div><Link to="/admin/inbox/submissions">View all <ArrowRight size={16} /></Link></div>
          <div>{data.recentSubmissions.length ? data.recentSubmissions.map((item) => <Link to="/admin/inbox/submissions" key={item.id}><span>{(item.submission_type || 'story').slice(0, 2).toUpperCase()}</span><div><strong>{item.title}</strong><small>{item.name} · {formatDate(item.created_at)}</small></div><StatusPill value={item.status} /></Link>) : <AdminMiniEmpty copy="No submissions are waiting." />}</div>
        </article>
        <article className="admin-panel admin-inbox-panel">
          <div className="admin-panel__head"><div><small>Community inbox</small><h2>Recent conversations.</h2></div><Link to="/admin/inbox/contact">Open inbox <ArrowRight size={16} /></Link></div>
          <div>{data.recentMessages.length ? data.recentMessages.map((item) => <Link to="/admin/inbox/contact" key={item.id}><span><MessageSquareText size={17} /></span><div><strong>{item.subject}</strong><small>{item.name} · {formatDate(item.created_at)}</small></div><StatusPill value={item.status} /></Link>) : <AdminMiniEmpty copy="Your inbox is clear." />}</div>
        </article>
        <article className="admin-panel admin-activity-panel">
          <div className="admin-panel__head"><div><small>Activity trail</small><h2>What changed recently.</h2></div><Link to="/admin/activity">Full log <ArrowRight size={16} /></Link></div>
          <div>{data.recentActivity.length ? data.recentActivity.map((item) => <div key={item.id}><span><Activity size={16} /></span><p><strong>{titleCase(item.action)}</strong> {item.summary || item.resource_type}<small>{titleCase(item.resource_type)} · {formatDate(item.created_at, true)}</small></p></div>) : <AdminMiniEmpty copy="Activity will appear as the team works." />}</div>
        </article>
      </section>
    </div>
  )
}

function AdminResourcePage() {
  const { resource } = useParams()
  const definition = adminResources[resource]
  const routeLocation = useLocation()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [visibility, setVisibility] = useState('all')
  const [editing, setEditing] = useState(() => (
    routeLocation.state?.resource === resource ? routeLocation.state.editorialDraft : null
  ))
  const [archiveCandidate, setArchiveCandidate] = useState(null)
  const [historyCandidate, setHistoryCandidate] = useState(null)
  const [toast, setToast] = useState('')

  const load = () => {
    if (!definition) return
    setLoading(true)
    setError('')
    loadAdminResource(resource).then(setItems).catch((reason) => setError(reason.message || 'Unable to load collection')).finally(() => setLoading(false))
  }
  useEffect(() => {
    if (!definition) return undefined
    let active = true
    loadAdminResource(resource)
      .then((result) => { if (active) setItems(result) })
      .catch((reason) => { if (active) setError(reason.message || 'Unable to load collection') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [definition, resource])

  useEffect(() => {
    const draft = routeLocation.state?.editorialDraft
    if (!draft || routeLocation.state?.resource !== resource) return
    navigate(routeLocation.pathname, { replace: true, state: null })
  }, [navigate, resource, routeLocation.pathname, routeLocation.state])

  const filtered = useMemo(() => items.filter((item) => {
    const text = `${item[definition?.titleField] || ''} ${item[definition?.subtitleField] || ''} ${item.type || ''} ${item.segment || ''}`.toLowerCase()
    const queryMatch = text.includes(query.toLowerCase())
    const state = item.publication_status || (item.published ? 'published' : 'draft')
    const visibilityMatch = visibility === 'all' || visibility === state
    return queryMatch && visibilityMatch
  }), [items, definition, query, visibility])

  if (!definition) return <Navigate to="/admin" replace />
  const Icon = iconMap[definition.icon] || FileText

  const save = async (record) => {
    const saved = await saveAdminRecord(resource, record)
    if (record.__submissionId) await markSubmissionConverted(record.__submissionId)
    setItems((current) => record.id ? current.map((item) => item.id === saved.id ? saved : item) : [saved, ...current])
    setEditing(null)
    setToast(`${definition.singular} saved`)
  }
  const togglePublished = async (item) => {
    try {
      const currentState = item.publication_status || (item.published ? 'published' : 'draft')
      const saved = await saveAdminRecord(resource, { ...item, publication_status: currentState === 'published' ? 'draft' : 'published' })
      setItems((current) => current.map((entry) => entry.id === saved.id ? saved : entry))
      setToast(saved.publication_status === 'published' ? 'Published to the website' : 'Moved back to draft')
    } catch (reason) { setError(reason.message || 'Unable to update visibility') }
  }
  const archive = async () => {
    try {
      const saved = await saveAdminRecord(resource, { ...archiveCandidate, publication_status: 'archived' })
      setItems((current) => current.map((item) => item.id === saved.id ? saved : item))
      setArchiveCandidate(null)
      setToast(`${definition.singular} archived`)
    } catch (reason) { setError(reason.message || 'Unable to archive record') }
  }

  const newRecord = { publication_status: 'draft', published: false, featured: false, sort_order: items.length + 1 }

  return (
    <div className="admin-resource-page">
      <AdminPageHeader eyebrow="Content collection" title={definition.label} copy={definition.description} actions={<button className="admin-primary-action" onClick={() => setEditing(newRecord)}><Plus size={17} /> New {definition.singular}</button>} />
      <section className="admin-collection-summary"><span><Icon size={24} /></span><div><strong>{items.length}</strong><small>Total records</small></div><div><strong>{items.filter((item) => (item.publication_status || (item.published ? 'published' : 'draft')) === 'published').length}</strong><small>Published</small></div><div><strong>{items.filter((item) => (item.publication_status || (item.published ? 'published' : 'draft')) === 'scheduled').length}</strong><small>Scheduled</small></div><div><strong>{items.filter((item) => (item.publication_status || (item.published ? 'published' : 'draft')) === 'draft').length}</strong><small>Drafts</small></div><i /></section>
      <section className="admin-resource-panel">
        <div className="admin-resource-toolbar"><label><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${definition.shortLabel.toLowerCase()}...`} /></label><div><button className={visibility === 'all' ? 'active' : ''} onClick={() => setVisibility('all')}>All</button>{publicationStates.map((state) => <button className={visibility === state.value ? 'active' : ''} onClick={() => setVisibility(state.value)} key={state.value}>{state.label}</button>)}</div><button className="admin-icon-button" onClick={load} aria-label="Refresh collection"><RefreshCw size={17} /></button></div>
        {error && <AdminNotice icon={Bell} title="Something needs attention" copy={error} action={<button onClick={load}>Try again</button>} />}
        {loading ? <AdminLoading label={`Loading ${definition.shortLabel.toLowerCase()}`} /> : filtered.length ? (
          <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Record</th>{definition.columns.slice(1).map((column) => <th key={column.key}>{column.label}</th>)}<th>Workflow</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{filtered.map((item) => {
            const state = item.publication_status || (item.published ? 'published' : 'draft')
            return <tr key={item.id}><td><div className="admin-record-title">{item.image ? <img src={item.image} alt="" /> : <span><Image size={18} /></span>}<div><strong>{item.featured ? <Star size={13} fill="currentColor" /> : null}{item[definition.titleField]}</strong><small>/{item.slug || item.id}</small></div></div></td>{definition.columns.slice(1).map((column) => <td key={column.key}>{column.type === 'date' ? formatDate(item[column.key]) : column.type === 'boolean' ? item[column.key] ? <span className="admin-verified"><BadgeCheck size={15} /> Yes</span> : 'No' : item[column.key] || '—'}</td>)}<td><button className={`admin-publish-toggle ${state === 'published' ? 'active' : ''}`} onClick={() => togglePublished(item)} disabled={state === 'scheduled'} aria-label={`${state === 'published' ? 'Move to draft' : 'Publish'} ${item[definition.titleField]}`}><i /><span>{state === 'scheduled' ? <><Clock3 size={13} /> Scheduled</> : titleCase(state)}</span></button></td><td><div className="admin-row-actions"><button onClick={() => setEditing(item)} aria-label={`Edit ${item[definition.titleField]}`}><Pencil size={16} /></button><button onClick={() => setHistoryCandidate(item)} aria-label={`Version history for ${item[definition.titleField]}`}><Clock3 size={15} /></button>{state === 'published' ? <Link to={definition.publicPath(item)} target="_blank" rel="noreferrer" aria-label={`View ${item[definition.titleField]} on the website`}><ExternalLink size={15} /></Link> : null}<button className="danger" onClick={() => setArchiveCandidate(item)} aria-label={`Archive ${item[definition.titleField]}`}><Archive size={15} /></button></div></td></tr>
          })}</tbody></table></div>
        ) : <AdminEmpty icon={Icon} title="No matching records" copy="Adjust your search or create the first record in this view." action={<button className="admin-primary-action" onClick={() => setEditing(newRecord)}><Plus size={17} /> Add record</button>} />}
      </section>
      {editing && <AdminEditor definition={definition} record={editing} onClose={() => setEditing(null)} onSave={save} />}
      {archiveCandidate && <AdminConfirm title={`Archive ${archiveCandidate[definition.titleField]}?`} copy="This removes the record from the public website without destroying it. Editors can restore it later from the archived filter." confirmLabel="Archive safely" onCancel={() => setArchiveCandidate(null)} onConfirm={archive} />}
      {historyCandidate && <AdminVersionHistory resource={resource} definition={definition} record={historyCandidate} onClose={() => setHistoryCandidate(null)} onRestore={(saved) => { setItems((current) => current.map((item) => item.id === saved.id ? saved : item)); setHistoryCandidate(null); setToast('Previous version restored') }} />}
      {toast && <AdminToast message={toast} onDone={() => setToast('')} />}
    </div>
  )
}

function AdminEditor({ definition, record, onClose, onSave }) {
  const initial = {
    ...Object.fromEntries(definition.fields.map((field) => [field.key, record[field.key] ?? field.defaultValue ?? (field.type === 'boolean' ? false : '')])),
    publication_status: record.publication_status || (record.published ? 'published' : 'draft'),
    publish_at: record.publish_at ? new Date(record.publish_at).toISOString().slice(0, 16) : '',
    featured: Boolean(record.featured),
  }
  const [form, setForm] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const change = (field, value) => {
    setForm((current) => {
      const next = { ...current, [field.key]: value }
      const titleKey = definition.titleField
      if (field.key === titleKey && (!current.slug || current.slug === slugify(current[titleKey]))) next.slug = slugify(value)
      if (field.key === 'event_date' && value) {
        const date = new Date(`${value}T12:00:00`)
        next.day = String(date.getDate()).padStart(2, '0')
        next.month = date.toLocaleString('en', { month: 'short' }).toUpperCase()
      }
      return next
    })
  }

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    const payload = { ...record }
    definition.fields.forEach((field) => {
      const value = form[field.key]
      if (field.type === 'number') payload[field.key] = Number(value || 0)
      else if (field.type === 'boolean') payload[field.key] = Boolean(value)
      else payload[field.key] = value === '' && !field.required ? null : value
    })
    payload.publication_status = form.publication_status
    payload.publish_at = form.publication_status === 'scheduled' && form.publish_at ? new Date(form.publish_at).toISOString() : null
    payload.featured = Boolean(form.featured)
    if (form.publication_status === 'scheduled' && (!form.publish_at || new Date(form.publish_at) <= new Date())) {
      setError('Choose a future date and time for scheduled publication.')
      setBusy(false)
      return
    }
    try { await onSave(payload) }
    catch (reason) { setError(reason.message || 'Unable to save this record') }
    finally { setBusy(false) }
  }

  return (
    <div className="admin-drawer-layer" role="presentation">
      <button className="admin-drawer-scrim" onClick={onClose} aria-label="Close editor" />
      <aside className="admin-editor" role="dialog" aria-modal="true" aria-labelledby="admin-editor-title">
        <header><div><small>{record.id ? 'Edit record' : 'Create record'}</small><h2 id="admin-editor-title">{record.id ? record[definition.titleField] : `New ${definition.singular}`}</h2></div><button onClick={onClose} aria-label="Close editor"><X /></button></header>
        <form onSubmit={submit}>
          {form.image && <div className="admin-editor-preview"><img src={form.image} alt="Content preview" /><span><Image size={16} /> Live image preview</span></div>}
          <div className="admin-editor-fields">
            <section className="admin-publishing-fields"><div><small>Publishing workflow</small><strong>Control when and where this story appears.</strong></div><label><span>Status</span><select value={form.publication_status} onChange={(event) => setForm((current) => ({ ...current, publication_status: event.target.value }))}>{publicationStates.map((state) => <option value={state.value} key={state.value}>{state.label}</option>)}</select></label>{form.publication_status === 'scheduled' ? <label><span>Release date and time *</span><input type="datetime-local" required value={form.publish_at} onChange={(event) => setForm((current) => ({ ...current, publish_at: event.target.value }))} /></label> : null}<label><span className="admin-check-field"><input type="checkbox" checked={form.featured} onChange={(event) => setForm((current) => ({ ...current, featured: event.target.checked }))} /><i /><span><strong>Feature this story</strong><small>Eligible for homepage and collection highlights</small></span></span></label></section>
            {definition.fields.map((field) => <label className={field.wide ? 'wide' : ''} key={field.key}>{field.type !== 'boolean' && <span>{field.label}{field.required && <b>*</b>}</span>}{field.type === 'asset' ? <MediaAssetField field={field} value={form[field.key]} onChange={(value) => change(field, value)} /> : field.type === 'textarea' ? <textarea rows={field.rows || 4} required={field.required} value={form[field.key] ?? ''} onChange={(event) => change(field, event.target.value)} /> : field.type === 'select' ? <select required={field.required} value={form[field.key] ?? ''} onChange={(event) => change(field, event.target.value)}><option value="">Choose one</option>{field.options.map((option) => <option key={option}>{option}</option>)}</select> : field.type === 'boolean' ? <span className="admin-check-field"><input type="checkbox" checked={Boolean(form[field.key])} onChange={(event) => change(field, event.target.checked)} /><i /><span><strong>{field.label}</strong><small>{form[field.key] ? 'Visible and active' : 'Not active'}</small></span></span> : <input type={field.type || 'text'} required={field.required} value={form[field.key] ?? ''} onChange={(event) => change(field, event.target.value)} />}</label>)}
          </div>
          {error && <div className="admin-form-error" role="alert">{error}</div>}
          <footer><button type="button" className="admin-secondary-action" onClick={onClose}>Cancel</button><button className="admin-primary-action" type="submit" disabled={busy}>{busy ? 'Saving…' : <><Check size={17} /> Save {definition.singular}</>}</button></footer>
        </form>
      </aside>
    </div>
  )
}

function AdminVersionHistory({ resource, definition, record, onClose, onRestore }) {
  const [versions, setVersions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')

  useEffect(() => {
    let active = true
    loadContentVersions(resource, record.id)
      .then((items) => { if (active) setVersions(items) })
      .catch((reason) => { if (active) setError(reason.message || 'Unable to load version history.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [record.id, resource])

  const restore = async (version) => {
    setBusyId(version.id)
    setError('')
    try { onRestore(await restoreContentVersion(resource, version)) }
    catch (reason) { setError(reason.message || 'Unable to restore this version.') }
    finally { setBusyId('') }
  }

  return <div className="admin-drawer-layer"><button className="admin-drawer-scrim" onClick={onClose} aria-label="Close version history" /><aside className="admin-editor admin-version-drawer" role="dialog" aria-modal="true" aria-labelledby="version-history-title"><header><div><small>Version history</small><h2 id="version-history-title">{record[definition.titleField]}</h2></div><button onClick={onClose} aria-label="Close version history"><X /></button></header><div className="admin-version-list">{error ? <div className="admin-form-error" role="alert">{error}</div> : null}{loading ? <AdminLoading label="Loading previous versions" /> : versions.length ? versions.map((version, index) => <article key={version.id}><span><Clock3 size={17} /></span><div><small>{version.action} snapshot · {formatDate(version.created_at, true)}</small><h3>{version.snapshot[definition.titleField] || 'Untitled version'}</h3><p>{version.snapshot.summary || version.snapshot.description || version.snapshot.detail || 'Editorial snapshot before a saved change.'}</p></div><button className="admin-secondary-action" onClick={() => restore(version)} disabled={busyId === version.id}>{busyId === version.id ? 'Restoring…' : `Restore v${versions.length - index}`}</button></article>) : <AdminEmpty icon={Clock3} title="No earlier versions" copy="A snapshot is created automatically before every update or deletion." />}</div></aside></div>
}

function AdminWorkflowPage() {
  const { workflow } = useParams()
  const navigate = useNavigate()
  const definition = workflowResources[workflow]
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [selected, setSelected] = useState(null)
  const [toast, setToast] = useState('')

  const load = () => {
    if (!definition) return
    setLoading(true)
    setError('')
    loadAdminResource(workflow).then((data) => { setItems(data); setSelected((current) => data.find((item) => item.id === current?.id) || data[0] || null) }).catch((reason) => setError(reason.message || 'Unable to load workflow')).finally(() => setLoading(false))
  }
  useEffect(() => {
    if (!definition) return undefined
    let active = true
    loadAdminResource(workflow)
      .then((result) => {
        if (!active) return
        setItems(result)
        setSelected(result[0] || null)
      })
      .catch((reason) => { if (active) setError(reason.message || 'Unable to load workflow') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [definition, workflow])

  const filtered = useMemo(() => items.filter((item) => {
    const text = `${item[definition?.titleField] || ''} ${item[definition?.personField] || ''} ${item[definition?.emailField] || ''}`.toLowerCase()
    const state = item[definition?.statusField]
    return text.includes(query.toLowerCase()) && (status === 'all' || String(state) === status)
  }), [items, definition, query, status])

  if (!definition) return <Navigate to="/admin" replace />
  const Icon = iconMap[definition.icon] || Inbox
  const states = workflow === 'subscribers' ? ['true', 'false'] : definition.statuses

  const updateState = async (item, value) => {
    try {
      const normalized = workflow === 'subscribers' ? value === 'true' : value
      const saved = await updateWorkflowState(workflow, item, normalized)
      setItems((current) => current.map((entry) => entry.id === saved.id ? saved : entry))
      setSelected((current) => current?.id === saved.id ? saved : current)
      setToast(`${definition.singular} updated`)
    } catch (reason) { setError(reason.message || 'Unable to update workflow') }
  }

  const remove = async (item) => {
    try {
      await deleteAdminRecord(workflow, item.id)
      const remaining = items.filter((entry) => entry.id !== item.id)
      setItems(remaining)
      setSelected(remaining[0] || null)
      setToast(`${definition.singular} removed`)
    } catch (reason) { setError(reason.message || 'Unable to remove item') }
  }

  const convertSubmission = (submission) => {
    const converted = submissionToDraft(submission)
    navigate(`/admin/content/${converted.resource}`, {
      state: { resource: converted.resource, editorialDraft: converted.record },
    })
  }

  const exportSubscribers = () => {
    const blob = new Blob([buildSubscriberCsv(items)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `online-tourism-malawi-subscribers-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    setToast('Subscriber CSV exported')
  }

  return (
    <div className="admin-workflow-page">
      <AdminPageHeader eyebrow="Community operations" title={definition.label} copy={definition.description} actions={<>{workflow === 'subscribers' ? <button className="admin-primary-action" onClick={exportSubscribers}><FileText size={16} /> Export CSV</button> : null}{workflow === 'submissions' && selected && selected.status !== 'accepted' ? <button className="admin-primary-action" onClick={() => convertSubmission(selected)}><Plus size={16} /> Convert selected to draft</button> : null}<button className="admin-secondary-action" onClick={load}><RefreshCw size={16} /> Refresh</button></>} />
      <section className="admin-workflow-shell">
        <div className="admin-workflow-list">
          <div className="admin-workflow-toolbar"><label><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${definition.label.toLowerCase()}...`} /></label><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All states</option>{states.map((state) => <option key={state} value={state}>{workflow === 'subscribers' ? state === 'true' ? 'Active' : 'Inactive' : titleCase(state)}</option>)}</select></div>
          {error && <AdminNotice icon={Bell} title="Unable to load this workflow" copy={error} />}
          {loading ? <AdminLoading label={`Loading ${definition.label.toLowerCase()}`} /> : filtered.length ? <div>{filtered.map((item) => <button className={selected?.id === item.id ? 'active' : ''} onClick={() => setSelected(item)} key={item.id}><span><Icon size={17} /></span><div><strong>{item[definition.titleField]}</strong><small>{item[definition.personField] || formatDate(item.created_at)}{item[definition.personField] && ` · ${formatDate(item.created_at)}`}</small></div><StatusPill value={item[definition.statusField]} /></button>)}</div> : <AdminMiniEmpty copy="Nothing matches this view." />}
        </div>
        <article className="admin-workflow-detail">
          {selected ? <><header><div><small>{definition.singular} · {formatDate(selected.created_at, true)}</small><h2>{selected[definition.titleField]}</h2></div><button onClick={() => remove(selected)} aria-label={`Delete ${definition.singular}`}><Trash2 size={16} /></button></header>{selected[definition.personField] && <div className="admin-contact-person"><span>{String(selected[definition.personField]).slice(0, 1).toUpperCase()}</span><div><strong>{selected[definition.personField]}</strong>{selected[definition.emailField] && <a href={`mailto:${selected[definition.emailField]}`}>{selected[definition.emailField]}</a>}</div>{selected[definition.emailField] && <a href={`mailto:${selected[definition.emailField]}`}><Mail size={16} /> Reply</a>}</div>}{selected.submission_type && <dl><div><dt>Contribution</dt><dd>{titleCase(selected.submission_type)}</dd></div><div><dt>Location</dt><dd>{selected.location || 'Not supplied'}</dd></div>{selected.website && <div><dt>Reference</dt><dd><a href={selected.website} target="_blank" rel="noreferrer">Open link <ExternalLink size={13} /></a></dd></div>}</dl>}{selected[definition.bodyField] && <div className="admin-message-body"><small>Message</small><p>{selected[definition.bodyField]}</p></div>}<footer><label><span>{workflow === 'subscribers' ? 'Subscription' : 'Workflow state'}</span><select value={String(selected[definition.statusField])} onChange={(event) => updateState(selected, event.target.value)}>{states.map((state) => <option value={state} key={state}>{workflow === 'subscribers' ? state === 'true' ? 'Active' : 'Inactive' : titleCase(state)}</option>)}</select></label>{selected[definition.emailField] && <a className="admin-primary-action" href={`mailto:${selected[definition.emailField]}`}><Mail size={16} /> Reply by email</a>}</footer></> : <AdminEmpty icon={Icon} title="Choose an item" copy="Select an item from the list to review the complete details." />}
        </article>
      </section>
      {toast && <AdminToast message={toast} onDone={() => setToast('')} />}
    </div>
  )
}

function AdminMembersPage() {
  const { user } = useAuth()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [toast, setToast] = useState('')
  const load = () => { setLoading(true); loadMembers().then(setMembers).catch((reason) => setError(reason.message || 'Unable to load members')).finally(() => setLoading(false)) }
  useEffect(() => {
    let active = true
    loadMembers()
      .then((result) => { if (active) setMembers(result) })
      .catch((reason) => { if (active) setError(reason.message || 'Unable to load members') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])
  const filtered = members.filter((member) => `${member.display_name || ''} ${member.email || ''} ${member.role}`.toLowerCase().includes(query.toLowerCase()))
  const changeRole = async (member, role) => {
    try {
      const saved = await setMemberRole(member.id, role)
      setMembers((current) => current.map((item) => item.id === member.id ? { ...item, ...saved, role } : item))
      setToast(`${member.display_name || 'Member'} is now ${titleCase(role)}`)
    } catch (reason) { setError(reason.message || 'Unable to change role') }
  }
  return <div className="admin-members-page"><AdminPageHeader eyebrow="Access & community" title="Members & roles" copy="Review member profiles and grant editorial access without exposing privileged API credentials." actions={<button className="admin-secondary-action" onClick={load}><RefreshCw size={16} /> Refresh</button>} /><AdminNotice icon={ShieldCheck} title="Roles are enforced in the database" copy="Members cannot promote themselves. Every role change is validated by Supabase and written to the audit trail." /><section className="admin-members-panel"><div className="admin-resource-toolbar"><label><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search members..." /></label><span>{members.length} profiles</span></div>{error && <AdminNotice icon={Bell} title="Something needs attention" copy={error} />}{loading ? <AdminLoading label="Loading member directory" /> : filtered.length ? <div className="admin-member-list">{filtered.map((member) => <article key={member.id}><span>{(member.display_name || member.email || 'M').slice(0, 1).toUpperCase()}</span><div><strong>{member.display_name || 'Unnamed member'}{member.id === user.id && <small>You</small>}</strong><p>{member.email || `Member ID · ${member.id.slice(0, 8)}`}</p></div><small>Joined {formatDate(member.created_at)}</small><label><span className="sr-only">Role for {member.display_name}</span><select value={member.role || 'member'} disabled={member.id === user.id} onChange={(event) => changeRole(member, event.target.value)}>{adminRoles.map((role) => <option value={role.value} key={role.value}>{role.label}</option>)}</select></label></article>)}</div> : <AdminMiniEmpty copy="No member profiles match your search." />}</section><section className="admin-role-grid">{adminRoles.map((role, index) => <article key={role.value}><span>0{index + 1}</span><UserCog size={21} /><h2>{role.label}</h2><p>{role.description}</p></article>)}</section>{toast && <AdminToast message={toast} onDone={() => setToast('')} />}</div>
}

function AdminActivityPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = () => { setLoading(true); loadAuditLog().then(setItems).catch((reason) => setError(reason.message || 'Unable to load activity')).finally(() => setLoading(false)) }
  useEffect(() => {
    let active = true
    loadAuditLog()
      .then((result) => { if (active) setItems(result) })
      .catch((reason) => { if (active) setError(reason.message || 'Unable to load activity') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])
  return <div className="admin-activity-page"><AdminPageHeader eyebrow="Accountability" title="Studio activity" copy="A traceable history of content, workflow and role changes across the platform." actions={<button className="admin-secondary-action" onClick={load}><RefreshCw size={16} /> Refresh</button>} /><section className="admin-activity-log">{error && <AdminNotice icon={Bell} title="Unable to load activity" copy={error} />}{loading ? <AdminLoading label="Loading the audit trail" /> : items.length ? items.map((item, index) => <article key={item.id}><span><i />{String(index + 1).padStart(2, '0')}</span><div><small>{titleCase(item.resource_type)}</small><h2>{item.summary || 'Untitled record'}</h2><p><strong>{titleCase(item.action)}</strong> by {item.actor_email || 'Website visitor or system process'}</p></div><time>{formatDate(item.created_at, true)}</time></article>) : <AdminEmpty icon={Activity} title="No activity yet" copy="Changes will appear here as the administration team begins work." />}</section></div>
}

function AdminSettingsPage() {
  const { configured, profile, user } = useAuth()
  const projectHost = configured ? new URL(import.meta.env.VITE_SUPABASE_URL).host : 'Preview data only'
  return <div className="admin-settings-page"><AdminPageHeader eyebrow="Studio configuration" title="Settings & security" copy="Understand the services, permissions and publishing safeguards behind the administration studio." /><section className="admin-settings-grid"><article className="admin-settings-card admin-settings-card--connection"><span><Database size={22} /></span><small>Database connection</small><h2>{configured ? 'Supabase is live' : 'Preview workspace'}</h2><p>{configured ? projectHost : 'No production database keys are active in this build.'}</p><i className={configured ? 'live' : ''}>{configured ? 'Connected' : 'Preview'}</i></article><article className="admin-settings-card"><span><CircleUserRound size={22} /></span><small>Current administrator</small><h2>{profile?.display_name || 'Administrator'}</h2><p>{user?.email}</p><i>{titleCase(profile?.role)}</i></article><article className="admin-settings-card"><span><ShieldCheck size={22} /></span><small>Security posture</small><h2>RLS enforced</h2><p>Roles and permissions are evaluated inside PostgreSQL for every request.</p><i>Protected</i></article></section><section className="admin-permission-matrix"><div><small>Permission matrix</small><h2>Clear responsibility at every level.</h2><p>Public credentials never receive administration rights. Editorial actions require an authenticated profile with the correct database role.</p></div><div><header><span>Capability</span><span>Member</span><span>Editor</span><span>Admin</span></header>{[['View public content', true, true, true], ['Save a personal collection', true, true, true], ['Create and edit cultural content', false, true, true], ['Review private submissions', false, false, true], ['Manage members and roles', false, false, true], ['Read the complete audit trail', false, false, true]].map(([label, member, editor, admin]) => <div key={label}><strong>{label}</strong>{[member, editor, admin].map((allowed, index) => <span key={index} className={allowed ? 'allowed' : ''}>{allowed ? <Check size={15} /> : <X size={14} />}</span>)}</div>)}</div></section><section className="admin-settings-actions"><AdminNotice icon={LockKeyhole} title="Secrets stay on trusted infrastructure" copy="This frontend uses only the public Supabase publishable key. Never add a service-role or secret key to Vite environment variables." /><Link className="admin-secondary-action" to="/privacy">Review privacy information <ExternalLink size={15} /></Link></section></div>
}

function StatusPill({ value }) {
  const normalized = String(value)
  const label = normalized === 'true' ? 'Active' : normalized === 'false' ? 'Inactive' : titleCase(normalized)
  return <span className={`admin-status admin-status--${normalized}`}>{label}</span>
}

function AdminEmpty({ icon: Icon = FileText, title, copy, action }) {
  return <div className="admin-empty"><span><Icon size={24} /></span><h2>{title}</h2><p>{copy}</p>{action}</div>
}

function AdminMiniEmpty({ copy }) {
  return <div className="admin-mini-empty"><Check size={17} /><span>{copy}</span></div>
}

function AdminError({ error, retry }) {
  return <div className="admin-error-page"><span><Bell size={24} /></span><h1>The studio could not load.</h1><p>{error}</p><button className="admin-primary-action" onClick={retry}><RefreshCw size={17} /> Try again</button></div>
}

function AdminConfirm({ title, copy, confirmLabel, onCancel, onConfirm }) {
  const [busy, setBusy] = useState(false)
  return <div className="admin-confirm-layer" role="presentation"><div className="admin-confirm" role="alertdialog" aria-modal="true" aria-labelledby="admin-confirm-title"><span><Trash2 size={22} /></span><small>Permanent action</small><h2 id="admin-confirm-title">{title}</h2><p>{copy}</p><div><button className="admin-secondary-action" onClick={onCancel} disabled={busy}>Cancel</button><button className="admin-danger-action" disabled={busy} onClick={async () => { setBusy(true); await onConfirm(); setBusy(false) }}>{busy ? 'Deleting…' : confirmLabel}</button></div></div></div>
}

function AdminToast({ message, onDone }) {
  useEffect(() => { const timer = window.setTimeout(onDone, 3200); return () => window.clearTimeout(timer) }, [onDone])
  return <div className="admin-toast" role="status"><span><Check size={16} /></span>{message}</div>
}

export default function AdminApp() {
  return <AdminGuard />
}
