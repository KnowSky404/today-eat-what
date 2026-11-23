import { spawnSync } from 'node:child_process'
import { generateKeyPairSync } from 'node:crypto'
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, expect, test } from 'vitest'

const appid = 'wx0000000000000000'
const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
const privateKeyPem = privateKey.export({ type: 'pkcs8', format: 'pem' })
const { scripts } = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'))
let fixture
let repo
let keyPath

beforeEach(() => {
  fixture = mkdtempSync(join(tmpdir(), 'weapp-release-test-'))
  repo = join(fixture, 'repo')
  keyPath = join(fixture, 'upload.pem')
  const tools = join(repo, 'tools/weapp')
  const sdk = join(tools, 'node_modules/miniprogram-ci')
  mkdirSync(sdk, { recursive: true })
  mkdirSync(join(repo, 'dist-weapp'))
  copyFileSync(new URL('./release.mjs', import.meta.url), join(tools, 'release.mjs'))
  writeFileSync(keyPath, privateKeyPem, { mode: 0o600 })
  writeFileSync(join(repo, '.env.local'), `TARO_APP_ID=${appid}\nWEAPP_PRIVATE_KEY_PATH=${JSON.stringify(keyPath)}\nWEAPP_VERSION=" 0.1.0 "\n`)
  writeFileSync(join(repo, 'package.json'), JSON.stringify({ scripts: {
    'build:weapp': 'node build.mjs',
    'upload:weapp': scripts['upload:weapp'],
    'preview:weapp': scripts['preview:weapp'],
  } }))
  writeFileSync(join(repo, 'build.mjs'), `
    import assert from 'node:assert/strict'
    import { writeFileSync } from 'node:fs'
    assert.equal(process.env.NODE_ENV, 'production')
    if (process.env.WEAPP_TEST_BUILD === 'skip') process.exit(0)
    writeFileSync('dist-weapp/project.config.json', JSON.stringify({
      appid: process.env.WEAPP_TEST_BUILD === 'mismatch' ? 'wx1111111111111111' : process.env.TARO_APP_ID,
      miniprogramRoot: './',
      compileType: 'miniprogram',
    }))
  `)
  writeFileSync(join(sdk, 'index.js'), `
    const assert = require('node:assert/strict')
    const { realpathSync, writeFileSync } = require('node:fs')
    exports.Project = function ({ appid, privateKeyPath }) {
      assert.equal(appid, process.env.TARO_APP_ID)
      assert.equal(privateKeyPath, realpathSync(process.env.WEAPP_PRIVATE_KEY_PATH))
    }
    exports.upload = async ({ version }) => assert.equal(version, '0.1.0')
    exports.preview = async ({ qrcodeFormat, qrcodeOutputDest }) => {
      assert.equal(qrcodeFormat, 'image')
      if (!process.env.WEAPP_TEST_NO_QR) writeFileSync(qrcodeOutputDest, 'mock QR image')
    }
  `)
})

afterEach(() => rmSync(fixture, { recursive: true, force: true }))

function run(action, overrides = {}) {
  const result = spawnSync('bun', ['run', action + ':weapp'], {
    cwd: repo,
    env: {
      ...process.env,
      NODE_ENV: 'development',
      TARO_APP_ID: undefined,
      WEAPP_PRIVATE_KEY_PATH: undefined,
      WEAPP_VERSION: undefined,
      ...overrides,
    },
    encoding: 'utf8',
    timeout: 5000,
  })
  if (result.error) throw result.error
  return result
}

test('uses local environment and an external key for preview and upload', () => {
  const preview = run('preview')
  expect(preview.status, preview.stderr).toBe(0)
  expect(readFileSync(join(repo, 'artifacts/weapp/preview.jpg'), 'utf8')).toBe('mock QR image')
  const upload = run('upload')
  expect(upload.status, upload.stderr).toBe(0)
  expect(upload.stdout).toContain('开发版本 0.1.0 已上传')
})

test('rejects a link to a private key inside the repository', () => {
  const link = join(fixture, 'repo-link')
  copyFileSync(keyPath, join(repo, 'upload.pem'))
  symlinkSync(repo, link, 'junction')
  const result = run('upload', { WEAPP_PRIVATE_KEY_PATH: join(link, 'upload.pem') })
  expect(result.status).toBe(1)
  expect(result.stderr).toContain('请将上传私钥保存在仓库外')
})

test('does not report an old preview QR code as current', () => {
  expect(run('preview').status).toBe(0)
  const missing = run('preview', { WEAPP_TEST_NO_QR: '1' })
  expect(missing.status).toBe(1)
  expect(missing.stderr).toContain('微信 CI 未生成预览二维码文件')
})

test('rejects stale and mismatched project configurations before uploading', () => {
  expect(run('upload').status).toBe(0)
  const stale = run('upload', { WEAPP_TEST_BUILD: 'skip' })
  expect(stale.status).toBe(1)
  expect(stale.stderr).toContain('生产构建未生成有效的')
  const mismatch = run('upload', { WEAPP_TEST_BUILD: 'mismatch' })
  expect(mismatch.status).toBe(1)
  expect(mismatch.stderr).toContain('构建产物的小程序配置与本次发布配置不一致')
})
