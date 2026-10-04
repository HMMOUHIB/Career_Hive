// Renders the CareerHive motion cuts frame by frame: each cut is a timeline page (toolkit.page) driven by seek(t),
// captured at 30 fps with Playwright and encoded with ffmpeg (H.264 + AAC) with its synthesised soundtrack.
//
//   node presentation/motion/source/render.mjs master                       → video/CareerHive-Master-16x9.mp4 + poster
//   node presentation/motion/source/render.mjs master --stills 3,9.5 --dir X → PNG stills at those times (for review)
//   node presentation/motion/source/render.mjs all                          → every cut, then the still graphics
//   node presentation/motion/source/render.mjs stills                       → thumbnail, square, portrait, story cover
//   node presentation/motion/source/render.mjs all --remix                  → rebuild only the soundtracks (seconds)
//
// Cuts: master · portfolio · teaser (16:9) · social (9:16). ffmpeg: FFMPEG=/path/to/ffmpeg or `ffmpeg` on PATH.
// The voice-over stem voice/<cut>.flac (made by voice.mjs) is mixed in when it exists; --no-voice renders music only.
// Fonts load from Google Fonts (network needed). Requires Chrome and the careerhive-ui dev dependencies (Playwright).
import { execFileSync, spawn } from 'node:child_process'
import { once } from 'node:events'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { writeWav } from '../../source/audio.mjs'
import * as cuts from './cuts.mjs'
import { here, motionRoot, page, presRoot } from './toolkit.mjs'

const playwright = createRequire(path.resolve(presRoot, '../careerhive-ui/package.json'))('playwright')
const ffmpeg = process.env.FFMPEG || 'ffmpeg'
const FPS = 30
const FILES = { master: 'CareerHive-Master-16x9', portfolio: 'CareerHive-Portfolio-16x9', teaser: 'CareerHive-Teaser-16x9', social: 'CareerHive-Social-9x16' }
const STILLS = { thumbnail: 'thumbnail-1280x720', square: 'square-1080', portrait: 'portrait-1080x1350', story: 'story-cover-1080x1920' }
// voice over music: the music sits 4 dB down and ducks ~8 dB more under the voice (sidechain), so the voice stays ~11 dB
// above it while speaking and the music returns ~3 dB below the voice between lines; the mix lands at −14 LUFS
const MIX = '[1:a]volume=-4dB[m];[2:a]aformat=channel_layouts=stereo,asplit=2[vo][key];[m][key]sidechaincompress=threshold=0.05:ratio=3:attack=20:release=400[bed];[bed][vo]amix=inputs=2:normalize=0:duration=first,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[a]'

/** The soundtrack inputs for a cut (after input 0, the picture): the synthesised music, plus the voice stem if any. */
function soundtrack(name, cut) {
  const wav = path.join(os.tmpdir(), `careerhive-${name}.wav`)
  writeWav(wav, { length: cut.length, cues: cut.cues })
  const vo = path.join(motionRoot, 'voice', `${name}.flac`), voiced = !args.includes('--no-voice') && fs.existsSync(vo)
  const input = voiced ? ['-i', wav, '-i', vo, '-filter_complex', MIX, '-map', '0:v', '-map', '[a]'] : ['-i', wav, '-map', '0:v', '-map', '1:a']
  return { input, voiced }
}
const AUDIO_OUT = ['-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', '-shortest']

async function open(browser, cut, name) {
  const htmlPath = path.join(here, `${name}.html`)
  fs.writeFileSync(htmlPath, page(cut))
  const tab = await browser.newPage({ viewport: { width: cut.w, height: cut.h }, deviceScaleFactor: 1 })
  const errors = []
  tab.on('pageerror', (e) => errors.push(String(e)))
  await tab.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle', timeout: 180000 }) // slow when renders run in parallel
  await tab.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map((i) => i.decode().catch(() => {}))) })
  // background images (the screen crops, the logo sprites) are decoded once before the first frame
  await tab.evaluate(() => Promise.all([...new Set([...document.querySelectorAll('.crop, .emb')].map((d) => d.style.backgroundImage.slice(5, -2)))].map((u) => new Promise((r) => { const i = new Image(); i.onload = i.onerror = r; i.src = u }))))
  if (errors.length) throw new Error(errors.join('\n'))
  return { tab, errors }
}

async function stillsOf(browser, name, times, dir) {
  const cut = cuts[name]()
  const { tab } = await open(browser, cut, name)
  fs.mkdirSync(dir, { recursive: true })
  for (const t of times) {
    await tab.evaluate((t) => window.seek(t), t)
    await tab.screenshot({ path: path.join(dir, `${name}-t${t.toFixed(2).padStart(5, '0')}.png`) })
  }
  await tab.close()
}

