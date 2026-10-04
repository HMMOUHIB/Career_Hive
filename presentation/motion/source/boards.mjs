// Storyboard boards: key frames decoded from the rendered films, laid out with their time and scene, in the product's
// fonts. Run after render.mjs:  node presentation/motion/source/boards.mjs  → storyboard/*.png
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { esc, motionRoot, presRoot } from './toolkit.mjs'

const playwright = createRequire(path.resolve(presRoot, '../careerhive-ui/package.json'))('playwright')
const ffmpeg = process.env.FFMPEG || 'ffmpeg'

const BOARDS = {
  master: { file: 'CareerHive-Master-16x9', cols: 4, title: 'Master · 16:9 · 60 s', frames: [
    [1.6, 'Signal', 'the hive grows around one light'], [3.6, 'Wordmark', 'letters rise inside a hexagon'], [6.3, 'Promise', 'your career, your next move'],
    [8.6, 'Problem', 'one word per beat, with its echo'], [11.0, 'Problem', 'the dashboard in pieces'], [13.7, 'Solution', 'the cards click back together'],
    [16.3, 'Hero shot', 'layers lift, numbers count'], [21.0, '01 Learn', 'the card becomes its course'], [24.3, '02 Prove', 'the manager approves'],
    [29.6, '03 Live', 'notifications arrive'], [34.8, '04 Connect', 'chat and feed'], [40.5, '05 CV coach', 'the plan and its matches'],
    [43.5, '06 Skills', 'radar opens, activity draws'], [47.4, '07 Grow', 'requirements light up'], [50.8, 'Converge', 'Learn. Prove. Grow.'], [57.0, 'End card', 'Grow on purpose.'],
  ] },
  portfolio: { file: 'CareerHive-Portfolio-16x9', cols: 4, title: 'Portfolio · 16:9 · 48 s', frames: [
    [3.6, 'Wordmark', ''], [9.4, 'Problem', ''], [16.3, 'Solution', ''], [21.0, '01 Learn', ''],
    [24.3, '02 Prove', ''], [30.6, '03 CV coach', ''], [34.0, '04 Skills', ''], [39.6, 'Under the hood', 'stack, live push, tests'],
  ] },
  teaser: { file: 'CareerHive-Teaser-16x9', cols: 4, title: 'Teaser · 16:9 · 25.5 s', frames: [
    [1.6, 'Signal', ''], [3.6, 'Wordmark', ''], [7.5, '01 Prove', ''], [12.6, '02 Live', ''],
    [16.3, '03 CV coach', 'scan'], [19.0, '03 CV coach', 'plan'], [21.5, 'End card', ''], [24.2, 'End card', 'URL + credit'],
  ] },
  social: { file: 'CareerHive-Social-9x16', cols: 9, title: 'Social · 9:16 · 24 s', frames: [
    [1.6, 'Wordmark', ''], [3.9, 'Promise', ''], [6.3, 'Learn.', ''], [8.7, 'Prove.', ''], [11.4, 'Live.', ''],
    [13.6, 'Your CV.', ''], [16.1, 'Grow.', ''], [18.5, 'Together.', ''], [22.6, 'End card', ''],
  ] },
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'careerhive-boards-'))
const out = path.join(motionRoot, 'storyboard')
fs.mkdirSync(out, { recursive: true })
const browser = await playwright.chromium.launch({ channel: 'chrome' })
try {
  for (const [name, b] of Object.entries(BOARDS)) {
    const video = path.join(motionRoot, 'video', `${b.file}.mp4`)
    const tall = name === 'social', fw = tall ? 300 : 440, fh = tall ? 533 : 248
    const cells = b.frames.map(([t, scene, note], i) => {
      const png = path.join(tmp, `${name}-${i}.png`)
      execFileSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-ss', String(t), '-i', video, '-frames:v', '1', png])
      return `<figure><img src="${pathToFileURL(png).href}" style="width:${fw}px;height:${fh}px"><figcaption><b>${t.toFixed(1)} s</b><span>${esc(scene)}</span>${note ? `<i>${esc(note)}</i>` : ''}</figcaption></figure>`
    }).join('')
    const html = `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,800&family=Onest:wght@400;600&family=Martian+Mono:wght@500&display=swap">
<style>*{margin:0;box-sizing:border-box}body{background:#f5f8fc;font-family:Onest,sans-serif;color:#0e1a2f;padding:56px 60px 60px;display:inline-block}
header{display:flex;align-items:baseline;gap:24px;margin-bottom:34px}h1{font:800 46px/1 'Bricolage Grotesque';letter-spacing:-.04em}h1 em{font-style:normal;background:linear-gradient(100deg,#5fb2ff,#2f7bf6 48%,#1c3fc9);-webkit-background-clip:text;color:transparent}
header span{font:500 14px/1 'Martian Mono';letter-spacing:.24em;text-transform:uppercase;color:#2f7bf6}
main{display:grid;grid-template-columns:repeat(${b.cols},${fw}px);gap:28px 24px}figure img{display:block;border-radius:14px;box-shadow:0 1px 2px rgba(15,35,75,.08),0 18px 36px -18px rgba(30,60,120,.45)}
figcaption{display:grid;grid-template-columns:auto 1fr;column-gap:12px;margin-top:12px;align-items:baseline}figcaption b{font:500 12px/1 'Martian Mono';letter-spacing:.14em;color:#2f7bf6}
figcaption span{font:600 17px/1.2 Onest}figcaption i{grid-column:2;font-style:normal;font-size:14px;color:#56688a;margin-top:4px}</style></head>
<body><header><h1>Career<em>Hive</em> · storyboard</h1><span>${esc(b.title)}</span></header><main>${cells}</main></body></html>`
    const htmlPath = path.join(tmp, `${name}.html`)
    fs.writeFileSync(htmlPath, html)
    const tab = await browser.newPage({ viewport: { width: 800, height: 600 }, deviceScaleFactor: 1 })
    await tab.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle' })
    await tab.evaluate(() => document.fonts.ready)
    const box = await tab.locator('body').boundingBox()
    await tab.setViewportSize({ width: Math.ceil(box.width), height: Math.ceil(box.height) })
    await tab.screenshot({ path: path.join(out, `${name}-storyboard.png`), fullPage: true })
    await tab.close()
    console.log(`storyboard/${name}-storyboard.png`)
  }
} finally {
  await browser.close()
  fs.rmSync(tmp, { recursive: true, force: true })
}
