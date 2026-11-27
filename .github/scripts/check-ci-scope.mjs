import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { test } from 'node:test'
import { scopeForPaths, scopeForRevision } from './ci-scope.mjs'

test('only allowlisted documentation can skip full CI', () => {
  assert.equal(scopeForPaths(['README.md', 'docs/architecture.md']), 'docs')
  for (const path of [
    'src/pages/index/index.css',
    'src/domain/menu.ts',
    'src/services/menu-storage.ts',
    'bun.lock',
    'wrangler.jsonc',
    'AGENTS.md',
    '.github/workflows/ci.yml',
    'docs/development-workflow.md',
    'docs/weapp-release-checklist.md',
    'docs/cloudflare-workers-builds.md',
    'unknown.md',
  ]) {
    assert.equal(scopeForPaths(['README.md', path]), 'full', path)
  }
})

test('missing or invalid Git evidence forces full CI', () => {
  const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
  assert.equal(scopeForRevision(head, head), 'docs')
  assert.equal(scopeForRevision('0'.repeat(40), head), 'full')
  assert.equal(scopeForRevision('--help', head), 'full')
})
