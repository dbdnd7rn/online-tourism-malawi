import { Navigate, useLocation } from 'react-router-dom'
import App from './App'
import MediaPage from './pages/MediaPage'

export default function RootApp() {
  const location = useLocation()

  if (location.pathname === '/media-library') return <MediaPage />
  if (location.pathname === '/media' || location.pathname === '/podcasts') return <Navigate to="/media-library" replace />

  return <App />
}
