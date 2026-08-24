import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import RootApp from './RootApp'
import { AppErrorBoundary, SiteRuntime } from './components/SiteRuntime'
import { AuthProvider } from './context/AuthContext'
import { ContentProvider } from './context/ContentContext'
import { SubscriptionProvider } from './context/SubscriptionContext'
import './styles.css'
import './production.css'
import './media.css'

const Observability = import.meta.env.VITE_VERCEL_OBSERVABILITY
  ? lazy(() => import('./components/Observability'))
  : null

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppErrorBoundary>
        <AuthProvider>
          <SubscriptionProvider>
            <ContentProvider>
              <SiteRuntime>
                <RootApp />
              </SiteRuntime>
            </ContentProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </AppErrorBoundary>
      {Observability && <Suspense fallback={null}><Observability /></Suspense>}
    </BrowserRouter>
  </StrictMode>,
)
