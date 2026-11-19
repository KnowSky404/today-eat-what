import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { join, extname, resolve, sep } from 'node:path'
import { chromium, firefox } from 'playwright'

const root = resolve('dist')
const base = '/today-eat-what/'
const types = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' }
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
    if (!pathname.startsWith(base)) { res.writeHead(404).end(); return }
    const relative = pathname.slice(base.length)
    const target = resolve(root, relative || 'index.html')
    if (target !== root && !target.startsWith(root + sep)) { res.writeHead(403).end(); return }
    if (!(await stat(target)).isFile()) { res.writeHead(404).end(); return }
    res.setHeader('Content-Type', types[extname(target)] || 'application/octet-stream')
    res.end(await readFile(target))
  } catch (error) {
    res.writeHead(error?.code === 'ENOENT' ? 404 : 500).end(String(error))
  }
})

await new Promise((done) => server.listen(0, '127.0.0.1', done))
const address = server.address()
const url = `http://127.0.0.1:${address.port}${base}`
let failures = 0

try {
  for (const engine of [chromium, firefox]) {
    let browser
    let page
    const logs = []
    const errors = []
    try {
      browser = await engine.launch({ headless: true })
      page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
      page.on('pageerror', (error) => errors.push(`pageerror: ${error.stack || error.message}`))
      page.on('console', (message) => { logs.push(message.type()+': '+message.text()); if (message.type() === 'error') errors.push('console: ' + message.text()) })
      page.on('response', (response) => { if (response.status() >= 400) errors.push(`HTTP ${response.status()}: ${response.url()}`) })
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
      await page.locator('.hero-title').waitFor({ timeout: 10000 })
      assert.match(await page.locator('body').innerText(), /今天中午/)
      assert.equal(await page.locator('.meal-row').count(), 12, 'demo meals must render')
      await page.locator('.primary-button').click()
      await page.locator('.result-title').filter({ hasNotText: /惊喜正在路上/ }).waitFor({ timeout: 7500 })
      await page.setViewportSize({ width: 390, height: 844 })
      await page.reload({ waitUntil: 'networkidle' })
      await page.locator('.hero-title').waitFor({ timeout: 10000 })
      assert.equal(await page.locator('.meal-row').count(), 12, 'mobile reload should still render')
      assert.equal(errors.length, 0, errors.join('\n'))
      console.log(`PASS ${engine.name()} H5: desktop and mobile mounted, seeded, spin completed, no browser errors`)
    } catch (error) {
      failures++
      console.error(`FAIL ${engine.name()}: ${error.stack || error}`)
      if (errors.length) console.error(errors.join('\n'))
      console.error('BROWSER LOGS ' + logs.join(' | '))
      if (page) {
        try {
          console.error('DIAGNOSTICS ' + JSON.stringify(await page.evaluate(() => ({
            url: location.href,
            title: document.title,
            bodyText: document.body?.innerText.slice(0, 400),
            app: document.getElementById('app')?.outerHTML.slice(0, 3000),
            scripts: Array.from(document.scripts).map(s => ({src: s.src, type: s.type, text: s.textContent.slice(0,200)})),
            resources: performance.getEntriesByType('resource').map(r => r.name).filter(x => x.includes('/js/') || x.includes('/css/')),
            routes: Array.from(document.querySelectorAll('.taro_page, .taro-page, taro-page, .taro_router')).map(e=>({tag:e.tagName, cls:e.className, children:e.children.length})),
          }))))
        } catch (e) { console.error('Diagnostic collection failed: ' + e.message) }
      }
    } finally {
      await browser?.close()
    }
  }
} finally {
  await new Promise((done) => server.close(done))
}

if (failures) process.exitCode = 1
