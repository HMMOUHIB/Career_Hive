// CareerHive motion toolkit: a tiny keyframe engine that runs inside the film page (seek(t) sets every element from t
// alone), and HTML builders shared by every cut. Positions are stage pixels; times are seconds.
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'

export const here = path.dirname(fileURLToPath(import.meta.url))
export const motionRoot = path.resolve(here, '..')
export const presRoot = path.resolve(motionRoot, '..')
const shots = path.join(presRoot, 'assets', 'screenshots')
const req = createRequire(path.resolve(presRoot, '../careerhive-ui/package.json'))
const load = async (name) => { const m = await import(pathToFileURL(req.resolve(name)).href); return Object.keys(m).length <= 2 && m.default ? m.default : m }
const Lucide = await load('lucide')
const Simple = await load('simple-icons')

export const BEAT = 0.6, BAR = 2.4 // 100 BPM: cuts land on beats

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
export { esc }

/** A Lucide icon as inline SVG (the product's icon set). */
export function icon(name, size = 24, stroke = 2, color = 'currentColor') {
  const node = Lucide[name]
  if (!node) throw new Error(`Unknown Lucide icon: ${name}`)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">${node.map(([t, a]) => `<${t} ${Object.entries(a).map(([k, v]) => `${k}="${v}"`).join(' ')}/>`).join('')}</svg>`
}

/** A brand mark from Simple Icons (the product's logo set), e.g. logo('github'). */
export function logo(slug, size = 24, color = 'currentColor') {
  const i = Object.values(Simple).find((x) => x && x.slug === slug)
  if (!i) throw new Error(`Unknown Simple Icons slug: ${slug}`)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}"><path d="${i.path}"/></svg>`
}

/* ---------- keyframes ---------- */
// A keyframe: { t, o, x, y, z, s, sx, sy, r, rx, ry, b (blur px), k (free progress → CSS --k), e (easing into it) }.
// Missing values carry forward; before the first and after the last keyframe the element holds still.
export const kf = (frames) => `data-k='${JSON.stringify(frames)}'`
/** A positioned element: centre (x, y), size (w, h), keyframes, inner HTML. */
export function el({ x = 0, y = 0, w, h, k, cls = '', style = '', inner = '', base = 'translate(-50%,-50%)', id = '' }) {
  const size = `${w != null ? `width:${w}px;` : ''}${h != null ? `height:${h}px;` : ''}`
  return `<div ${id ? `id="${id}"` : ''} class="a ${cls}" data-base="${base}" style="left:${x}px;top:${y}px;${size}transform:${base};${style}" ${k ? kf(k) : ''}>${inner}</div>`
}
/** A full-stage layer (scene root, background, overlay). */
export const layer = ({ k, cls = '', style = '', inner = '' }) => `<div class="a fill ${cls}" data-base="" style="${style}" ${k ? kf(k) : ''}>${inner}</div>`

/** In → hold → out for a whole scene: fades or holds; `cut` makes it appear instantly. */
export const sceneK = (t0, t1, { inD = 0.35, outD = 0.35, cut = false, cutOut = false } = {}) => cut
  ? [{ t: t0 - 0.001, o: 0 }, { t: t0, o: 1, e: 'linear' }, ...(cutOut ? [{ t: t1 - 0.001, o: 1 }, { t: t1, o: 0, e: 'linear' }] : [{ t: t1 - outD, o: 1 }, { t: t1, o: 0, e: 'inout' }])]
  : [{ t: t0, o: 0 }, { t: t0 + inD, o: 1, e: 'out' }, ...(cutOut ? [{ t: t1 - 0.001, o: 1 }, { t: t1, o: 0, e: 'linear' }] : [{ t: t1 - outD, o: 1 }, { t: t1, o: 0, e: 'inout' }])]

