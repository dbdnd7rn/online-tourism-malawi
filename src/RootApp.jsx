import { lazy, Suspense } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

const App = lazy(() => import('./App'))
const MediaPage = lazy(() => import('./pages/MediaPage'))

function RouteLoading() {
  return <main className="route-loader" aria-busy="true" aria-live="polite"><div><span /><p>Opening Malawi&hellip;</p></div></main>
}

export default function RootApp() {
  const location = useLocation()

  if (location.pathname === '/media' || location.pathname === '/podcasts') return <Navigate to="/media-library" replace />

  return (
    <Suspense fallback={<RouteLoading />}>
      {location.pathname === '/media-library' ? <MediaPage /> : <App />}
    </Suspense>
  )
}
