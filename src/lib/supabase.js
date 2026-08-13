import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()
const previewRequested = import.meta.env.VITE_ENABLE_AUTH_PREVIEW === 'true'

const isValidSupabaseUrl = (() => {
  if (!supabaseUrl) return false
  try {
    const url = new URL(supabaseUrl)
    return url.protocol === 'https:' && url.hostname.endsWith('.supabase.co')
  } catch {
    return false
  }
})()

const isBrowserSafeKey = Boolean(
  supabasePublishableKey
  && !supabasePublishableKey.startsWith('sb_secret_')
  && !supabasePublishableKey.toLowerCase().includes('service_role'),
)

export const supabaseConfigError = !supabaseUrl || !supabasePublishableKey
  ? 'Secure account services are temporarily unavailable.'
  : !isValidSupabaseUrl
    ? 'The account service URL is invalid.'
    : !isBrowserSafeKey
      ? 'A server-only Supabase key was blocked from the browser bundle.'
      : ''

export const hasSupabaseConfig = !supabaseConfigError
export const authPreviewEnabled = import.meta.env.DEV && previewRequested && !hasSupabaseConfig

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null