/** Focus pull: from blurred and slightly scaled to sharp (the reference's signature entrance). */
export const focusIn = (t, { d = 0.55, b = 14, s0 = 1.06, dy = 0, dx = 0 } = {}) => [{ t, o: 0, b, s: s0, y: dy, x: dx }, { t: t + d, o: 1, b: 0, s: 1, y: 0, x: 0, e: 'out5' }]
export const focusOut = (t, { d = 0.35, b = 12, s1 = 0.96, dy = 0 } = {}) => [{ t, o: 1, b: 0, s: 1, y: 0 }, { t: t + d, o: 0, b, s: s1, y: dy, e: 'inout' }]
export const hold = (frames, until) => [...frames, { t: until }]
export const join = (...parts) => parts.flat().sort((a, b) => a.t - b.t)

/** A scene: its layers exist only from their first keyframe to `until` (display:none otherwise, which also keeps
 *  every frame cheap to paint). Elements inside hold their first keyframe until it starts, so the window is the guard. */
export function scene(layers, until) {
  const html = [layers].flat(Infinity).join('\n')
  let start = Infinity
  for (const m of html.matchAll(/data-k='([^']*)'/g)) for (const f of JSON.parse(m[1])) if (f.t != null) start = Math.min(start, f.t)
  return `<div class="scene" data-scene='${JSON.stringify([start, until])}'>${html}</div>`
}

/* ---------- typography ---------- */
/** Masked word-by-word rise with focus (each word climbs out of its own mask). */
// Gradient text split into moving spans: each span paints its own slice of one gradient, aligned by the runtime
// (a .gw group), because background-clip:text on a parent cannot reach transformed children.
const gw = (cls, html) => (/\bgrad/.test(cls) ? `<span class="gw">${html}</span>` : html)
export function words(text, t0, { stagger = 0.09, d = 0.62, cls = '', out, outD = 0.3, dy = 1.1, b = 10 } = {}) {
  return gw(cls, text.split(' ').map((wd, i) => {
    const t = t0 + i * stagger
    const k = [{ t, o: 0, y: 0, k: dy, b }, { t: t + d, o: 1, k: 0, b: 0, e: 'out5' }, ...(out != null ? [{ t: out - outD }, { t: out, o: 0, k: -dy * 0.6, b: 6, e: 'inout' }] : [])]
    return `<span class="w"><span class="${cls}" data-base="translateY(calc(var(--k,0) * 100%))" ${kf(k)}>${esc(wd)}</span></span>`
  }).join(' '))
}
/** Character stagger (for the wordmark): letters rise and unblur one after another. */
export function chars(text, t0, { stagger = 0.04, d = 0.6, cls = '' } = {}) {
  return gw(cls, [...text].map((c, i) => `<span class="w"><span class="${cls}" data-base="translateY(calc(var(--k,0) * 100%))" ${kf([{ t: t0 + i * stagger, o: 0, k: 1, b: 8 }, { t: t0 + i * stagger + d, o: 1, k: 0, b: 0, e: 'out5' }])}>${c === ' ' ? '&nbsp;' : esc(c)}</span></span>`).join(''))
}
/** A number that counts (eased) from `from` to `to` between t0 and t1. */
export const counter = ({ t0, t1, to, from = 0, dec = 0, pre = '', suf = '', cls = '' }) => `<span class="${cls}" data-count='${JSON.stringify({ t0, t1, to, from, dec, pre, suf })}'>${pre}${from.toFixed(dec)}${suf}</span>`
export const wordmark = (size, { light = false } = {}) => `<span class="wordmark" style="font-size:${size}px;color:${light ? '#fff' : 'var(--ink)'}">Career<span class="${light ? 'grad-light' : 'grad'}">Hive</span></span>`

