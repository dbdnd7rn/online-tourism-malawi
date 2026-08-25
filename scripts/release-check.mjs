import { spawn } from 'node:child_process'
import { access, readdir, stat } from 'node:fs/promises'
import { resolve } from 'node:path'

const projectRoot = process.cwd()
const distDirectory = resolve(projectRoot, 'dist')
const assetsDirectory = resolve(distDirectory, 'assets')
const basePath = process.env.GITHUB_ACTIONS ? '/online-tourism-malawi' : ''
const port = 4189
const origin = `http://127.0.0.1:${port}`

const routes = [
  '/',
  '/segments',
  '/explore',
  '/heritage/chongoni-rock-art-area',
  '/museums',
  '/performance',
  '/visual-arts-crafts',
  '/books-press',
  '/media-library',
  '/design-creative',
  '/events',
  '/directory',
  '/plan-your-visit',
  '/about-us',
  '/contact',
  '/contribute',
  '/account',
  '/premium',
  '/sign-in',
  '/accessibility',
]

const requiredFiles = ['robots.txt', 'sitemap.xml', 'site.webmanifest']
const limits = {
  largestJavaScript: 380 * 1024,
  totalJavaScript: 700 * 1024,
  largestStylesheet: 105 * 1024,
}

const formatSize = (bytes) => `${(bytes / 1024).toFixed(1)} KiB`

async function verifyBuildArtifacts() {
  await Promise.all(requiredFiles.map((file) => access(resolve(distDirectory, file))))
  const assets = await readdir(assetsDirectory)
  const sizes = await Promise.all(assets.map(async (file) => ({ file, size: (await stat(resolve(assetsDirectory, file))).size })))
  const javascript = sizes.filter(({ file }) => file.endsWith('.js'))
  const stylesheets = sizes.filter(({ file }) => file.endsWith('.css'))
  const largestJavaScript = Math.max(...javascript.map(({ size }) => size), 0)
  const totalJavaScript = javascript.reduce((total, { size }) => total + size, 0)
  const largestStylesheet = Math.max(...stylesheets.map(({ size }) => size), 0)

  if (largestJavaScript > limits.largestJavaScript) throw new Error(`Largest JavaScript chunk is ${formatSize(largestJavaScript)}; budget is ${formatSize(limits.largestJavaScript)}.`)
  if (totalJavaScript > limits.totalJavaScript) throw new Error(`Total JavaScript is ${formatSize(totalJavaScript)}; budget is ${formatSize(limits.totalJavaScript)}.`)
  if (largestStylesheet > limits.largestStylesheet) throw new Error(`Largest stylesheet is ${formatSize(largestStylesheet)}; budget is ${formatSize(limits.largestStylesheet)}.`)

  console.log(`Release budgets passed: largest JS ${formatSize(largestJavaScript)}, total JS ${formatSize(totalJavaScript)}, largest CSS ${formatSize(largestStylesheet)}.`)
}

async function waitForPreview() {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    try {
      const response = await fetch(`${origin}${basePath}/`)
      if (response.ok) return
    } catch {
      // Preview server is still starting.
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 250))
  }
  throw new Error('Timed out while starting the production preview.')
}

async function verifyRoutes() {
  const viteCli = resolve(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js')
  const preview = spawn(process.execPath, [viteCli, 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
    cwd: projectRoot,
    stdio: 'ignore',
    windowsHide: true,
  })

  try {
    await waitForPreview()
    for (const route of routes) {
      const response = await fetch(`${origin}${basePath}${route}`)
      const html = await response.text()
      if (!response.ok || !html.includes('id="root"')) throw new Error(`Route ${route} did not return the React application (${response.status}).`)
    }
    for (const file of requiredFiles) {
      const response = await fetch(`${origin}${basePath}/${file}`)
      if (!response.ok) throw new Error(`${file} was not available from the production preview (${response.status}).`)
    }
    console.log(`Release routes passed: ${routes.length} public pages and ${requiredFiles.length} discovery files.`)
  } finally {
    preview.kill()
  }
}

await verifyBuildArtifacts()
await verifyRoutes()
