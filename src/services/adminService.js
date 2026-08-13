import { fallbackContent } from './contentService'
import { supabase } from '../lib/supabase'
import { adminResources, workflowResources } from '../admin/adminConfig'

const previewStoreKey = 'otm:admin-preview-store'

const slugify = (value = '') => value
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '')

const fallbackKeyByResource = {
  heritage: 'heritageItems',
  museums: 'museums',
  performances: 'performances',
  events: 'events',
  media: 'mediaItems',
  podcasts: 'podcasts',
  creatives: 'creatives',
}

const buildPreviewContent = (key) => {
  const source = fallbackContent[fallbackKeyByResource[key]] ?? []
  const definition = adminResources[key]
  return source.map((item, index) => ({
    ...item,
    id: item.id || `preview-${key}-${index + 1}`,
    slug: item.slug || slugify(item[definition.titleField]),
    published: item.published ?? true,
    publication_status: item.publication_status || (item.published === false ? 'draft' : 'published'),
    publish_at: item.publish_at ?? null,
    featured: item.featured ?? false,
    verified: item.verified ?? false,
    sort_order: item.sort_order ?? index + 1,
    created_at: item.created_at || new Date(Date.now() - index * 86400000).toISOString(),
  }))
}

const previewDefaults = () => ({
  heritage: buildPreviewContent('heritage'),
  museums: buildPreviewContent('museums'),
  performances: buildPreviewContent('performances'),
  events: buildPreviewContent('events'),
  media: buildPreviewContent('media'),
  podcasts: buildPreviewContent('podcasts'),
  creatives: buildPreviewContent('creatives'),
  contact: [
    { id: 'preview-contact-1', name: 'Amina Phiri', email: 'amina@example.com', subject: 'School heritage visit', message: 'Could you help our class plan an educational visit to a museum in Blantyre?', status: 'new', created_at: new Date().toISOString() },
    { id: 'preview-contact-2', name: 'Thoko Banda', email: 'thoko@example.com', subject: 'Photography credit', message: 'I would like to share updated credit information for one of the archive images.', status: 'in_progress', created_at: new Date(Date.now() - 86400000).toISOString() },
  ],
  submissions: [
    { id: 'preview-submission-1', submission_type: 'event', name: 'Yamikani Zulu', email: 'yamikani@example.com', title: 'Community craft fair', location: 'Mzuzu', description: 'A proposed listing for a community-led craft and food gathering.', status: 'received', created_at: new Date().toISOString() },
    { id: 'preview-submission-2', submission_type: 'correction', name: 'Memory Nkhoma', email: 'memory@example.com', title: 'Updated museum hours', location: 'Karonga', description: 'A suggested change to the public visiting hours.', status: 'reviewing', created_at: new Date(Date.now() - 172800000).toISOString() },
  ],
  subscribers: [
    { id: 'preview-subscriber-1', email: 'reader@example.com', source: 'footer', active: true, created_at: new Date().toISOString() },
    { id: 'preview-subscriber-2', email: 'traveller@example.com', source: 'home', active: true, created_at: new Date(Date.now() - 259200000).toISOString() },
  ],
  profiles: [
    { id: 'preview-user', display_name: 'Preview Administrator', role: 'admin', created_at: new Date(Date.now() - 1209600000).toISOString(), email: 'admin@preview.local' },
    { id: 'preview-member-2', display_name: 'Tadala Member', role: 'member', created_at: new Date(Date.now() - 604800000).toISOString(), email: 'member@example.com' },
  ],
  audit: [
    { id: 'preview-audit-1', action: 'UPDATE', resource_type: 'events', summary: 'Updated Lake of Stars: Cultural Weekend', created_at: new Date().toISOString(), actor_email: 'admin@preview.local' },
    { id: 'preview-audit-2', action: 'INSERT', resource_type: 'creative_profiles', summary: 'Created Malawi Image Makers', created_at: new Date(Date.now() - 86400000).toISOString(), actor_email: 'admin@preview.local' },
  ],
})

const readPreviewStore = () => {
  if (typeof window === 'undefined') return previewDefaults()
  try {
    const saved = JSON.parse(window.localStorage.getItem(previewStoreKey))
    return saved ? { ...previewDefaults(), ...saved } : previewDefaults()
  } catch {
    return previewDefaults()
  }
}