/* ---------- real product UI ---------- */
/** A crop of a 1440×900 capture (2× files): region r = [x, y, w, h] in capture pixels, shown `width` wide. */
export function crop(shot, r, width, { cls = '', radius = 20, style = '' } = {}) {
  const s = width / r[2]
  return `<div class="crop ${cls}" style="width:${width}px;height:${Math.round(r[3] * s)}px;border-radius:${radius}px;background-image:url(${pathToFileURL(path.join(shots, shot + '.jpg')).href});background-size:${1440 * s}px ${900 * s}px;background-position:${-r[0] * s}px ${-r[1] * s}px;${style}"></div>`
}
/** Crop that covers a w×h box (centred on the region). */
export function cover(shot, r, w, h, { cls = '', radius = 0, style = '' } = {}) {
  const s = Math.max(w / r[2], h / r[3]), cx = r[0] + r[2] / 2, cy = r[1] + r[3] / 2
  return `<div class="crop flat ${cls}" style="width:${w}px;height:${h}px;border-radius:${radius}px;background-image:url(${pathToFileURL(path.join(shots, shot + '.jpg')).href});background-size:${1440 * s}px ${900 * s}px;background-position:${w / 2 - cx * s}px ${h / 2 - cy * s}px;${style}"></div>`
}
export const shotUrl = (shot) => pathToFileURL(path.join(shots, shot + '.jpg')).href

/** CC BY 4.0 attribution for the emblem's 3D model: shown wherever the emblem is. */
export const EMBLEM_CREDIT = '3D emblem: “Rick and Morty” by Ian Dowson · CC BY 4.0'
/** The app's logo: the 3D emblem (rendered by emblem.mjs) in 'frost' or 'white'. `spin: [t0, d]` plays one eased coin
 *  turn through its 48-frame sprite (8 × 6); otherwise it rests on the front frame. */
export function emblem(size, { tone = 'white', spin, cls = '' } = {}) {
  const sheet = pathToFileURL(path.join(motionRoot, 'assets', `emblem-${tone}-turn.png`)).href
  return `<div class="emb ${tone} ${cls}" ${spin ? `data-spin='${JSON.stringify({ t0: spin[0], d: spin[1] })}'` : ''} style="width:${size}px;height:${size}px;background-image:url(${sheet});background-size:${size * 8}px ${size * 6}px"></div>`
}
/** Where a capture point lands inside a crop shown `width` wide. */
export const at = (r, width, bx, by) => { const s = width / r[2]; return [(bx - r[0]) * s, (by - r[1]) * s] }

/* ---------- shapes ---------- */
/** Pointy-top hexagon path centred on (0, 0). */
export const hexPath = (r) => { const p = [0, 1, 2, 3, 4, 5].map((i) => { const a = Math.PI / 180 * (60 * i - 90); return `${(r * Math.cos(a)).toFixed(1)} ${(r * Math.sin(a)).toFixed(1)}` }); return `M${p.join(' L')} Z` }
/** Honeycomb cell centres (axial rings) for pointy-top hexagons of radius r. */
export function honeycomb(rings, r) {
  const w = Math.sqrt(3) * r, out = [{ q: 0, rr: 0, x: 0, y: 0, ring: 0 }]
  const dirs = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]]
  for (let ring = 1; ring <= rings; ring++) {
    let q = -ring, rr = ring // start at direction 4 × ring
    for (let side = 0; side < 6; side++) for (let step = 0; step < ring; step++) {
      out.push({ q, rr, x: w * (q + rr / 2), y: 1.5 * r * rr, ring }); q += dirs[side][0]; rr += dirs[side][1]
    }
  }
  return out
}
/** A hexagonal iris: content revealed through a hexagon growing from (cx, cy) as --k goes 0 → 1 (radius R). */
export const iris = (cx, cy, R) => `--cx:${cx}px;--cy:${cy}px;--R:${R}px;clip-path:polygon(calc(var(--cx)) calc(var(--cy) - var(--k,0) * var(--R)), calc(var(--cx) + var(--k,0) * var(--R) * .866) calc(var(--cy) - var(--k,0) * var(--R) * .5), calc(var(--cx) + var(--k,0) * var(--R) * .866) calc(var(--cy) + var(--k,0) * var(--R) * .5), calc(var(--cx)) calc(var(--cy) + var(--k,0) * var(--R)), calc(var(--cx) - var(--k,0) * var(--R) * .866) calc(var(--cy) + var(--k,0) * var(--R) * .5), calc(var(--cx) - var(--k,0) * var(--R) * .866) calc(var(--cy) - var(--k,0) * var(--R) * .5));`
/** A left → right wipe (charts that "draw themselves"): --k 0 → 1. */
export const wipe = 'clip-path:inset(0 calc((1 - var(--k,0)) * 100%) 0 0);'

