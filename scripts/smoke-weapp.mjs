import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { setTimeout as delay } from 'node:timers/promises'

const require = createRequire(import.meta.url)
const output = new URL('../dist-weapp/', import.meta.url)
const read = (path) => readFileSync(new URL(path, output), 'utf8')
const route = 'pages/index/index'
const project = JSON.parse(read('project.config.json'))
assert.equal(project.compileType, 'miniprogram')
assert.equal(project.miniprogramRoot, './')
assert.equal(project.appid, process.env.TARO_APP_ID || undefined)
assert.deepEqual(JSON.parse(read('app.json')).pages, [route])
assert.match(read('app.wxss'), /@import ['"](?:\.\/)?app-origin\.wxss['"]/)
assert.match(read('app-origin.wxss'), /page\s*\{/)
assert.equal(JSON.parse(read(route + '.json')).usingComponents.comp, '../../comp')
assert.match(read(route + '.wxml'), /<template is="taro_tmpl"/)
assert.match(read(route + '.wxss'), /\.weapp-shell/)

let app
let config
let stored = ''
let confirmReset = false
let fastSpin = false
let updateReady
let updateFailed
let updatePrompt
let appliedUpdates = 0
const key = 'today-eat-what.menu.v1'
const preferenceKey = 'today-eat-what.fast-spin'
const viewport = () => ({ windowWidth: 390, windowHeight: 760, pixelRatio: 2 })
globalThis.wx = {
  getWindowInfo: viewport,
  getSystemInfoSync: viewport,
  getStorageSync(name) {
    if (name === preferenceKey) return fastSpin
    assert.equal(name, key)
    return stored
  },
  setStorageSync(name, value) {
    if (name === preferenceKey) {
      fastSpin = value
    } else {
      assert.equal(name, key)
      stored = value
    }
  },
  getAccountInfoSync: () => ({ miniProgram: { envVersion: 'release', version: '9.8.7' } }),
  getUpdateManager: () => ({
    onUpdateReady: (callback) => { assert.equal(updateReady, undefined); updateReady = callback },
    onUpdateFailed: (callback) => { assert.equal(updateFailed, undefined); updateFailed = callback },
    applyUpdate: () => { appliedUpdates++ },
  }),
  pageScrollTo: ({ success }) => success?.({}),
  showModal(options) {
    if (options.title === '有新版本') {
      assert.equal(updatePrompt, undefined)
      updatePrompt = options
    } else {
      options.success?.({ confirm: confirmReset })
    }
  },
}
const page = {
  route,
  data: { root: { cn: [] } },
  setData(patch, done) {
    for (const [path, value] of Object.entries(patch)) {
      const parts = path.replaceAll(/\[(\d+)\]/g, '$1').split('.')
      const property = parts.pop()
      const parent = parts.reduce((node, part) => node[part], this.data)
      parent[property] = structuredClone(value)
    }
    done?.()
  },
}
globalThis.getCurrentPages = () => [page]
globalThis.App = (options) => { app = options; app.onLaunch({ path: route, query: {} }) }
globalThis.getApp = () => app
globalThis.Page = (options) => { config = options }

require('../dist-weapp/app.js')
require('../dist-weapp/' + route + '.js')

const flatten = (nodes) => nodes.flatMap((node) => node ? [node, ...flatten(node.cn ?? [])] : [])
const elements = (className) => flatten(page.data.root.cn).filter((node) => node.cl?.split(' ').includes(className))
const textOf = (node) => flatten([node]).map((item) => item.v ?? '').join('')
const text = (className) => textOf(elements(className)[0])
const dispatch = (className, type, detail = {}, index = 0) => {
  const node = elements(className)[index]
  assert.ok(node, 'Missing WeChat control: ' + className)
  const target = { id: node.sid, dataset: { sid: node.sid } }
  config.eh.call(page, { type, target, currentTarget: target, detail })
}
const tap = (className) => dispatch(className, 'tap')
async function waitFor(check, label, timeout = 2000) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    if (check()) return
    await delay(10)
  }
  assert.fail('WeChat view data did not update: ' + label)
}
async function openPage() {
  config.onLoad.call(page, {})
  config.onShow.call(page)
  await waitFor(() => elements('primary-button').length, 'page entry')
}
function closePage() {
  config.onUnload.call(page)
  page.data = { root: { cn: [] } }
}

await waitFor(() => typeof updateReady === 'function' && typeof updateFailed === 'function', 'app launch update listeners')
assert.equal(updatePrompt, undefined)
await openPage()
assert.equal(elements('meal-row').length, 10)
assert.equal(text('app-version'), '正式版 v9.8.7')
const share = config.onShareAppMessage.call(page, { from: 'menu' })
assert.deepEqual(share, {
  title: '今天吃什么 · 用转盘决定',
  path: '/' + route,
  imageUrl: '/assets/weapp-share.png',
})
const shareCover = readFileSync(new URL(share.imageUrl.slice(1), output))
assert.equal(shareCover.subarray(1, 4).toString(), 'PNG')
assert.deepEqual([shareCover.readUInt32BE(16), shareCover.readUInt32BE(20)], [600, 480])
closePage()

stored = JSON.stringify({
  version: 1,
  items: [{ id: 'test-pick', shop: '测试店铺', dish: '测试菜品', area: '测试区域', note: ' personal note ', enabled: true }],
})
await openPage()
assert.equal(elements('meal-row').length, 1)
tap('meal-details')
await waitFor(() => text('form-message').includes('正在编辑'), 'edit existing meal')
dispatch('meal-input', 'input', { value: '修改后的备注' }, 3)
tap('add-button')
await waitFor(() => JSON.parse(stored).items[0].note === '修改后的备注', 'save edited note')
tap('primary-button')
await waitFor(() => text('result-label') === '正在为你挑选', 'spin in progress')
assert.equal(elements('winner-dialog').length, 0)
assert.match(elements('wheel-disc')[0].st, /transition-duration: 4200ms/)
await waitFor(() => elements('winner-dialog').length, 'winner after spin', 6000)
assert.equal(text('winner-dish'), '测试菜品')
assert.equal(text('winner-note'), '修改后的备注')
tap('winner-confirm')
await waitFor(() => !elements('winner-dialog').length, 'dismiss dialog')

tap('mode-toggle')
await waitFor(() => text('mode-check') === '✓', 'skip animation')
tap('primary-button')
await waitFor(() => elements('winner-dialog').length, 'winner dialog')
assert.equal(text('winner-dish'), '测试菜品')
assert.equal(text('winner-shop'), '测试区域 · 测试店铺')
assert.equal(text('winner-note'), '修改后的备注')
tap('winner-confirm')
await waitFor(() => !elements('winner-dialog').length, 'dismiss dialog')
tap('toggle-button')
await waitFor(() => JSON.parse(stored).items[0].enabled === false, 'persist enabled state')
assert.match(elements('primary-button')[0].cl, /is-disabled/)
tap('toggle-button')
await waitFor(() => JSON.parse(stored).items[0].enabled === true, 're-enable candidate')
tap('remove-button')
await waitFor(() => elements('empty-list').length, 'remove last dish')
assert.deepEqual(JSON.parse(stored).items, [])
closePage()

await openPage()
assert.equal(elements('meal-row').length, 0)
assert.match(elements('primary-button')[0].cl, /is-disabled/)
tap('reset-button')
assert.deepEqual(JSON.parse(stored).items, [])
confirmReset = true
tap('reset-button')
await waitFor(() => elements('meal-row').length === 10, 'confirm restore of recommendations')
dispatch('meal-input', 'input', { value: ' 新店铺 ' }, 0)
dispatch('meal-input', 'input', { value: '新菜品' }, 1)
dispatch('meal-input', 'input', { value: '新区域' }, 2)
tap('add-button')
await waitFor(() => elements('meal-row').length === 11 && JSON.parse(stored).items.length === 11, 'add and persist candidate')
const { id, ...added } = JSON.parse(stored).items.at(-1)
assert.ok(id)
assert.deepEqual(added, { shop: '新店铺', dish: '新菜品', area: '新区域', note: '', enabled: true })
closePage()

await openPage()
assert.equal(textOf(elements('meal-dish').at(-1)), '新菜品')
assert.equal(text('mode-check'), '✓', 'saved spin preference must survive reopening')
const menuBeforeUpdate = stored
const pendingUpdate = updateReady()
assert.equal(appliedUpdates, 0, 'must wait for confirmation')
assert.equal(updatePrompt.confirmText, '立即更新')
assert.equal(updatePrompt.cancelText, '稍后更新')
updatePrompt.success({ confirm: true })
await pendingUpdate
assert.equal(appliedUpdates, 1, 'apply confirmed update')
assert.equal(stored, menuBeforeUpdate)
assert.equal(fastSpin, true)
closePage()

await openPage()
assert.equal(textOf(elements('meal-dish').at(-1)), '新菜品')
assert.equal(text('mode-check'), '✓')
closePage()
console.log('PASS WeChat bundle: native launch, version footer, confirmed update, share, draw, and local data (mock wx APIs)')
