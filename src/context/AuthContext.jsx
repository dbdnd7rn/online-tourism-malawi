/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { hasSupabaseConfig, supabase } from '../lib/supabase'

const AuthContext = createContext(null)
const previewUserKey = 'otm:preview-user'

const hasRecoveryParameters = () => {
  if (typeof window === 'undefined') return false
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const query = new URLSearchParams(window.location.search)
  return hash.get('type') === 'recovery' || query.get('type') === 'recovery'
}

const authRedirect = (path) => new URL(
  path.replace(/^\//, ''),
  `${window.location.origin}${import.meta.env.BASE_URL}`,
).toString()

const readPreviewUser = () => {
  if (hasSupabaseConfig || typeof window === 'undefined') return null
  try { return JSON.parse(window.localStorage.getItem(previewUserKey)) }
  catch { return null }
}

const persistPreviewUser = (user) => {
  if (user) window.localStorage.setItem(previewUserKey, JSON.stringify(user))
  else window.localStorage.removeItem(previewUserKey)
}

const previewProfileFor = (user) => user ? {
  id: user.id,
  display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Preview administrator',
  role: 'admin',
  home_region: 'Malawi',
} : null

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readPreviewUser)
  const [profile, setProfile] = useState(() => previewProfileFor(readPreviewUser()))
  const [loading, setLoading] = useState(hasSupabaseConfig)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(hasRecoveryParameters)

  const loadProfile = useCallback(async (currentUser) => {
    if (!currentUser) {
      setProfile(null)
      setProfileError('')
      setProfileLoading(false)
      return null
    }
    if (!supabase) {
      const previewProfile = previewProfileFor(currentUser)
      setProfile(previewProfile)
      setProfileError('')
      return previewProfile
    }

    setProfileLoading(true)
    setProfileError('')
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, home_region, avatar_url, role, created_at, updated_at')
        .eq('id', currentUser.id)
        .maybeSingle()
      if (error) throw error
      setProfile(data)
      return data
    } catch (reason) {
      setProfile(null)
      setProfileError(reason instanceof Error ? reason.message : 'Unable to load your member profile')
      return null
    } finally {
      setProfileLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!supabase) return undefined
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      const sessionUser = data.session?.user ?? null
      setUser(sessionUser)
      setLoading(false)
      loadProfile(sessionUser)
    })
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      const sessionUser = session?.user ?? null
      setUser(sessionUser)
      setLoading(false)
      if (event === 'PASSWORD_RECOVERY') setIsPasswordRecovery(true)
      if (event === 'SIGNED_OUT') setIsPasswordRecovery(false)
      loadProfile(sessionUser)
    })
    return () => { active = false; data.subscription.unsubscribe() }
  }, [loadProfile])

  const refreshProfile = useCallback(() => loadProfile(user), [loadProfile, user])

  const value = useMemo(() => ({
    user,
    profile,
    loading,
    profileLoading,
    profileError,
    configured: hasSupabaseConfig,
    isAdmin: profile?.role === 'admin',
    canManageContent: ['admin', 'editor'].includes(profile?.role),
    isPasswordRecovery,
    refreshProfile,
    async signIn(email, password) {
      if (!supabase) {
        const previewUser = { email, id: 'preview-user', user_metadata: { display_name: email.split('@')[0] } }
        persistPreviewUser(previewUser)
        setUser(previewUser)
        await loadProfile(previewUser)
        return { preview: true }
      }
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      setUser(data.user ?? null)
      return data
    },
    async signUp(email, password, displayName) {
      if (!supabase) {
        const previewUser = { email, id: 'preview-user', user_metadata: { display_name: displayName } }
        persistPreviewUser(previewUser)
        setUser(previewUser)
        await loadProfile(previewUser)
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
      if (data.user && data.session) setUser(data.user)
      return data
    },
    async sendMagicLink(email) {
      if (!supabase) {
        const previewUser = { email, id: 'preview-user', user_metadata: { display_name: email.split('@')[0] } }
        persistPreviewUser(previewUser)
        setUser(previewUser)
        await loadProfile(previewUser)
        return { preview: true }
      }
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}account` },
      })
      if (error) throw error
      return data
    },
    async requestPasswordReset(email) {
      if (!supabase) return { preview: true }
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: authRedirect('/reset-password'),
      })
      if (error) throw error
      return data
    },
    async updatePassword(password) {
      if (!supabase) {
        setIsPasswordRecovery(false)
        return { preview: true }
      }
      const { data, error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setIsPasswordRecovery(false)
      return data
    },
    async signOut() {
      if (supabase) await supabase.auth.signOut()
      else persistPreviewUser(null)
      setUser(null)
      setProfile(null)
      setIsPasswordRecovery(false)
    },
  }), [user, profile, loading, profileLoading, profileError, isPasswordRecovery, loadProfile, refreshProfile])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
