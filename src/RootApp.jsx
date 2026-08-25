import { lazy, Suspense } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { ADMIN_BASE_PATH, adminPath, legacyAdminSuffix } from './admin/adminRoute'
import { useAuth } from './context/AuthContext'

const App = lazy(() => import('./App'))
const AdminApp = lazy(() => import('./admin/AdminApp'))
const GlobalSearchPage = lazy(() => import('./pages/GlobalSearchPage'))
const MediaPage = lazy(() => import('./pages/MediaPage'))
const PremiumPage = lazy(() => import('./pages/PremiumPage'))

function RouteLoading() {
  return <main className="route-loader" aria-busy="true" aria-live="polite"><div><span /><p>Opening Malawi&hellip;</p></div></main>
}

export default function RootApp() {
  const location = useLocation()
  const { canManageContent, loading, profileLoading } = useAuth()
  const legacySuffix = legacyAdminSuffix(location.pathname)
  const isStudioPath = location.pathname === ADMIN_BASE_PATH || location.pathname.startsWith(`${ADMIN_BASE_PATH}/`)

  // Keep the old predictable route dark. Authorised editorial users are migrated
  // silently so existing in-app links/bookmarks do not break during rollout.
  if (legacySuffix !== null) {
    if (loading || profileLoading) return <RouteLoading />
    if (!canManageContent) return <Navigate to="/not-found" replace />
    const target = `${adminPath(legacySuffix)}${location.search}${location.hash}`
    return <Navigate to={target} replace state={location.state} />
  }

  // Do not disclose a Studio sign-in or access-denied screen to unauthorised visitors.
  // PostgreSQL RLS and the role-aware service layer remain the authoritative controls.
  if (isStudioPath) {
    if (loading || profileLoading) return <RouteLoading />
    if (!canManageContent) return <Navigate to="/not-found" replace />
    return <Suspense fallback={<RouteLoading />}><AdminApp /></Suspense>
  }

  if (location.pathname === '/media' || location.pathname === '/podcasts') return <Navigate to="/media-library" replace />

  return (
    <Suspense fallback={<RouteLoading />}>
      {location.pathname === '/media-library' ? (
        <>
          <MediaPage />
          <Link className="premium-floating-link" to="/premium">Premium</Link>
        </>
      ) : location.pathname === '/premium' ? (
        <PremiumPage />
      ) : location.pathname === '/search' ? (
        <GlobalSearchPage />
      ) : <App />}
    </Suspense>
  )
}
