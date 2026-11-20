import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile, stat, mkdir } from 'node:fs/promises'
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


// Layout regression checks: DOM presence alone allowed the first public release
// to show a 500px-wide "参与" button and one-character-per-line dish names.
async function assertLayout(page, width, engine) {
  await page.setViewportSize({ width, height: 900 })
  await page.locator('.meal-row').first().waitFor()
  const layout = await page.evaluate(() => {
    const box = (selector) => {
      const element = document.querySelector(selector)
      if (!element) throw new Error('Missing ' + selector)
      const r = element.getBoundingClientRect()
      return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom }
    }
    const dish = document.querySelector('.meal-row .meal-dish')
    const button = document.querySelector('.meal-row .toggle-button')
    const row = box('.meal-row')
    return {
      viewport: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      card: box('.list-card'),
      wheel: box('.wheel-card'),
      sidebar: box('.sidebar'),
      row,
      details: box('.meal-row .meal-details'),
      dish: box('.meal-row .meal-dish'),
      toggle: box('.meal-row .toggle-button'),
      remove: box('.meal-row .remove-button'),
      primary: box('.primary-button'),
      listHeading: box('.list-heading'),
      kicker: box('.list-heading .section-kicker'),
      dishLineHeight: parseFloat(getComputedStyle(dish).lineHeight) || 20,
      buttonWhiteSpace: getComputedStyle(button).whiteSpace,
      addButtonColor: getComputedStyle(document.querySelector('.add-button')).color,
      addButtonTextColor: getComputedStyle(document.querySelector('.add-button').querySelector('span') || document.querySelector('.add-button')).color,
      addButtonOpacity: parseFloat(getComputedStyle(document.querySelector('.add-button')).opacity),

    }
  })
  assert.ok(layout.scrollWidth <= width + 3, `${engine} ${width}px horizontal overflow: ${JSON.stringify(layout)}`)
  assert.ok(layout.details.width >= (width <= 390 ? 70 : 125), `${engine} ${width}px squashed dish: ${JSON.stringify(layout)}`)
  assert.ok(layout.dish.height <= layout.dishLineHeight * 1.5, `${engine} ${width}px vertical dish: ${JSON.stringify(layout)}`)
  assert.ok(layout.toggle.width >= 48 && layout.toggle.width <= 72, `${engine} ${width}px oversized toggle: ${JSON.stringify(layout)}`)
  assert.ok(layout.remove.width <= 48, `${engine} ${width}px oversized delete: ${JSON.stringify(layout)}`)
  assert.ok(layout.primary.width <= 320, `${engine} ${width}px oversized spin button: ${JSON.stringify(layout)}`)
  assert.equal(layout.addButtonColor, 'rgb(41, 85, 62)', `${engine} ${width}px add button contrast: ${JSON.stringify(layout)}`)
  assert.equal(layout.addButtonTextColor, 'rgb(41, 85, 62)', `${engine} ${width}px add button inner text contrast: ${JSON.stringify(layout)}`)
  assert.ok(layout.addButtonOpacity >= .9, `${engine} ${width}px add button unexpectedly disabled/transparent: ${JSON.stringify(layout)}`)
  assert.ok(layout.kicker.height <= 24, `${engine} ${width}px wrapped list kicker: ${JSON.stringify(layout)}`)
  if (width > 780) {
    assert.ok(layout.sidebar.x >= layout.wheel.right + 10, `${engine} ${width}px columns overlap: ${JSON.stringify(layout)}`)
  } else {
    assert.ok(layout.sidebar.y >= layout.wheel.bottom, `${engine} ${width}px mobile cards overlap: ${JSON.stringify(layout)}`)
  }
  if ([390, 768, 1680].includes(width)) {
    await page.screenshot({ path: `artifacts/layout/${engine}-${width}.png`, fullPage: true })
    if (width === 390 || width === 768) {
      await page.locator('.list-card').scrollIntoViewIfNeeded()
      await page.screenshot({ path: `artifacts/layout/${engine}-${width}-menu.png`, fullPage: false })
    }
  }
  console.log(`PASS layout ${engine} ${width}px: dish=${Math.round(layout.details.width)}px toggle=${Math.round(layout.toggle.width)}px`)
}

await mkdir('artifacts/layout', { recursive: true })
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
      for (const width of [320, 390, 768, 1024, 1440, 1680, 1920]) {
        await assertLayout(page, width, engine.name())
      }
      assert.equal(errors.length, 0, errors.join('\n'))
      console.log(`PASS ${engine.name()} H5: mounted, seeded, spun, 7 viewports checked, no browser errors`)
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
