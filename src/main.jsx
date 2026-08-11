import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import RootApp from './RootApp'
import { AuthProvider } from './context/AuthContext'
import { ContentProvider } from './context/ContentContext'
import 'virtual:core-styles.css'
import './production.css'
import './media.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <ContentProvider>
          <RootApp />
        </ContentProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
