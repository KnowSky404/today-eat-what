import { execFileSync, spawnSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

const documentation = new Set(['README.md', 'README.en.md', 'docs/architecture.md'])
const revision = /^[0-9a-f]{40}$/

export function scopeForPaths(paths) {
  return paths.every((path) => documentation.has(path)) ? 'docs' : 'full'
}

export function scopeForRevision(base, head) {
  if (!revision.test(base) || !revision.test(head)) return 'full'
  const ancestor = spawnSync('git', ['merge-base', '--is-ancestor', base, head])
  if (ancestor.status !== 0) return 'full'

  const diff = spawnSync('git', ['diff', '--no-renames', '--name-only', '-z', base, head], { encoding: 'utf8' })
  if (diff.status !== 0) return 'full'
  return scopeForPaths(diff.stdout.split('\0').slice(0, -1))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [base, head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()] = process.argv.slice(2)
  console.log(scopeForRevision(base, head))
}
