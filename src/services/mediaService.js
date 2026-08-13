import { supabase } from '../lib/supabase'

export const mediaKinds = {
  image: {
    bucket: 'tourism-images',
    accept: 'image/jpeg,image/png,image/webp,image/avif,image/gif,image/svg+xml',
    maxBytes: 10 * 1024 * 1024,
    label: 'Image',
  },
  audio: {
    bucket: 'tourism-audio',
    accept: 'audio/mpeg,audio/mp4,audio/ogg,audio/wav,audio/webm',
    maxBytes: 100 * 1024 * 1024,
    label: 'Audio',
  },
  video: {
    bucket: 'tourism-video',
    accept: 'video/mp4,video/webm,video/ogg',
    maxBytes: 500 * 1024 * 1024,
    label: 'Video',
  },
  document: {
    bucket: 'tourism-documents',
    accept: 'application/pdf,text/plain,application/epub+zip',
    maxBytes: 25 * 1024 * 1024,
    label: 'Document',
  },
}

const safeFileName = (name = 'asset') => name
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9._-]+/g, '-')
  .replace(/(^-+|-+$)/g, '') || 'asset'

export const formatFileSize = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`
}

const requireSupabase = () => {
  if (!supabase) throw new Error('Connect Supabase to upload and manage production media.')
  return supabase
}

const validateFile = (file, kind) => {
  const rules = mediaKinds[kind]
  if (!rules) throw new Error('Choose a supported media type.')
  const allowed = rules.accept.split(',')
  if (!allowed.includes(file.type)) throw new Error(`${rules.label} format not supported. Choose another file.`)
  if (!file.size || file.size > rules.maxBytes) {
    throw new Error(`${rules.label} files must be smaller than ${formatFileSize(rules.maxBytes)}.`)
  }
}

export async function uploadMediaAsset(file, kind, metadata = {}) {
  const client = requireSupabase()
  validateFile(file, kind)

  const { data: userResult, error: userError } = await client.auth.getUser()
  if (userError || !userResult.user) throw new Error('Sign in again before uploading media.')

  const rules = mediaKinds[kind]
  const objectPath = `${userResult.user.id}/${kind}/${Date.now()}-${crypto.randomUUID()}-${safeFileName(file.name)}`
  const { error: uploadError } = await client.storage.from(rules.bucket).upload(objectPath, file, {
    cacheControl: '31536000',
    contentType: file.type,
    upsert: false,
  })
  if (uploadError) throw uploadError

  const { data: publicData } = client.storage.from(rules.bucket).getPublicUrl(objectPath)
  const asset = {
    bucket_id: rules.bucket,
    object_path: objectPath,
    public_url: publicData.publicUrl,
    file_name: file.name,
    mime_type: file.type,
    file_size: file.size,
    asset_kind: kind,
    title: metadata.title || file.name.replace(/\.[^.]+$/, ''),
    alt_text: metadata.alt_text || null,
    credit_line: metadata.credit_line || null,
    rights_holder: metadata.rights_holder || null,
    license: metadata.license || null,
    source_url: metadata.source_url || null,
    consent_status: metadata.consent_status || 'not_required',
    uploaded_by: userResult.user.id,
  }

  const { data, error } = await client.from('media_assets').insert(asset).select('*').single()
  if (error) {
    await client.storage.from(rules.bucket).remove([objectPath])
    throw error
  }
  return data
}

export async function loadMediaAssets({ kind = 'all', query = '' } = {}) {
  const client = requireSupabase()
  let request = client.from('media_assets').select('*').order('created_at', { ascending: false }).limit(250)
  if (kind !== 'all') request = request.eq('asset_kind', kind)
  if (query.trim()) request = request.or(`title.ilike.%${query.trim()}%,file_name.ilike.%${query.trim()}%,credit_line.ilike.%${query.trim()}%`)
  const { data, error } = await request
  if (error) throw error
  return data ?? []
}

export async function updateMediaAsset(id, metadata) {
  const client = requireSupabase()
  const allowed = ['title', 'alt_text', 'credit_line', 'rights_holder', 'license', 'source_url', 'consent_status']
  const payload = Object.fromEntries(Object.entries(metadata).filter(([key]) => allowed.includes(key)))
  const { data, error } = await client.from('media_assets').update(payload).eq('id', id).select('*').single()
  if (error) throw error
  return data
}

export async function deleteMediaAsset(asset) {
  const client = requireSupabase()
  const { error: storageError } = await client.storage.from(asset.bucket_id).remove([asset.object_path])
  if (storageError && !/not found/i.test(storageError.message || '')) throw storageError
  const { error } = await client.from('media_assets').delete().eq('id', asset.id)
  if (error) throw error
}