/* ---------- toolkit pieces ---------- */
// the product's portal-gun cursor (careerhive-ui/src/components/Cursor.js), Frost blue; the hotspot is the top-left
export const GUN = `<svg width="46" height="46" viewBox="4 4 44 44" overflow="visible"><g transform="translate(4 4) rotate(45)" stroke="#12161d" stroke-width="1.6" stroke-linejoin="round">
<path fill="#2a303a" d="M30 5H39L41.5 17Q41.8 19 39.8 19.3L34.2 19.8Q32.2 20 31.9 18Z"/><rect fill="#dfe8f5" x="9" y="-6.5" width="37" height="13" rx="4"/>
<rect fill="#9aa3ad" x="18" y="-9.5" width="12" height="3.5" rx="1"/><rect fill="#2f7bf6" x="19" y="-19" width="10" height="10" rx="3.5"/><rect fill="#2a303a" x="18" y="-21" width="12" height="3" rx="1.2"/>
<path fill="#b4bcc6" d="M1 -3.2L9 -5V5L1 3.2Z"/><ellipse fill="#97bdfa" cx="1" cy="0" rx="1.6" ry="3.4"/></g></svg>`
/** Cursor gliding through points [[t, x, y], …], pressing at `clicks`; plus a ripple ring per click. */
export function cursor(path, clicks = [], { show, color = 'var(--blue)' } = {}) {
  const [t0] = path[0], tEnd = show?.[1] ?? path[path.length - 1][0] + 0.6
  const k = [{ t: t0 - 0.2, o: 0, x: path[0][1], y: path[0][2] }, { t: t0, o: 1 }]
  for (const [t, x, y] of path.slice(1)) k.push({ t, x, y, e: 'inout' })
  for (const c of clicks) k.push({ t: c, s: 1 }, { t: c + 0.06, s: 0.82, e: 'out' }, { t: c + 0.2, s: 1, e: 'out' })
  k.push({ t: tEnd - 0.25, o: 1 }, { t: tEnd, o: 0, e: 'inout' })
  const at0 = (t) => { let p = path[0]; for (const q of path) if (q[0] <= t) p = q; return p }
  return el({ x: 0, y: 0, base: '', cls: 'cur', k: join(k), inner: GUN }) + clicks.map((c) => {
    const [, x, y] = at0(c)
    return el({ x, y, w: 80, h: 80, cls: 'ring', style: `border-color:${color};box-shadow:0 0 22px ${color}`, k: [{ t: c, o: 0, s: 0.2 }, { t: c + 0.02, o: 1 }, { t: c + 0.55, o: 0, s: 1.7, e: 'out' }] })
  }).join('')
}
/** A lower third: kicker, title, line, icon. */
export const lowerThird = ({ x, y, t0, t1, kicker, title, line, ic = 'Sparkles', cls = '' }) => el({ x, y, base: 'translate(0,-50%)', cls: `lt ${cls}`, k: join(focusIn(t0, { dx: -40, b: 8, s0: 1 }), focusOut(t1 - 0.3, { b: 6 })), inner: `<span class="ix">${icon(ic, 28, 2.2)}</span><div><small>${esc(kicker)}</small><b>${esc(title)}</b>${line ? `<span>${esc(line)}</span>` : ''}</div>` })
/** A kinetic stat card with a counting number. */
export const stat = ({ x, y, t0, t1, to, dec = 0, suf = '', label, cls = '', count = 1.3 }) => el({ x, y, cls: `stat ${cls}`, k: join(focusIn(t0, { dy: 30 }), t1 ? focusOut(t1 - 0.3) : []), inner: `<b>${counter({ t0: t0 + 0.1, t1: t0 + 0.1 + count, to, dec, suf })}</b><small>${esc(label)}</small>` })
/** The honesty tag: a quiet pill saying the screens are the real UI showing its built-in demo data. */
export const tag = (t0, t1, { x, y, center = false, text = 'Real UI · demo data' }) => el({ x, y, base: center ? 'translate(-50%,-50%)' : 'translate(-100%,-50%)', cls: 'tag', k: [{ t: t0, o: 0 }, { t: t0 + 0.5, o: 1 }, { t: t1 - 0.3, o: 1 }, { t: t1, o: 0 }], inner: esc(text) })
/** A light sweep across a w×h box (place it inside the box). */
export const sweep = (t, w, d = 0.9) => `<div class="a sweep" data-base="" style="left:0" ${kf([{ t, x: -w * 0.4 }, { t: t + d, x: w * 1.1, e: 'inout' }])}></div>`
/** Pulsing rings (notifications, pings). */
export const ping = (x, y, t, { size = 70, color = 'var(--blue)', n = 2, gap = 0.28 } = {}) => Array.from({ length: n }, (_, i) => el({ x, y, w: size, h: size, cls: 'ring', style: `border-color:${color}`, k: [{ t: t + i * gap, o: 0, s: 0.4 }, { t: t + i * gap + 0.02, o: 0.9 }, { t: t + i * gap + 0.7, o: 0, s: 2.1, e: 'out' }] })).join('')