const writePreviewStore = (store) => {
  if (typeof window !== 'undefined') window.localStorage.setItem(previewStoreKey, JSON.stringify(store))
}

const previewCollection = (key) => readPreviewStore()[key] ?? []

const getDefinition = (key) => adminResources[key] || workflowResources[key]

const cleanPayload = (record) => Object.fromEntries(
  Object.entries(record).filter(([key, value]) => (
    !key.startsWith('__')
    && !['id', 'created_at', 'updated_at', 'updated_by', 'actor_email'].includes(key)
    && value !== undefined
  )),
)

const normalizePublication = (record) => {
  if (!adminResources[record.__resourceKey]) return record
  const publication_status = record.publication_status || (record.published === false ? 'draft' : 'published')
  return {
    ...record,
    publication_status,
    published: ['published', 'scheduled'].includes(publication_status),
    publish_at: publication_status === 'scheduled' ? record.publish_at : null,
    archived_at: publication_status === 'archived' ? (record.archived_at || new Date().toISOString()) : null,
  }
}

export async function loadAdminResource(key) {
  const definition = getDefinition(key)
  if (!definition) throw new Error(`Unknown admin resource: ${key}`)
  if (!supabase) return previewCollection(key)

  let query = supabase.from(definition.table).select('*')
  if (adminResources[key]) query = query.order('sort_order', { ascending: true })
  else query = query.order('created_at', { ascending: false })
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function saveAdminRecord(key, record) {
  const definition = getDefinition(key)
  if (!definition) throw new Error(`Unknown admin resource: ${key}`)
  const normalized = normalizePublication({ ...record, __resourceKey: key })
  const payload = cleanPayload(normalized)

  if (!supabase) {
    const store = readPreviewStore()
    const collection = store[key] ?? []
    const existingIndex = record.id ? collection.findIndex((item) => item.id === record.id) : -1
    const nextRecord = {
      ...payload,
      id: record.id || `preview-${key}-${Date.now()}`,
      created_at: record.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    store[key] = existingIndex >= 0
      ? collection.map((item, index) => index === existingIndex ? { ...item, ...nextRecord } : item)
      : [nextRecord, ...collection]
    writePreviewStore(store)
    return nextRecord
  }

  const operation = record.id
    ? supabase.from(definition.table).update(payload).eq('id', record.id)
    : supabase.from(definition.table).insert(payload)
  const { data, error } = await operation.select('*').single()
  if (error) throw error
  return data
}

export async function deleteAdminRecord(key, id) {
  const definition = getDefinition(key)
  if (!definition) throw new Error(`Unknown admin resource: ${key}`)
  if (!supabase) {
    const store = readPreviewStore()
    store[key] = (store[key] ?? []).filter((item) => item.id !== id)
    writePreviewStore(store)
    return
  }
  const { error } = await supabase.from(definition.table).delete().eq('id', id)
  if (error) throw error
}

export async function updateWorkflowState(key, record, value) {
  const definition = workflowResources[key]
  if (!definition) throw new Error(`Unknown workflow resource: ${key}`)
  return saveAdminRecord(key, { ...record, [definition.statusField]: value })
}

const exactCount = async (table, configure = (query) => query) => {
  const { count, error } = await configure(supabase.from(table).select('id', { count: 'exact', head: true }))
  if (error) throw error
  return count ?? 0
}

export async function loadAdminDashboard() {
  if (!supabase) {
    const store = readPreviewStore()
    return {
      counts: {
        heritage: store.heritage.length,
        museums: store.museums.length,
        performances: store.performances.length,
        events: store.events.length,
        podcasts: store.podcasts.length,
        creatives: store.creatives.length,
        media: store.media.length,
        inbox: store.contact.filter((item) => item.status === 'new').length,
        submissions: store.submissions.filter((item) => ['received', 'reviewing'].includes(item.status)).length,
        subscribers: store.subscribers.filter((item) => item.active).length,
        members: store.profiles.length,
      },
      recentMessages: store.contact.slice(0, 3),
      recentSubmissions: store.submissions.slice(0, 3),
      recentActivity: store.audit.slice(0, 5),
    }
  }

  const [
    heritage,
    museums,
    performances,
    events,
    podcasts,
    creatives,
    media,
    inbox,
    submissions,
    subscribers,
    members,
    recentMessagesResult,
    recentSubmissionsResult,
    recentActivityResult,
  ] = await Promise.all([
    exactCount('heritage_items'),
    exactCount('museums'),
    exactCount('performances'),
    exactCount('events'),
    exactCount('podcasts'),
    exactCount('creative_profiles'),
    exactCount('media_items'),
    exactCount('contact_messages', (query) => query.eq('status', 'new')),
    exactCount('submissions', (query) => query.in('status', ['received', 'reviewing'])),
    exactCount('newsletter_subscribers', (query) => query.eq('active', true)),
    exactCount('profiles'),
    supabase.from('contact_messages').select('*').order('created_at', { ascending: false }).limit(3),
    supabase.from('submissions').select('*').order('created_at', { ascending: false }).limit(3),
    supabase.from('admin_audit_log').select('*').order('created_at', { ascending: false }).limit(5),
  ])

  const resultWithError = [recentMessagesResult, recentSubmissionsResult, recentActivityResult].find((result) => result.error)
  if (resultWithError?.error) throw resultWithError.error

  return {
    counts: { heritage, museums, performances, events, podcasts, creatives, media, inbox, submissions, subscribers, members },
    recentMessages: recentMessagesResult.data ?? [],
    recentSubmissions: recentSubmissionsResult.data ?? [],
    recentActivity: recentActivityResult.data ?? [],
  }
}

export async function loadMembers() {
  if (!supabase) return previewCollection('profiles')
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, role, home_region, avatar_url, created_at, updated_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function setMemberRole(profileId, role) {
  if (!supabase) {
    const store = readPreviewStore()
    store.profiles = store.profiles.map((profile) => profile.id === profileId ? { ...profile, role, updated_at: new Date().toISOString() } : profile)
    writePreviewStore(store)
    return store.profiles.find((profile) => profile.id === profileId)
  }
  const { data, error } = await supabase.rpc('admin_set_user_role', {
    target_user_id: profileId,
    new_role: role,
  })
  if (error) throw error
  return data
}

export async function loadAuditLog() {
  if (!supabase) return previewCollection('audit')
  const { data, error } = await supabase
    .from('admin_audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw error
  return data ?? []
}

export async function loadContentVersions(key, recordId) {
  const definition = adminResources[key]
  if (!definition || !recordId) return []
  if (!supabase) return []
  const { data, error } = await supabase
    .from('content_versions')
    .select('*')
    .eq('resource_type', definition.table)
    .eq('record_id', recordId)
    .order('created_at', { ascending: false })
    .limit(25)
  if (error) throw error
  return data ?? []
}

export async function restoreContentVersion(key, version) {
  if (!version?.snapshot?.id) throw new Error('This version cannot be restored.')
  return saveAdminRecord(key, { ...version.snapshot, id: version.record_id })
}

export async function markSubmissionConverted(submissionId) {
  if (!submissionId) return null
  if (!supabase) {
    const store = readPreviewStore()
    store.submissions = store.submissions.map((item) => item.id === submissionId ? { ...item, status: 'accepted', updated_at: new Date().toISOString() } : item)
    writePreviewStore(store)
    return store.submissions.find((item) => item.id === submissionId)
  }
  const { data, error } = await supabase.from('submissions').update({ status: 'accepted' }).eq('id', submissionId).select('*').single()
  if (error) throw error
  return data
}

export const submissionToDraft = (submission) => {
  const base = {
    __submissionId: submission.id,
    publication_status: 'draft',
    published: false,
    title: submission.title,
    slug: slugify(submission.title),
    location: submission.location || '',
    description: submission.description || '',
    body: submission.description || '',
    summary: submission.description || '',
    sort_order: 0,
  }
  if (submission.submission_type === 'event') {
    return { resource: 'events', record: { ...base, type: 'Community event', place: submission.location || '', day: '', month: '', image: '' } }
  }
  if (submission.submission_type === 'profile') {
    return { resource: 'creatives', record: { ...base, name: submission.title, segment: '', focus: '', image: '', website: submission.website || '' } }
  }
  return { resource: 'heritage', record: { ...base, type: '', tag: 'Community submission', image: '', website: submission.website || '' } }
}

const csvCell = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`

export const buildSubscriberCsv = (subscribers) => [
  ['email', 'source', 'active', 'subscribed_at'],
  ...subscribers.map((item) => [item.email, item.source, item.active, item.created_at]),
].map((row) => row.map(csvCell).join(',')).join('\r\n')
