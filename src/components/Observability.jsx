import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'

function removePotentialIdentifiers(event) {
  try {
    const url = new URL(event.url, window.location.origin)
    url.search = ''
    url.hash = ''
    return { ...event, url: url.toString() }
  } catch {
    return event
  }
}

export default function Observability() {
  return (
    <>
      <Analytics beforeSend={removePotentialIdentifiers} />
      <SpeedInsights beforeSend={removePotentialIdentifiers} />
    </>
  )
}