async function film(browser, name) {
  const cut = cuts[name]()
  const out = path.join(motionRoot, 'video', `${FILES[name]}.mp4`)
  fs.mkdirSync(path.dirname(out), { recursive: true })
  const { tab, errors } = await open(browser, cut, name)
  const { input, voiced } = soundtrack(name, cut)
  const enc = spawn(ffmpeg, ['-y', '-hide_banner', '-loglevel', 'error',
    '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', ...input,
    '-vf', 'scale=in_range=full:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt709,format=yuv420p',
    // capped bitrate: the moving grain would otherwise push a 60 s master past GitHub's 100 MB file limit
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-maxrate', '6M', '-bufsize', '12M', '-profile:v', 'high', '-level', '4.2', '-g', '60', '-bf', '2',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
    ...AUDIO_OUT, out], { stdio: ['pipe', 'inherit', 'inherit'] })
  const done = once(enc, 'close')
  const frames = Math.round(cut.length * FPS), started = Date.now()
  for (let f = 0; f < frames; f++) {
    await tab.evaluate((t) => window.seek(t), f / FPS)
    const jpg = await tab.screenshot({ type: 'jpeg', quality: 94 })
    if (!enc.stdin.write(jpg)) await once(enc.stdin, 'drain')
    if (f % 300 === 0) console.log(`${name}: frame ${f}/${frames} · ${((Date.now() - started) / 1000).toFixed(0)} s`)
  }
  enc.stdin.end()
  const [code] = await done
  if (code !== 0) throw new Error(`ffmpeg exited with ${code}`)
  await tab.evaluate((t) => window.seek(t), cut.poster)
  await tab.screenshot({ path: out.replace(/\.mp4$/, '-poster.png') })
  await tab.close()
  if (errors.length) console.error(errors.join('\n'))
  console.log(`${path.relative(presRoot, out)} · ${voiced ? 'with voice-over' : 'music only'} · ${(fs.statSync(out).size / 1e6).toFixed(1)} MB · ${((Date.now() - started) / 60000).toFixed(1)} min`)
}

/** Rebuild a rendered film's soundtrack (music + voice-over) and copy its picture untouched: seconds, not minutes. */
function remix(name) {
  const cut = cuts[name](), out = path.join(motionRoot, 'video', `${FILES[name]}.mp4`), tmp = out.replace(/\.mp4$/, '.remix.mp4')
  if (!fs.existsSync(out)) throw new Error(`${path.relative(presRoot, out)} is not rendered yet`)
  const { input, voiced } = soundtrack(name, cut)
  execFileSync(ffmpeg, ['-y', '-hide_banner', '-loglevel', 'error', '-i', out, ...input, '-c:v', 'copy', ...AUDIO_OUT, tmp])
  fs.renameSync(tmp, out)
  console.log(`${path.relative(presRoot, out)} · soundtrack rebuilt · ${voiced ? 'with voice-over' : 'music only'}`)
}

async function graphics(browser) {
  const dir = path.join(motionRoot, 'graphics')
  fs.mkdirSync(dir, { recursive: true })
  for (const [kind, file] of Object.entries(STILLS)) {
    const cut = cuts.still(kind)
    const { tab } = await open(browser, cut, `still-${kind}`)
    await tab.evaluate(() => window.seek(0))
    await tab.screenshot({ path: path.join(dir, `${file}.png`) })
    await tab.close()
    console.log(`graphics/${file}.png`)
  }
}

const args = process.argv.slice(2)
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined }
const what = args[0]
if (args.includes('--remix')) {
  for (const name of what === 'all' ? Object.keys(FILES) : [what]) {
    if (!FILES[name]) throw new Error(`Unknown cut "${name}". Use: ${Object.keys(FILES).join(' | ')} | all`)
    remix(name)
  }
} else {
  const browser = await playwright.chromium.launch({ channel: 'chrome' })
  try {
    if (opt('--stills')) await stillsOf(browser, what, opt('--stills').split(',').map(Number), opt('--dir') ?? path.join(os.tmpdir(), 'careerhive-motion-stills'))
    else if (what === 'stills') await graphics(browser)
    else if (what === 'all') { for (const name of Object.keys(FILES)) await film(browser, name); await graphics(browser) }
    else if (FILES[what]) await film(browser, what)
    else throw new Error(`Unknown cut "${what}". Use: ${Object.keys(FILES).join(' | ')} | stills | all`)
  } finally {
    await browser.close()
  }
}