/* ---------- the in-page engine ---------- */
export function runtime() {
  const E = {
    linear: (p) => p, out: (p) => 1 - (1 - p) ** 3, out5: (p) => 1 - (1 - p) ** 5, in: (p) => p ** 3,
    inout: (p) => (p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2), expo: (p) => (p >= 1 ? 1 : 1 - 2 ** (-10 * p)),
    back: (p) => { const c = 1.55; return 1 + (c + 1) * (p - 1) ** 3 + c * (p - 1) ** 2 },
  }
  const DEF = { o: 1, x: 0, y: 0, z: 0, s: 1, sx: 1, sy: 1, r: 0, rx: 0, ry: 0, b: 0, k: 0 }
  const scenes = new Map([...document.querySelectorAll('[data-scene]')].map((el) => [el, { el, w: JSON.parse(el.dataset.scene), on: true }]))
  const items = [...document.querySelectorAll('[data-k]')].map((el) => {
    let prev = { ...DEF }
    const ks = JSON.parse(el.dataset.k).map((f) => (prev = { ...prev, ...f }))
    return { el, ks, base: el.dataset.base || '', last: '', sc: scenes.get(el.closest('[data-scene]')) }
  })
  // one gradient across a split word: measured once, on the first seek (fonts are loaded by then, nothing moved yet)
  let aligned = false
  const align = () => {
    for (const g of document.querySelectorAll('.gw')) {
      const r0 = g.getBoundingClientRect()
      for (const c of g.querySelectorAll('.grad, .grad-light')) { const r = c.getBoundingClientRect(); c.style.backgroundSize = `${r0.width}px 100%`; c.style.backgroundPosition = `${r0.left - r.left}px 0` }
    }
    aligned = true
  }
  const val = (ks, t, p) => {
    if (t <= ks[0].t) return ks[0][p]
    for (let i = 1; i < ks.length; i++) if (t <= ks[i].t) { const a = ks[i - 1], b = ks[i], q = (t - a.t) / ((b.t - a.t) || 1); return a[p] + (b[p] - a[p]) * (E[b.e || 'out'] || E.out)(q) }
    return ks[ks.length - 1][p]
  }
  const counts = [...document.querySelectorAll('[data-count]')].map((el) => ({ el, c: JSON.parse(el.dataset.count) }))
  const draws = [...document.querySelectorAll('[data-draw]')].map((el) => ({ el, c: JSON.parse(el.dataset.draw) }))
  const spins = [...document.querySelectorAll('[data-spin]')].map((el) => ({ el, c: JSON.parse(el.dataset.spin), w: parseFloat(el.style.width) }))
  const grain = document.querySelector('.grain')
  window.seek = (t) => {
    if (!aligned) align()
    for (const s of scenes.values()) { const on = t >= s.w[0] && t <= s.w[1]; if (on !== s.on) { s.el.style.display = on ? '' : 'none'; s.on = on } }
    for (const it of items) {
      if (it.sc && !it.sc.on) continue
      const v = {}
      for (const p in DEF) v[p] = val(it.ks, t, p)
      if (v.o <= 0.002) { if (it.last !== 'h') { it.el.style.visibility = 'hidden'; it.last = 'h' } continue }
      it.last = ''
      it.el.style.visibility = ''
      it.el.style.opacity = v.o.toFixed(4)
      it.el.style.transform = `${it.base} translate3d(${v.x.toFixed(2)}px,${v.y.toFixed(2)}px,${v.z.toFixed(2)}px) rotateX(${v.rx.toFixed(3)}deg) rotateY(${v.ry.toFixed(3)}deg) rotate(${v.r.toFixed(3)}deg) scale(${(v.s * v.sx).toFixed(4)},${(v.s * v.sy).toFixed(4)})`
      it.el.style.filter = v.b > 0.05 ? `blur(${v.b.toFixed(2)}px)` : ''
      it.el.style.setProperty('--k', v.k.toFixed(4))
    }
    for (const { el, c } of counts) { const p = Math.min(1, Math.max(0, (t - c.t0) / (c.t1 - c.t0))), e = 1 - (1 - p) ** 4; el.textContent = c.pre + (c.from + (c.to - c.from) * e).toFixed(c.dec) + c.suf }
    for (const { el, c } of draws) { const p = Math.min(1, Math.max(0, (t - c.t0) / (c.t1 - c.t0))); el.style.strokeDashoffset = String(1 - (p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2)) }
    for (const { el, c, w } of spins) { const p = Math.min(1, Math.max(0, (t - c.t0) / c.d)), f = Math.round(E.inout(p) * 48) % 48; el.style.backgroundPosition = `${-(f % 8) * w}px ${-Math.floor(f / 8) * w}px` }
    if (grain) { const f = Math.floor(t * 24); grain.style.backgroundPosition = `${(f * 37) % 200}px ${(f * 61) % 200}px` }
  }
}

/** A film page: stage of w×h holding the layers, plus grain, vignette and the closing black. */
export function page({ w, h, title, layers, fadeOut }) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><link rel="stylesheet" href="motion.css">
<style>#stage{width:${w}px;height:${h}px}</style></head><body>
<div id="stage">${layers.join('\n')}<div class="grain"></div><div class="vig"></div><div id="black" data-base="" ${kf(fadeOut ? [{ t: fadeOut[0], o: 0 }, { t: fadeOut[1], o: 1, e: 'inout' }] : [{ t: 0, o: 0 }])}></div></div>
<script>(function(){const c=document.createElement('canvas');c.width=c.height=200;const g=c.getContext('2d');const d=g.createImageData(200,200);let s=9;for(let i=0;i<d.data.length;i+=4){s=(s*16807)%2147483647;const v=s%256;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=255}g.putImageData(d,0,0);document.querySelector('.grain').style.backgroundImage='url('+c.toDataURL()+')'})();
(${runtime.toString()})()</script></body></html>`
}
