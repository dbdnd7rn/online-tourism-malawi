/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { fallbackContent, loadPublishedContent } from '../services/contentService'

const ContentContext = createContext(null)

export function ContentProvider({ children }) {
  const [content, setContent] = useState(fallbackContent)
  const [source, setSource] = useState('local')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    loadPublishedContent()
      .then((result) => {
        if (!active) return
        setContent(result.content)
        setSource(result.source)
      })
      .catch((reason) => {
        if (!active) return
        setError(reason instanceof Error ? reason.message : 'Content service unavailable')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const value = useMemo(() => ({ ...content, source, error, loading }), [content, source, error, loading])
  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>
}

export function useContent() {
  const value = useContext(ContentContext)
  if (!value) throw new Error('useContent must be used inside ContentProvider')
  return value
}

