// Captures the real CareerHive screens used by the book, the mockups and the social kit.
// Run the UI in demo mode first (no VITE_API_URL: the built-in demo data, no real accounts), e.g. on port 5199, then:
//   node presentation/source/capture.mjs [http://localhost:5199]
// Output: presentation/assets/screenshots/*.jpg (2x, quality 90)
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const ui = path.resolve(here, '../../careerhive-ui')
const { chromium } = createRequire(path.join(ui, 'package.json'))('playwright')
const BASE = process.argv[2] ?? 'http://localhost:5199'
const OUT = path.resolve(here, '../assets/screenshots')
fs.mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const CLEAN = '.cg, .portal-pop { display: none !important } * { caret-color: transparent !important }'
const saved = []

async function open({ theme = 'frost', width = 1440, height = 900, scale = 2, mobile = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale, isMobile: mobile, hasTouch: mobile })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => console.log('  [pageerror]', e.message))
  await page.addInitScript((t) => { try { localStorage.clear(); localStorage.setItem('ch_theme_v2', t) } catch { /* */ } }, theme)
  await page.goto(BASE)
  await page.addStyleTag({ content: CLEAN })
  await page.waitForSelector('.splash', { state: 'detached', timeout: 60000 }).catch(() => {})
  return page
}
async function signIn(page, who) {
  await page.waitForSelector('form button.btn', { timeout: 60000 })
  await page.locator('input[type=email]').first().fill(`${who}@careerhive.tn`)
  await page.locator('input[type=password]').first().fill('demo1234')
  await page.locator('form button.btn').first().click()
  await page.waitForSelector('.sidebar', { timeout: 60000 })
  await page.addStyleTag({ content: CLEAN })
}
const go = async (page, route, settle = 2200) => {
  await page.evaluate((r) => { history.pushState({}, '', r); dispatchEvent(new PopStateEvent('popstate')) }, route)
  await page.waitForTimeout(settle)
  await page.mouse.move(2, 2)
}
async function shot(page, name, opts = {}) {
  await page.waitForTimeout(opts.wait ?? 400)
  const file = path.join(OUT, `${name}.jpg`)
  if (opts.selector) await page.locator(opts.selector).first().screenshot({ path: file, type: 'jpeg', quality: 90 })
  else await page.screenshot({ path: file, type: 'jpeg', quality: 90, fullPage: !!opts.full, clip: opts.clip })
  saved.push(name)
  console.log('  saved', name)
}

// ---------- sign-in (with the portal intro finished), per theme ----------
for (const theme of ['frost', 'ember']) {
  const page = await open({ theme })
  await page.waitForTimeout(9000) // the mascot's portal entrance
  await page.mouse.move(1100, 420) // Rick looks toward the form
  await page.waitForTimeout(800)
  await shot(page, `login-${theme}`)
  await page.context().close()
}

// ---------- loading screen ----------
{
  const page = await open()
  await page.reload()
  await page.addStyleTag({ content: CLEAN })
  await page.waitForSelector('.splash-mark canvas', { timeout: 30000 })
  await page.waitForTimeout(1500)
  if (await page.locator('.splash').count()) await shot(page, 'splash', { wait: 0 })
  await page.context().close()
}

// ---------- employee ----------
{
  const page = await open()
  await signIn(page, 'amine')
  await page.waitForTimeout(7000)
  await page.mouse.move(2, 2)
  await shot(page, 'dashboard-employee')
  await shot(page, 'dashboard-employee-full', { full: true })

  await go(page, '/formations?tab=catalog', 2600)
  await shot(page, 'formations-catalog')
  // a formation cover, reused as the photo of a demo post
  const coverFile = path.join(OUT, '_post-photo.png')
  await page.locator('.form-card').nth(1).locator('.cover').first().screenshot({ path: coverFile }).catch(async () => {
    await page.locator('.form-card').nth(1).screenshot({ path: coverFile })
  })
  await go(page, '/formations?tab=mine&open=1', 3200)
  await shot(page, 'formation-drawer')
  await go(page, '/formations?tab=mine', 2400)
  await shot(page, 'formations-mine')

  await go(page, '/promotion', 2600)
  await shot(page, 'promotion')
  await go(page, '/skills', 3200)
  await shot(page, 'skills')
  await go(page, '/profile', 2600)
  await shot(page, 'profile')
  await go(page, '/team', 2600)
  const convo = page.locator('.mconv').first()
  if (await convo.count()) { await convo.click().catch(() => {}); await page.waitForTimeout(1200) }
  await shot(page, 'team-hub')

  // feed: a post with a photo, a like and an open comment thread
  await go(page, '/feed', 2600)
  await page.locator('.composer textarea').fill('Earned the HashiCorp Terraform Associate certificate today.\nNext stop: the Observability with Grafana formation.')
  await page.locator('.composer input[type=file]').setInputFiles(coverFile)
  await page.waitForSelector('.composer-img img')
  await page.locator('.composer .composer-bar .btn').click()
  await page.waitForSelector('.post .post-img img', { timeout: 20000 })
  await page.waitForTimeout(3600) // the toast fades
  const second = page.locator('.post').nth(1)
  await second.locator('.post-act').first().click()
  await second.locator('.post-act').nth(1).click()
  await page.waitForTimeout(1200)
  await page.evaluate(() => document.querySelector('.scroll')?.scrollTo(0, 0))
  await page.mouse.move(2, 2)
  await shot(page, 'feed')
  await go(page, '/u/3', 2600)
  await shot(page, 'public-profile')

  await go(page, '/', 2600)
  await page.locator('.topbar button').filter({ has: page.locator('.ic-bell') }).first().click().catch(() => {})
  await page.waitForTimeout(1200)
  await shot(page, 'notifications')
  await page.context().close()
}

// ---------- manager ----------
{
  const page = await open()
  await signIn(page, 'manager')
  await page.waitForTimeout(8000)
  await page.mouse.move(2, 2)
  await shot(page, 'dashboard-manager')
  await page.evaluate(() => document.querySelector('.kpis')?.scrollIntoView({ block: 'start' }))
  await page.waitForTimeout(2200)
  await shot(page, 'org-panel')
  await go(page, '/reviews', 2600)
  const card = page.locator('.review .review-head').first()
  if (await card.count()) { await page.waitForTimeout(300) }
  await shot(page, 'reviews')
  await go(page, '/teams', 2600)
  await shot(page, 'teams')
  await go(page, '/formations?open=2', 3000)
  await shot(page, 'formation-manage')
  await page.context().close()
}

// ---------- themes ----------
for (const theme of ['ember', 'light']) {
  const page = await open({ theme })
  await signIn(page, 'amine')
  await page.waitForTimeout(7000)
  await page.mouse.move(2, 2)
  await shot(page, `dashboard-employee-${theme}`)
  await page.context().close()
}

// ---------- tablet and mobile ----------
for (const [label, w, h] of [['tablet', 834, 1112], ['mobile', 390, 844]]) {
  const page = await open({ width: w, height: h, scale: label === 'mobile' ? 3 : 2, mobile: label === 'mobile' })
  await page.waitForTimeout(6000)
  await shot(page, `login-${label}`)
  await signIn(page, 'amine')
  await page.waitForTimeout(6500)
  await shot(page, `dashboard-${label}`)
  await go(page, '/feed', 2600)
  await shot(page, `feed-${label}`)
  await go(page, '/formations?tab=catalog', 2600)
  await shot(page, `formations-${label}`)
  await page.context().close()
}

await browser.close()
fs.rmSync(path.join(OUT, '_post-photo.png'), { force: true })
console.log(`done: ${saved.length} screenshots in ${OUT}`)
