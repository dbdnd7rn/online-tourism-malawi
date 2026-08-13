import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const forbiddenTrackedFiles = [
  /^\.env$/,
  /^\.env\.(?!example$)/,
  /(^|\/).*\.(?:pem|key|p12|pfx)$/i,
  /(^|\/)(?:credentials|secrets?)(?:\.|\/|$)/i,
]

const secretPatterns = [
  { label: 'Supabase secret key', pattern: /sb_secret_[A-Za-z0-9_-]+/g },
  { label: 'Supabase service-role variable', pattern: /SUPABASE_SERVICE_ROLE(?:_KEY)?\s*=/g },
  { label: 'GitHub personal token', pattern: /(?:ghp_|github_pat_)[A-Za-z0-9_]+/g },
  { label: 'Private key block', pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
]

const candidateFiles = execFileSync(
  'git',
  ['ls-files', '-co', '--exclude-standard', '-z'],
  { encoding: 'utf8' },
)
  .split('\0')
  .filter(Boolean)

const failures = []

for (const file of candidateFiles) {
  if (forbiddenTrackedFiles.some((pattern) => pattern.test(file))) {
    failures.push(`${file}: environment or credential file must not be tracked`)
    continue
  }

  let content
  try {
    content = readFileSync(file, 'utf8')
  } catch {
    continue
  }

  for (const { label, pattern } of secretPatterns) {
    pattern.lastIndex = 0
    if (pattern.test(content)) failures.push(`${file}: possible ${label}`)
  }
}

if (failures.length) {
  console.error('Security check failed:')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log(`Security check passed across ${candidateFiles.length} repository files.`)
