/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { hasSupabaseConfig, supabase } from '../lib/supabase'

const AuthContext = createContext(null)
const previewUserKey = 'otm:preview-user'

const readPreviewUser = () => {
  if (hasSupabaseConfig || typeof window === 'undefined') return null
  try { return JSON.parse(window.localStorage.getItem(previewUserKey)) }
  catch { return null }
}

const persistPreviewUser = (user) => {
  if (user) window.localStorage.setItem(previewUserKey, JSON.stringify(user))
  else window.localStorage.removeItem(previewUserKey)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readPreviewUser)
  const [loading, setLoading] = useState(hasSupabaseConfig)

  useEffect(() => {
    if (!supabase) return undefined
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (active) { setUser(data.session?.user ?? null); setLoading(false) }
    })
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null))
    return () => { active = false; data.subscription.unsubscribe() }
  }, [])

  const value = useMemo(() => ({
    user,
    loading,
    configured: hasSupabaseConfig,
    async signIn(email, password) {
      if (!supabase) {
        const previewUser = { email, id: 'preview-user', user_metadata: { display_name: email.split('@')[0] } }
        persistPreviewUser(previewUser)
        setUser(previewUser)
        return { preview: true }
      }
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      return data
    },
    async signUp(email, password, displayName) {
      if (!supabase) {
        const previewUser = { email, id: 'preview-user', user_metadata: { display_name: displayName } }
        persistPreviewUser(previewUser)
        setUser(previewUser)
        return { preview: true }
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
          emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}account`,
        },
      })
      if (error) throw error
      return data
    },
    async sendMagicLink(email) {
      if (!supabase) {
        const previewUser = { email, id: 'preview-user', user_metadata: { display_name: email.split('@')[0] } }
        persistPreviewUser(previewUser)
        setUser(previewUser)
        return { preview: true }
      }
      const { data, error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })
      if (error) throw error
      return data
    },
    async signOut() {
      if (supabase) await supabase.auth.signOut()
      else persistPreviewUser(null)
      setUser(null)
    },
  }), [user, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
