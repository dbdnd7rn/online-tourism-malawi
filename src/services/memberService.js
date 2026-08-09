import { supabase } from '../lib/supabase'

const storageKey = (userId) => `otm:saved:${userId || 'guest'}`

function readLocalSaved(userId) {
  try {
    return JSON.parse(window.localStorage.getItem(storageKey(userId)) || '[]')
  } catch {
    return []
  }
}

function writeLocalSaved(userId, items) {
  window.localStorage.setItem(storageKey(userId), JSON.stringify(items))
}

export async function loadSavedItems(userId) {
  if (!supabase || !userId || userId === 'preview-user') return readLocalSaved(userId)
  const { data, error } = await supabase
    .from('saved_items')
    .select('item_key,item_type,title,route,image,metadata,created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function saveItem(userId, item) {
  if (!supabase || !userId || userId === 'preview-user') {
    const items = readLocalSaved(userId)
    if (!items.some((saved) => saved.item_key === item.item_key)) writeLocalSaved(userId, [{ ...item, created_at: new Date().toISOString() }, ...items])
    return item
  }
  const { data, error } = await supabase
    .from('saved_items')
    .upsert({ ...item, user_id: userId }, { onConflict: 'user_id,item_key' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function removeSavedItem(userId, itemKey) {
  if (!supabase || !userId || userId === 'preview-user') {
    writeLocalSaved(userId, readLocalSaved(userId).filter((item) => item.item_key !== itemKey))
    return
  }
  const { error } = await supabase.from('saved_items').delete().eq('user_id', userId).eq('item_key', itemKey)
  if (error) throw error
}

export async function subscribeToNewsletter(email, source = 'website') {
  const normalized = email.trim().toLowerCase()
  if (!supabase) return { preview: true, email: normalized }
  const { error } = await supabase.from('newsletter_subscribers').insert({ email: normalized, source })
  if (error && error.code !== '23505') throw error
  return { existing: error?.code === '23505', email: normalized }
}

export async function sendContactMessage(payload) {
  if (!supabase) return { preview: true, id: `preview-${Date.now()}` }
  const { data, error } = await supabase.from('contact_messages').insert(payload).select('id').single()
  if (error) throw error
  return data
}

export async function createContribution(payload) {
  if (!supabase) return { preview: true, id: `preview-${Date.now()}` }
  const { data, error } = await supabase.from('submissions').insert(payload).select('id,status').single()
  if (error) throw error
  return data
}
