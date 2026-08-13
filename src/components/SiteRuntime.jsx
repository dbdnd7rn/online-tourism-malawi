import { Component, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { applyRouteSeo } from '../lib/seo'

const homeUrl = import.meta.env.BASE_URL || '/'

export class AppErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error, details) {
    console.error('Online Tourism Malawi could not render.', error, details)
  }

  render() {
    if (!this.state.failed) return this.props.children

    return (
      <main className="fatal-state" id="main-content">
        <div role="alert">
          <small>Something interrupted the journey</small>
          <h1>Let&rsquo;s find the trail again.</h1>
          <p>The website could not finish loading this view. Your account and saved content have not been changed.</p>
          <div>
            <button type="button" onClick={() => window.location.reload()}>Try this page again</button>
            <a href={homeUrl}>Return to the homepage</a>
          </div>
        </div>
      </main>
    )
  }
}

export function SiteRuntime({ children }) {
  const location = useLocation()
  const previousPath = useRef(location.pathname)
  const [announcement, setAnnouncement] = useState('')
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' || navigator.onLine)
  const [restored, setRestored] = useState(false)

  useEffect(() => {
    applyRouteSeo(location.pathname)
  }, [location.pathname])

  useEffect(() => {
    let restoredTimer
    const handleOffline = () => {
      window.clearTimeout(restoredTimer)
      setOnline(false)
      setRestored(false)
    }
    const handleOnline = () => {
      setOnline(true)
      setRestored(true)
      restoredTimer = window.setTimeout(() => setRestored(false), 4500)
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    return () => {
      window.clearTimeout(restoredTimer)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  useEffect(() => {
    if (previousPath.current === location.pathname) return undefined
    previousPath.current = location.pathname

    const focusTimer = window.setTimeout(() => {
      const main = document.querySelector('main')
      main?.focus({ preventScroll: true })
      setAnnouncement(`${document.title}. Page loaded.`)
    }, 80)

    return () => window.clearTimeout(focusTimer)
  }, [location.pathname])

  return (
    <>
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</div>
      {!online && <div className="network-status network-status--offline" role="status">You&rsquo;re offline. The current page remains available; live updates will resume when your connection returns.</div>}
      {restored && <div className="network-status network-status--restored" role="status">Connection restored. Live Malawi content is available again.</div>}
      {children}
    </>
  )
}
