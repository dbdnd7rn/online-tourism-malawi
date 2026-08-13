import { env } from 'node:process'

const origin = (env.SITE_ORIGIN || 'https://online-tourism-malawi.vercel.app').replace(/\/$/, '')
const checks = [
  { path: '/', contains: 'Online Tourism Malawi', contentType: 'text/html' },
  { path: '/segments', contains: 'id="root"', contentType: 'text/html' },
  { path: '/explore', contains: 'id="root"', contentType: 'text/html' },
  { path: '/media-library', contains: 'id="root"', contentType: 'text/html' },
  { path: '/plan-your-visit', contains: 'id="root"', contentType: 'text/html' },
  { path: '/sign-in', contains: 'id="root"', contentType: 'text/html' },
  { path: '/robots.txt', contains: 'Sitemap:', contentType: 'text/plain' },
  { path: '/sitemap.xml', contains: '<urlset', contentType: 'xml' },
  { path: '/site.webmanifest', contains: '"name": "Online Tourism Malawi"', contentType: 'json' },
]

async function inspect(check) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12_000)
  const startedAt = Date.now()

  try {
    const response = await fetch(`${origin}${check.path}`, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': 'Online-Tourism-Malawi-Production-Monitor/1.0' },
    })
    const body = await response.text()
    const responseContentType = response.headers.get('content-type') || ''
    const valid = response.ok && responseContentType.includes(check.contentType) && body.includes(check.contains)
    const result = {
      path: check.path,
      status: response.status,
      content_type: responseContentType,
      duration_ms: Date.now() - startedAt,
      valid,
    }
    console.log(JSON.stringify({ level: valid ? 'info' : 'error', message: 'production_smoke_check', ...result }))
    return result
  } catch (error) {
    const result = {
      path: check.path,
      status: 0,
      duration_ms: Date.now() - startedAt,
      valid: false,
      error: error instanceof Error ? error.message : String(error),
    }
    console.error(JSON.stringify({ level: 'error', message: 'production_smoke_check', ...result }))
    return result
  } finally {
    clearTimeout(timeout)
  }
}

const results = []
for (const check of checks) results.push(await inspect(check))

const failed = results.filter((result) => !result.valid)
const slowest = results.reduce((current, result) => result.duration_ms > current.duration_ms ? result : current, results[0])
console.log(JSON.stringify({
  level: failed.length ? 'error' : 'info',
  message: 'production_smoke_summary',
  origin,
  checks: results.length,
  failures: failed.length,
  slowest_path: slowest.path,
  slowest_duration_ms: slowest.duration_ms,
}))

if (failed.length) throw new Error(`${failed.length} production smoke check${failed.length === 1 ? '' : 's'} failed.`)
