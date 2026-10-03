// Builds the publication from source:  node presentation/source/build.mjs [book|graphics|social|mockups|overlays|all]
//   book      → source/book.html, pdf/CareerHive-Project-Book.pdf, pages/page-NN.jpg
//   graphics  → graphics/*.png (diagrams cut from the book pages)
//   social    → social/** (LinkedIn, Instagram, GitHub, portfolio)
//   mockups   → mockups/*.png
//   overlays  → video/overlays/*.png (transparent)
// Screenshots come from capture.mjs (run the UI in demo mode first).
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { buildBook } from './book.mjs'
import { content, doc, here, playwright, root } from './lib.mjs'

const what = process.argv[2] ?? 'all'
const want = (k) => what === 'all' || what === k
const browser = await playwright.chromium.launch({ channel: 'chrome' })
const QR = Object.values({ github: content.github, demo: content.demo, contact: content.contact }).some(Boolean)
  ? `<script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js"></script>
     <script>addEventListener('DOMContentLoaded',()=>document.querySelectorAll('[data-qr]').forEach((el)=>{const q=qrcode(0,'M');q.addData(el.dataset.qr);q.make();el.innerHTML=q.createSvgTag({cellSize:3,margin:0,scalable:true})}))</script>`
  : ''

/** Write an HTML file into source/ and open it at a given viewport; resolves once fonts and images are ready. */
async function openHtml(file, html, viewport) {
  const full = path.join(here, file)
  fs.writeFileSync(full, html.replace('</head>', `${QR}</head>`))
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 })
  await page.goto(pathToFileURL(full).href, { waitUntil: 'networkidle' })
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map((i) => i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r }))) })
  return page
}
export { openHtml }

if (want('book')) {
  const pages = buildBook()
  const page = await openHtml('book.html', doc('CareerHive — Project book', pages), { width: 1920, height: 1080 })
  fs.mkdirSync(path.join(root, 'pdf'), { recursive: true })
  await page.pdf({ path: path.join(root, 'pdf/CareerHive-Project-Book.pdf'), width: '1920px', height: '1080px', printBackground: true, preferCSSPageSize: true })
  const dir = path.join(root, 'pages')
  fs.mkdirSync(dir, { recursive: true })
  for (let i = 1; i <= pages.length; i++) {
    await page.locator(`#p${i}`).screenshot({ path: path.join(dir, `page-${String(i).padStart(2, '0')}.jpg`), type: 'jpeg', quality: 90 })
  }
  await page.close()
  const mb = (fs.statSync(path.join(root, 'pdf/CareerHive-Project-Book.pdf')).size / 1048576).toFixed(1)
  console.log(`book: ${pages.length} pages · PDF ${mb} MB · page images in pages/`)
}

if (['graphics', 'social', 'mockups', 'overlays'].some(want)) {
  const kit = await import('./kit.mjs')
  await kit.run({ want, openHtml, browser })
}

await browser.close()
