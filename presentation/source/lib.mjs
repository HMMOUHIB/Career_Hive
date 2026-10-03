// Building blocks shared by the book, the social kit, the mockups and the video overlays.
// Icons come from the same packages the product uses (Lucide, Simple Icons), versions from the real package.json files.
import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const here = path.dirname(fileURLToPath(import.meta.url))
export const root = path.resolve(here, '..')
const uiDir = path.resolve(root, '../careerhive-ui')
const apiDir = path.resolve(root, '../careerhive-backend')
const req = createRequire(path.join(uiDir, 'package.json'))
export const playwright = req('playwright')
// require.resolve can land on a CommonJS build, which puts everything under `default`
const load = async (name) => { const m = await import(pathToFileURL(req.resolve(name)).href); return Object.keys(m).length <= 2 && m.default ? m.default : m }
const Lucide = await load('lucide')
const Simple = await load('simple-icons')
const icons = Object.values(Simple).filter((i) => i && i.slug)

export const content = JSON.parse(fs.readFileSync(path.join(here, 'content.json'), 'utf8'))
const uiPkg = JSON.parse(fs.readFileSync(path.join(uiDir, 'package.json'), 'utf8'))
const apiPkg = JSON.parse(fs.readFileSync(path.join(apiDir, 'package.json'), 'utf8'))
const spec = (name) => (uiPkg.dependencies?.[name] ?? uiPkg.devDependencies?.[name] ?? apiPkg.dependencies?.[name] ?? '').replace(/^[\^~]/, '')
/** Version of a dependency from the real manifests: the major, or major.minor for 0.x packages (three). */
export const ver = (name) => { const [a, b] = spec(name).split('.'); return a === '0' ? `0.${b}` : a }
export const nodeEngine = apiPkg.engines?.node ?? ''

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
export { esc }

/** A Lucide icon as inline SVG (the product's icon set). */
export function icon(name, size = 24, stroke = 1.9, extra = '') {
  const node = Lucide[name]
  if (!node) throw new Error(`Unknown Lucide icon: ${name}`)
  const inner = node.map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).map(([k, v]) => `${k}="${esc(v)}"`).join(' ')}/>`).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" ${extra}>${inner}</svg>`
}

// LinkedIn isn't in Simple Icons; this is the same "in" mark the product's sign-in button uses (Login.jsx)
const LINKEDIN = { slug: 'linkedin', title: 'LinkedIn', hex: '0A66C2', path: 'M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z' }
icons.push(LINKEDIN)

/** A technology logo from Simple Icons, in its brand colour (or `color`). */
export function brand(slug, size = 36, color) {
  const i = icons.find((x) => x.slug === slug)
  if (!i) throw new Error(`Unknown Simple Icons slug: ${slug}`)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" role="img" aria-label="${esc(i.title)}"><path fill="${color ?? '#' + i.hex}" d="${i.path}"/></svg>`
}
export const brandTitle = (slug) => icons.find((x) => x.slug === slug)?.title ?? slug

/** The product's IconTile: a gradient tile holding a Lucide icon. */
export const tile = (name, { size = 64, tone = '', soft = false } = {}) =>
  `<span class="tile ${tone} ${soft ? 'soft' : ''}" style="width:${size}px;height:${size}px">${icon(name, Math.round(size * 0.46))}</span>`

/** A white logo tile: a brand logo when one exists, else a Lucide icon. */
export const logoTile = ({ slug, lucide, size = 64, color }) =>
  `<span class="logo" style="width:${size}px;height:${size}px">${slug ? brand(slug, Math.round(size * 0.52), color) : `<span style="color:#2f7bf6">${icon(lucide, Math.round(size * 0.5))}</span>`}</span>`

/** Path to a captured screenshot, relative to the generated HTML files in source/. */
export const shot = (name) => `../assets/screenshots/${name}.jpg`

/**
 * A screenshot in a window frame whose title is the app route.
 * `region: [x, y, w, h]` zooms into part of a 1440×900 desktop capture (needs `width`).
 */
export function win(name, { route = '', width, height, style = '', cls = '', fit = 'cover', pos = 'top left', region } = {}) {
  const box = [width ? `width:${width}px` : '', style].filter(Boolean).join(';')
  const s = region ? width / region[2] : 1
  const img = region
    ? `<div style="height:${Math.round(region[3] * s)}px;overflow:hidden;position:relative"><img src="${shot(name)}" style="position:absolute;left:${-region[0] * s}px;top:${-region[1] * s}px;width:${1440 * s}px;max-width:none" alt=""></div>`
    : height
    ? `<div style="height:${height}px;overflow:hidden"><img src="${shot(name)}" style="width:100%;height:100%;object-fit:${fit};object-position:${pos}" alt=""></div>`
    : `<img src="${shot(name)}" alt="">`
  return `<div class="win ${cls}" style="${box}"><div class="win-bar"><i></i><i></i><i></i><span>CareerHive${route ? ` · ${esc(route)}` : ''}</span></div>${img}</div>`
}

/** Wordmark: "Career" + gradient "Hive". */
export const wordmark = (size, color = 'inherit') => `<span class="wordmark" style="font-size:${size}px;color:${color}">Career<span class="hive">Hive</span></span>`

/** One 1920×1080 page with its running header and folio. */
export function page({ n, total, section = '', variant = '', body, folio = '', id = '' }) {
  return `<section class="page ${variant}" ${id ? `id="${id}"` : ''}>
  ${n ? `<div class="run"><span><b>CareerHive</b> &nbsp;—&nbsp; Project book</span><span>${esc(section)}</span></div>` : ''}
  ${body}
  ${n ? `<div class="folio"><span>${folio || 'Screens: built-in demo data'}</span><span><span class="n">${String(n).padStart(2, '0')}</span> / ${String(total).padStart(2, '0')}</span></div>` : ''}
</section>`
}

/** An HTML document wrapping pages, with the brand stylesheet. */
export const doc = (title, pages, extraCss = '') => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title>
<link rel="stylesheet" href="brand.css">${extraCss ? `<style>${extraCss}</style>` : ''}</head>
<body>${pages.join('\n')}</body></html>`

/** "[INFORMATION NEEDED: …]" marker for anything the code can't tell us. */
export const need = (what) => `<span class="need">[INFORMATION NEEDED${what ? `: ${esc(what)}` : ''}]</span>`
/** content.json value, or a visible [INFORMATION NEEDED] marker when it is empty. */
export const fact = (key, what) => (content[key] ? esc(content[key]) : need(what ?? key))
