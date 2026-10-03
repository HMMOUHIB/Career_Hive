// The product film, rendered frame by frame: a 1920×1080 timeline page (film.html) driven by seek(t), captured at
// 30 fps with Playwright and encoded with ffmpeg (H.264 + AAC) together with the synthesised soundtrack (audio.mjs).
//
//   node presentation/source/film.mjs                        → video/CareerHive-Film-1080p.mp4 + video/CareerHive-Film-poster.png
//   node presentation/source/film.mjs --poster               → only the poster
//   node presentation/source/film.mjs --stills 2,9.5 --dir X → PNG stills at those times (for review)
//
// ffmpeg: set FFMPEG to the binary, or have `ffmpeg` on PATH. Fonts load from Google Fonts (network needed).
// Every claim on screen is a real feature; screens are the captures in assets/screenshots (built-in demo data).
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { writeWav } from './audio.mjs'
import { brand, content, doc, esc, here, icon, playwright, root, shot, tile, ver, wordmark } from './lib.mjs'

const FPS = 30, LENGTH = 50
const OUT = path.join(root, 'video', 'CareerHive-Film-1080p.mp4')
const POSTER = path.join(root, 'video', 'CareerHive-Film-poster.png')
const POSTER_AT = 49.0 // the end card, fully built, before the fade

// ---------- timeline facts (seconds) — picture and sound both read these ----------
const STEP = [13.4, 16.2, 18.6, 21.0, 23.4] // solution steps: request · review · notify · grow
const FEAT = [23.4, 25.8, 28.2, 33.0, 35.4, 37.8] // team hub · feed · CV coach · skills · themes
const CLICKS = [14.95, 17.45, 19.35]
const CUES = {
  riserTo: 3.0, impacts: [3.0, 44.4], whooshes: [7.8, 12.6, 23.4, 37.8],
  softWhooshes: [4.5, 16.2, 18.6, 21.0, 25.8, 28.2, 30.0, 33.0, 35.4, 46.6],
  clicks: CLICKS, pops: [17.55, 19.45, 22.65], ticks: [1.0, 1.5, 2.0, 21.6, 21.9, 22.2],
  bassFrom: 12.6, bassTo: 44.4, arpFrom: 3.0, arpTo: 47.0, kickFrom: 13.2, kickTo: 44.4, shakerFrom: 23.4, shakerTo: 37.8,
}

// ---------- page building blocks ----------
/** A window frame whose view shows regions of 1440×900 captures; the runtime moves the camera. */
const fwin = (id, w, h, names, route, style = '', extra = '') => `<div class="win fw a" id="${id}" style="width:${w}px;${style}">
  <div class="win-bar"><i></i><i></i><i></i><span>CareerHive · <em id="${id}-route">${esc(route)}</em></span></div>
  <div class="fw-view" id="${id}-view" data-w="${w}" style="height:${h}px">${names.map((n) => `<img class="fw-img" id="${id}-${n}" src="${shot(n)}" alt="">`).join('')}${extra}</div></div>`

// portal-gun cursor, the product's own (careerhive-ui/src/components/Cursor.js), in Frost blue; the muzzle is the hotspot
const GUN = `<svg class="cur" id="cur" width="44" height="44" viewBox="4 4 44 44" overflow="visible"><g transform="translate(4 4) rotate(45)" stroke="#12161d" stroke-width="1.6" stroke-linejoin="round">
<path fill="#2a303a" d="M30 5H39L41.5 17Q41.8 19 39.8 19.3L34.2 19.8Q32.2 20 31.9 18Z"/><rect fill="#dfe8f5" x="9" y="-6.5" width="37" height="13" rx="4"/>
<rect fill="#9aa3ad" x="18" y="-9.5" width="12" height="3.5" rx="1"/><rect fill="#2f7bf6" x="19" y="-19" width="10" height="10" rx="3.5"/><rect fill="#2a303a" x="18" y="-21" width="12" height="3" rx="1.2"/>
<path fill="#b4bcc6" d="M1 -3.2L9 -5V5L1 3.2Z"/><ellipse fill="#97bdfa" cx="1" cy="0" rx="1.6" ry="3.4"/></g></svg>`

const lowerThird = (id, n, of, ic, tone, title, sub, sub2) => `<div class="lt a" id="${id}">${tile(ic, { size: 76, tone })}
  <div><small>Feature ${String(n).padStart(2, '0')} / ${String(of).padStart(2, '0')}</small><b>${esc(title)}</b>
  <span class="sub"><span id="${id}-a">${esc(sub)}</span>${sub2 ? `<span id="${id}-b" class="sub-b">${esc(sub2)}</span>` : ''}</span></div></div>`

// deterministic "tangle" between the tools on the problem plate
let seed = 11
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
const curve = ([x1, y1], [x2, y2], bend) => {
  const dx = x2 - x1, dy = y2 - y1, nx = -dy, ny = dx, k = bend * (0.4 + rnd() * 0.5)
  return `M${x1} ${y1} C${x1 + dx * 0.25 + nx * k} ${y1 + dy * 0.25 + ny * k}, ${x1 + dx * 0.75 - nx * k * 1.3} ${y1 + dy * 0.75 - ny * k * 1.3}, ${x2} ${y2}`
}

function build() {
  const hook = ['What', 'does', 'it', 'take', 'to', 'grow?']
  const hookNodes = [['BookOpen', 'Learn', 480, 720], ['BadgeCheck', 'Prove', 960, 660], ['TrendingUp', 'Grow', 1440, 600]]
  const E = [250, 690], M = [1670, 690]
  const tools = [['Mail', 'Email threads', 690, 520], ['Sheet', 'Spreadsheets', 985, 445], ['MessageCircle', 'Side chats', 1265, 545], ['FileText', 'Paper forms', 800, 860], ['CalendarDays', 'Calendar invites', 1140, 850]]
  const P = (i) => [tools[i][2], tools[i][3]]
  const tangle = [[E, P(0), 0.5], [E, P(3), -0.6], [P(0), P(1), 0.7], [P(1), P(2), -0.5], [P(3), P(4), 0.6], [P(4), P(2), -0.9], [P(2), M, 0.5], [P(4), M, -0.4], [P(0), P(4), 0.8], [P(3), P(1), -0.7], [P(1), M, 0.9], [E, P(2), -0.8]].map(([a, b, k]) => curve(a, b, k))
  const questions = [['CircleHelp', 'Was my request seen?', 470, 370], ['CircleHelp', 'Who approved this?', 1450, 380], ['CircleHelp', 'Which skills count?', 975, 990]]
  const steps = [['GraduationCap', 'Request', 'Pick a formation and ask to join.'], ['ClipboardCheck', 'Review', 'HR forwards it, the manager decides.'], ['BellRing', 'Notify', 'Everyone hears it the moment it moves.'], ['TrendingUp', 'Grow', 'Progress counts toward your next role.']]
  const arch = [['react', 'React SPA', `React ${ver('react')} · Vite ${ver('vite')} · three.js · Framer Motion`, 'Browser'], ['express', 'Express API', `Express ${ver('express')} · Node · JWT auth`, 'Server'], ['mariadb', 'MariaDB', '23 tables · mysql2 · UTC', 'Database']]
  const services = [['Mail', 'Email', 'Nodemailer'], ['KeyRound', 'Sign-in', 'Google · LinkedIn · GitHub'], ['Upload', 'Uploads', 'Videos, files, images'], ['ScanText', 'CV reading', 'PDF · DOCX · text']]
  const stats = [[35, 'end-to-end API tests'], [70, 'API route handlers'], [23, 'database tables']]
  const logos = ['react', 'vite', 'threedotjs', 'framer', 'reactrouter', 'nodedotjs', 'express', 'mariadb', 'jsonwebtokens']
  const endChips = [['GraduationCap', 'Formations'], ['ClipboardCheck', 'Two-stage approvals'], ['BellRing', 'Live notifications'], ['MessagesSquare', 'Team chat & feed'], ['Compass', 'CV coach']]

  const s1 = `<section class="scene night" id="s1"><div class="dots"></div><div class="a fill" id="s1in">
    <h1 class="big hook a" id="hook">${hook.map((w, i) => `<span id="hw${i}" class="${i === hook.length - 1 ? 'gnight' : ''}">${w}</span>`).join(' ')}</h1>
    <svg class="a" width="1920" height="1080" style="left:0;top:0"><defs><linearGradient id="hg" x1="0" x2="1"><stop offset="0" stop-color="#5fb2ff" stop-opacity=".2"/><stop offset=".5" stop-color="#5fb2ff"/><stop offset="1" stop-color="#bfe3ff"/></linearGradient></defs>
      <path id="hline" d="M240 760 C380 760, 380 720, 480 720 C700 720, 740 660, 960 660 C1180 660, 1220 600, 1440 600 C1560 600, 1600 585, 1680 575" fill="none" stroke="url(#hg)" stroke-width="5" stroke-linecap="round"/></svg>
    ${hookNodes.map(([ic, label, x, y], i) => `<div class="hn a" id="hn${i}" data-base="translate(-50%,-50%)" style="left:${x}px;top:${y}px"><span class="halo"></span>${tile(ic, { size: 84, tone: i === 2 ? 'sky' : '' })}<b>${label}</b></div>`).join('')}
  </div></section>`

  const s2 = `<section class="scene hero" id="s2"><div class="glow g1"></div><div class="glow g2"></div>
    <div class="a mask" id="wm" style="left:0;right:0;top:150px"><div id="wmIn">${wordmark(178, '#fff')}</div></div>
    <div class="a center tag" id="tag" style="top:380px">Grow on purpose.</div>
    <div class="a center sub2" id="sub2" style="top:470px">Formations, approvals, skills and people, in one workspace.</div>
    <div class="persp a fill">${fwin('w2a', 860, 538, ['formations-catalog'], '/formations', 'left:150px;top:600px')}${fwin('w2b', 860, 538, ['feed'], '/feed', 'left:910px;top:610px')}</div>
  </section>`

  const s3 = `<section class="scene ember" id="s3"><div class="dots"></div>
    <div class="a kick" id="k3" style="left:120px;top:104px">The problem</div>
    <h2 class="big a" id="h3" style="left:120px;top:146px;font-size:86px">Growth gets <span class="grad-ember">lost</span> between tools.</h2>
    <svg class="a" width="1920" height="1080" style="left:0;top:0">${tangle.map((d, i) => `<path id="tg${i}" d="${d}" fill="none" stroke="${i % 3 ? '#ff8a6b' : '#f2554a'}" stroke-width="2.6" stroke-dasharray="9 11" stroke-linecap="round"/>`).join('')}</svg>
    ${[[E, 'User', 'Employee'], [M, 'Users', 'HR · Manager']].map(([[x, y], ic, label], i) => `<div class="pn a" id="pn${i}" data-base="translate(-50%,-50%)" style="left:${x}px;top:${y}px">${tile(ic, { size: 104, tone: 'ember' })}<b>${label}</b></div>`).join('')}
    ${tools.map(([ic, label, x, y], i) => `<div class="tool a" id="t3${i}" style="left:${x}px;top:${y}px">${tile(ic, { size: 72, tone: 'ember', soft: true })}<span>${label}</span></div>`).join('')}
    ${questions.map(([ic, q, x, y], i) => `<div class="q a" id="q3${i}" data-base="translate(-50%,-50%)" style="left:${x}px;top:${y}px">${icon(ic, 22, 2.2)}${q}</div>`).join('')}
  </section>`

  const overlays = `${[0, 1, 2].map((i) => `<span class="band a" id="band${i}"></span><span class="tk a" id="tk${i}"></span>`).join('')}<span class="glow4 a" id="glow4"></span>
    <span class="ok a" id="ok4">${icon('Check', 20, 2.8)} Approved</span><span class="ping a" id="ping0"></span><span class="ping a" id="ping1"></span><span class="rip a" id="rip"></span>${GUN}`
  const s4 = `<section class="scene paper" id="s4"><div class="dots"></div>
    <div class="a kick" id="k4" style="left:120px;top:150px">The solution</div>
    <h2 class="big a" id="h4" style="left:120px;top:190px;font-size:68px">One <span class="grad">clear path.</span></h2>
    <div class="rail a" id="rail"><i id="railFill"></i></div>
    <div class="steps a">${steps.map(([ic, h, p], i) => `<div class="step" id="st${i}"><span class="nd">${icon(ic, 26, 2.1)}</span><div><small>0${i + 1}</small><h4>${h}</h4><p>${p}</p></div></div>`).join('')}</div>
    <div class="persp a fill">${fwin('w4', 1160, 688, ['formations-catalog', 'formation-drawer', 'reviews', 'dashboard-employee', 'notifications', 'promotion'], '/formations', 'left:640px;top:176px', overlays)}</div>
  </section>`

  const s5 = `<section class="scene paper" id="s5"><div class="dots"></div><div class="glow g3"></div>
    ${fwin('w5', 1440, 810, ['team-hub', 'feed', 'cv-loading', 'cv-results', 'skills'], '/team', 'left:240px;top:50px')}
    <div class="persp a fill" id="themes">${[['dashboard-employee', 'Frost'], ['dashboard-employee-ember', 'Dark'], ['dashboard-employee-light', 'Light']].map(([n, label], i) => `<div class="a th" id="th${i}">${fwin(`tw${i}`, 760, 475, [n], '/', 'position:relative')}<span class="thl">${label}</span></div>`).join('')}</div>
    ${lowerThird('lt0', 1, 5, 'MessagesSquare', 'sky', 'Team hub', 'Chat with your team and see who’s around.')}
    ${lowerThird('lt1', 2, 5, 'Newspaper', '', 'Feed', 'Share wins with photos. Follow colleagues.')}
    ${lowerThird('lt2', 3, 5, 'Compass', 'violet', 'Career compass', 'Drop your CV. It’s read in seconds.', 'Strengths, gaps, and the formations that close them.')}
    ${lowerThird('lt3', 4, 5, 'TrendingUp', 'good', 'Skills evolution', 'Mastery grows with every formation and certificate.')}
    ${lowerThird('lt4', 5, 5, 'Palette', 'warn', 'Three themes', 'Frost, Dark and Light, on every page.')}
  </section>`

  const s6 = `<section class="scene night" id="s6"><div class="dots"></div>
    <div class="a kick" id="k6" style="left:120px;top:86px">Under the hood</div>
    <h2 class="big a" id="h6" style="left:120px;top:124px;font-size:66px">Full stack, tested <span class="gnight">end to end.</span></h2>
    <svg class="a" width="1920" height="1080" style="left:0;top:0"><defs><marker id="ah" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#6cc4ff"/></marker></defs>
      <path id="ar0" d="M566 425 L732 425" class="arw" marker-end="url(#ah)"/><path id="ar1" d="M1186 425 L1352 425" class="arw" marker-end="url(#ah)"/>
      <path id="ar2" d="M960 330 C960 262, 340 262, 340 322" class="arw dash" marker-end="url(#ah)"/>
      <circle id="dot0" r="5" fill="#bfe3ff"/><circle id="dot2" r="6" fill="#bfe3ff"/>
      ${services.map((_, i) => `<path id="sc${i}" d="M960 520 C960 560, ${760 + i * 300} 556, ${760 + i * 300} 598" class="con"/>`).join('')}</svg>
    <div class="a albl" id="al0" style="left:649px;top:384px">REST · JSON</div><div class="a albl" id="al1" style="left:1269px;top:384px">SQL</div>
    <div class="a albl live" id="al2" style="left:650px;top:252px">${icon('Radio', 16, 2.2)} Live push · SSE</div>
    ${arch.map(([slug, h, p, k], i) => `<div class="arch a" id="c6${i}" style="left:${120 + i * 620}px;top:330px"><span class="logo" style="width:72px;height:72px">${brand(slug, 40, slug === 'express' ? '#0e1a2f' : undefined)}</span><div><small>${k}</small><b>${h}</b><p>${esc(p)}</p></div></div>`).join('')}
    ${services.map(([ic, h, p], i) => `<div class="svc a" id="sv${i}" style="left:${620 + i * 300}px;top:600px">${tile(ic, { size: 48, soft: true })}<div><b>${h}</b><p>${esc(p)}</p></div></div>`).join('')}
    ${stats.map(([v, l], i) => `<div class="stat6 a" id="n6${i}" style="left:${120 + i * 620}px;top:742px"><b class="gnight" id="nv${i}" data-v="${v}">${v}</b><span>${l}</span></div>`).join('')}
    <div class="a logos" id="lg6"><small>Built with</small>${logos.map((s, i) => `<span id="lg${i}">${brand(s, 40, '#d6e6ff')}</span>`).join('')}</div>
  </section>`

  const s7 = `<section class="scene hero" id="s7"><div class="glow g1"></div><div class="glow g2"></div>
    <div class="persp a fill">${fwin('w7', 1400, 788, ['org-panel'], '/', 'left:260px;top:96px')}</div>
    <div class="lt a" id="lt7" style="left:120px;bottom:60px">${tile('Building2', { size: 76, tone: 'indigo' })}<div><small>For HR and managers</small><b>The whole organisation</b><span class="sub">Teams, requests and skills at a glance.</span></div></div>
    <div class="a fill" id="end">
      <div class="a mask" id="ewm" style="left:0;right:0;top:300px"><div id="ewmIn">${wordmark(196, '#fff')}</div></div>
      <div class="a center tag" id="etag" style="top:552px">Grow on purpose.</div>
      <div class="a center chips7" id="echips">${endChips.map(([ic, l], i) => `<span class="chip" id="ec${i}">${icon(ic, 20, 2.1)}${l}</span>`).join('')}</div>
      <div class="a center credit" id="ecredit">${esc(content.author)} · ${esc(content.year)}</div>
    </div>
  </section>`

  const data = { hookN: hook.length, tangleN: tangle.length, toolsN: tools.length, qN: questions.length, STEP, FEAT, CLICKS, length: LENGTH, logosN: logos.length, chipsN: endChips.length }
  const css = fs.readFileSync(path.join(here, 'film.css'), 'utf8')
  return doc('CareerHive — film', [`<div id="stage">${s1}${s2}${s3}${s4}${s5}${s6}${s7}<div class="vig a fill"></div><div class="a fill" id="flash"></div><div class="a fill" id="black"></div></div>
<script>window.FILM = ${JSON.stringify(data)};(${runtime.toString()})()</script>`], css)
}

// ---------- the in-page timeline: seek(t) sets every visible element from t alone ----------
function runtime() {
  const D = window.FILM, STEP = D.STEP
  const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x))
  const pr = (t, a, b) => cl((t - a) / (b - a))
  const eo = (p) => 1 - (1 - p) ** 3
  const eo5 = (p) => 1 - (1 - p) ** 5
  const eio = (p) => (p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2)
  const back = (p) => { const c = 1.7; return 1 + (c + 1) * (p - 1) ** 3 + c * (p - 1) ** 2 }
  const lerp = (a, b, p) => a + (b - a) * p
  const lr = (a, b, p) => a.map((v, i) => lerp(v, b[i], p))
  const $ = (id) => (typeof id === 'string' ? document.getElementById(id) : id)
  const css = (id, o, tf = '', blur = 0) => {
    const el = $(id)
    el.style.opacity = o
    el.style.transform = `${el.dataset.base || ''} ${tf}`
    el.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : ''
  }
  const rise = (id, t, a, { d = 0.75, dy = 36, blur = 10, out, outD = 0.35, outY = -24 } = {}) => {
    const p = eo(pr(t, a, a + d)), q = out == null ? 0 : eio(pr(t, out - outD, out))
    css(id, p * (1 - q), `translate3d(0, ${(1 - p) * dy + q * outY}px, 0)`, (1 - p) * blur + q * 8)
  }
  const pop = (id, t, a, { d = 0.55, out, outD = 0.3 } = {}) => {
    const p = pr(t, a, a + d), q = out == null ? 0 : eio(pr(t, out - outD, out))
    css(id, cl(p * 4) * (1 - q), `scale(${Math.max(0.001, back(p) * (1 - q * 0.25))})`)
  }
  const show = (id, on) => { $(id).style.display = on ? '' : 'none' }

  // camera: show region r = [x, y, w, h] of a 1440×900 capture in a window view
  const cam = (img, r) => { const v = $(img).parentNode, s = v.dataset.w / r[2]; $(img).style.transform = `translate3d(${-r[0] * s}px, ${-r[1] * s}px, 0) scale(${s})` }
  const view = (r, vw, x, y) => { const s = vw / r[2]; return [(x - r[0]) * s, (y - r[1]) * s, s] }
  const place = (id, xy, o, tf = '') => { const el = $(id); el.style.left = `${xy[0]}px`; el.style.top = `${xy[1]}px`; el.style.opacity = o; el.style.transform = `translate(-50%, -50%) ${tf}` }
  const pulse = (id, xy, t, a, d = 0.65, s0 = 0.4, s1 = 2.2) => { const p = pr(t, a, a + d); place(id, xy, p > 0 && p < 1 ? (1 - p) * 0.95 : 0, `scale(${lerp(s0, s1, eo(p))})`) }

  const hline = $('hline'), hlen = hline.getTotalLength()
  hline.style.strokeDasharray = `${hlen}`
  for (const id of ['ar0', 'ar1', 'ar2']) { const p = $(id); p.dataset.len = p.getTotalLength() }
  ;['w2a', 'w2b', 'w7'].forEach((w) => $(w + '-view').querySelectorAll('img').forEach((img) => cam(img, [0, 0, 1440, 900])))
  // themes: the sidebar's theme switch and the formations row, in each theme
  ;['tw0', 'tw1', 'tw2'].forEach((w) => $(w + '-view').querySelectorAll('img').forEach((img) => cam(img, [0, 400, 800, 500])))

  const F = {}

  F.s1 = (t) => {
    for (let i = 0; i < D.hookN; i++) rise('hw' + i, t, 0.12 + i * 0.13, { dy: 54, blur: 16, d: 0.8 })
    hline.style.strokeDashoffset = `${hlen * (1 - eio(pr(t, 0.55, 2.55)))}`
    for (let i = 0; i < 3; i++) { pop('hn' + i, t, 1.0 + i * 0.5); $('hn' + i).querySelector('.halo').style.opacity = `${(1 - pr(t, 1.0 + i * 0.5, 1.9 + i * 0.5)) * (t > 1.0 + i * 0.5 ? 1 : 0)}`; $('hn' + i).querySelector('.halo').style.transform = `translate(-50%,-50%) scale(${lerp(0.6, 2.4, eo(pr(t, 1.0 + i * 0.5, 1.9 + i * 0.5)))})` }
    $('s1in').style.transform = `scale(${1 + 0.05 * pr(t, 0, 3) + 0.22 * eio(pr(t, 2.65, 3.1))})`
  }

  F.s2 = (t) => {
    const p = eo5(pr(t, 3.05, 4.0))
    $('wmIn').style.transform = `translate3d(0, ${(1 - p) * 105}%, 0)`
    rise('tag', t, 3.7, { dy: 30 })
    rise('sub2', t, 3.95, { dy: 24 })
    const a = eo5(pr(t, 4.35, 5.5)), b = eo5(pr(t, 4.55, 5.7)), drift = pr(t, 4.35, 8)
    css('w2a', cl(a * 2), `translate3d(0, ${(1 - a) * 520 - drift * 40}px, 0) rotateX(${18 - drift * 5}deg) rotateY(14deg) rotateZ(-2deg)`)
    css('w2b', cl(b * 2), `translate3d(0, ${(1 - b) * 560 - drift * 60}px, 0) rotateX(${18 - drift * 5}deg) rotateY(-14deg) rotateZ(2deg)`)
  }

  F.s3 = (t) => {
    rise('k3', t, 7.95); rise('h3', t, 8.05, { dy: 44, d: 0.8 })
    for (let i = 0; i < 2; i++) pop('pn' + i, t, 8.35 + i * 0.25)
    for (let i = 0; i < D.toolsN; i++) {
      const p = pr(t, 8.6 + i * 0.14, 9.15 + i * 0.14)
      css('t3' + i, cl(p * 3), `translate(-50%, -50%) translate3d(${Math.sin(t * 1.4 + i * 2.1) * 6}px, ${Math.cos(t * 1.1 + i) * 8}px, 0) scale(${Math.max(0.001, back(p))}) rotate(${Math.sin(t * 0.9 + i) * 3}deg)`)
    }
    for (let i = 0; i < D.tangleN; i++) { const el = $('tg' + i); el.style.opacity = `${pr(t, 9.0 + i * 0.1, 9.45 + i * 0.1) * 0.85}`; el.style.strokeDashoffset = `${-(t - 9) * (i % 2 ? 46 : -38)}` }
    for (let i = 0; i < D.qN; i++) { pop('q3' + i, t, 10.1 + i * 0.45); const el = $('q3' + i); el.style.transform += ` translateY(${Math.sin(t * 1.6 + i) * 5}px)` }
  }

  // solution: one window, four steps, a cursor that clicks through the real screens
  const S4 = [
    { imgs: [['formations-catalog', 12.5], ['formation-drawer', 15.12]], route: '/formations', cam: [[0, 0, 1440, 854], [150, 40, 1180, 700]] },
    { imgs: [['reviews', STEP[1] - 0.05]], route: '/reviews', cam: [[300, 60, 1140, 676], [330, 130, 1100, 652]] },
    { imgs: [['dashboard-employee', STEP[2] - 0.05], ['notifications', 19.4]], route: '/', cam: [[850, 18, 590, 350], [905, 30, 535, 317]] },
    { imgs: [['promotion', STEP[3] - 0.05]], route: '/promotion', cam: [[290, 60, 1150, 682], [330, 230, 1000, 593]] },
  ]
  const CUR = [
    { step: 0, show: [13.75, 15.6], path: [[13.75, 1150, 790], [14.85, 470, 365]] },
    { step: 1, show: [16.45, 18.45], path: [[16.45, 760, 660], [17.35, 1181, 401], [17.62, 1181, 401], [18.2, 1238, 520]] },
    { step: 2, show: [18.75, 20.7], path: [[18.75, 1130, 280], [19.25, 1271, 72], [19.7, 1271, 72], [20.3, 1185, 210]] },
  ]
  const curAt = (c, t) => {
    const k = c.path
    if (t <= k[0][0]) return [k[0][1], k[0][2]]
    for (let i = 1; i < k.length; i++) {
      if (t <= k[i][0]) { const p = eio(pr(t, k[i - 1][0], k[i][0])), arc = Math.sin(Math.PI * p) * Math.min(60, Math.hypot(k[i][1] - k[i - 1][1], k[i][2] - k[i - 1][2]) * 0.12); return [lerp(k[i - 1][1], k[i][1], p) - arc * 0.4, lerp(k[i - 1][2], k[i][2], p) - arc] }
    }
    return [k[k.length - 1][1], k[k.length - 1][2]]
  }
  F.s4 = (t) => {
    rise('k4', t, 12.75); rise('h4', t, 12.85, { dy: 40 })
    const si = t < STEP[1] ? 0 : t < STEP[2] ? 1 : t < STEP[3] ? 2 : 3
    for (let i = 0; i < 4; i++) {
      rise('st' + i, t, 13.0 + i * 0.12, { dy: 22, blur: 6 })
      $('st' + i).className = `step${i === si && t >= STEP[0] ? ' on' : ''}${i < si ? ' done' : ''}`
    }
    $('railFill').style.transform = `scaleY(${cl((si + eio(pr(t, STEP[si], STEP[si] + 0.6)) * (si < 3 ? 1 : 0)) / 3)})`
    const wp = eo5(pr(t, 12.85, 13.75))
    css('w4', cl(wp * 2), `translate3d(${(1 - wp) * 300}px, 0, 0) rotateY(${(1 - wp) * -16}deg)`)
    $('w4-route').textContent = S4[si].route
    // shots: the current step's images fade in over the previous step's last image
    const vw = 1160
    let r
    S4.forEach((s, i) => {
      const live = i === si || (i === si - 1 && t < STEP[si] + 0.3)
      const rc = lr(s.cam[0], s.cam[1], eio(pr(t, STEP[i], STEP[i + 1])))
      if (i === si) r = rc
      s.imgs.forEach(([n, a], j) => {
        const img = 'w4-' + n, next = s.imgs[j + 1]
        const on = live && t >= a && !(next && t >= next[1] + 0.3)
        show(img, on)
        if (!on) return
        $(img).style.opacity = `${eo(pr(t, a, a + 0.28))}`
        cam(img, rc)
      })
    })
    // cursor
    const c = CUR.find((c) => t >= c.show[0] - 0.01 && t <= c.show[1] + 0.25)
    if (c && c.step === si) {
      const [bx, by] = curAt(c, t), xy = view(r, vw, bx, by)
      const click = CLICKSAt(t), press = click >= 0 ? 1 - 0.18 * Math.sin(Math.PI * pr(t, click, click + 0.16)) : 1
      const o = pr(t, c.show[0], c.show[0] + 0.2) * (1 - pr(t, c.show[1], c.show[1] + 0.25))
      const el = $('cur'); el.style.opacity = o; el.style.transform = `translate(${xy[0]}px, ${xy[1]}px) scale(${press})`
      const k = D.CLICKS.find((x) => t >= x && t < x + 0.6)
      if (k != null) { const p = pr(t, k, k + 0.6); place('rip', view(r, vw, ...curAt(c, k)), (1 - p) * 0.9, `scale(${lerp(0.2, 1.6, eo(p))})`) } else $('rip').style.opacity = 0
    } else { $('cur').style.opacity = 0; $('rip').style.opacity = 0 }
    // state changes drawn over the screens
    const okOn = si === 1 && t >= 17.55
    place('ok4', view(r, vw, 1182, 399), okOn ? cl(pr(t, 17.55, 17.7)) : 0, `scale(${okOn ? Math.max(0.001, back(pr(t, 17.55, 18.0))) : 0.001})`)
    if (si === 2) { pulse('ping0', view(r, vw, 1271, 68), t, 19.4, 0.7); pulse('ping1', view(r, vw, 1271, 68), t, 19.72, 0.7) } else { $('ping0').style.opacity = 0; $('ping1').style.opacity = 0 }
    const rows = [[338, 490, 871, 554], [338, 566, 871, 631], [338, 642, 871, 707]]
    rows.forEach(([x0, y0, x1, y1], i) => {
      const a = 21.6 + i * 0.3, el = $('band' + i)
      if (si !== 3) { el.style.opacity = 0; return }
      const [l, tp, s] = view(r, vw, x0, y0)
      el.style.left = `${l}px`; el.style.top = `${tp}px`; el.style.width = `${(x1 - x0) * s}px`; el.style.height = `${(y1 - y0) * s}px`
      el.style.opacity = `${eo(pr(t, a, a + 0.25))}`; el.style.transform = `scale(${lerp(1.06, 1, eo(pr(t, a, a + 0.4)))})`
      pulse('tk' + i, view(r, vw, 370, (y0 + y1) / 2), t, a, 0.6, 0.5, 2.4)
    })
    if (si === 3) { const [l, tp, s] = view(r, vw, 1188, 296); const el = $('glow4'); el.style.left = `${l}px`; el.style.top = `${tp}px`; el.style.width = `${88 * s}px`; el.style.height = `${32 * s}px`; el.style.opacity = `${eo(pr(t, 22.65, 22.9))}`; el.style.transform = `scale(${lerp(1.5, 1, eo(pr(t, 22.65, 23.1)))})` } else $('glow4').style.opacity = 0
  }
  const CLICKSAt = (t) => { const k = D.CLICKS.find((x) => t >= x && t < x + 0.16); return k == null ? -1 : k }

  // features: one big window with a slow camera per shot, and a lower-third per feature
  const S5 = [
    ['team-hub', D.FEAT[0], D.FEAT[1], [290, 80, 1150, 647], [560, 250, 820, 461], '/team'],
    ['feed', D.FEAT[1], D.FEAT[2], [290, 60, 1150, 647], [300, 360, 740, 416], '/feed'],
    ['cv-loading', D.FEAT[2], 30.0, [178, 140, 1084, 610], [300, 205, 860, 484], '/profile'], // the whole analysing card: its 3D mark is the CV compass
    ['cv-results', 30.0, D.FEAT[3], [300, 90, 1140, 641], [310, 300, 1000, 563], '/profile'],
    ['skills', D.FEAT[3], D.FEAT[4], [300, 90, 1140, 641], [310, 380, 740, 416], '/skills'],
  ]
  F.s5 = (t) => {
    const wp = eo5(pr(t, 23.35, 24.05)), wout = eio(pr(t, D.FEAT[4] - 0.1, D.FEAT[4] + 0.45))
    css('w5', 1 - wout, `translate3d(0, ${(1 - wp) * 90 - wout * 40}px, 0) scale(${lerp(0.94, 1, wp) * lerp(1, 0.94, wout)})`, wout * 8)
    show('w5', wout < 1)
    S5.forEach(([n, a, b, r0, r1, route], i) => {
      const img = 'w5-' + n, on = t >= a - 0.01 && t < b + 0.4
      show(img, on)
      if (!on) return
      if (t < b) $('w5-route').textContent = route
      const fin = i === 0 ? 1 : eo(pr(t, a, a + 0.4))
      $(img).style.opacity = `${fin}`
      cam(img, lr(r0, r1, eio(pr(t, a - 0.2, b + 0.4))))
    })
    // themes: three dashboards fan out
    const th = t >= D.FEAT[4] - 0.2
    show('themes', th)
    if (th) {
      const f = eo5(pr(t, D.FEAT[4], D.FEAT[4] + 1.0)), drift = pr(t, D.FEAT[4], 38)
      const pos = [[-560, 60, 26, 0.86], [0, -10, 0, 1], [560, 60, -26, 0.86]]
      pos.forEach(([x, y, ry, s], i) => css('th' + i, cl(pr(t, D.FEAT[4] - 0.1 + i * 0.08, D.FEAT[4] + 0.3 + i * 0.08)), `translate3d(${x * f}px, ${y * f - drift * 14 + (1 - f) * 80}px, ${i === 1 ? 0 : -120 * f}px) rotateY(${ry * f}deg) scale(${lerp(0.8, s, f)})`))
    }
    const lts = [[D.FEAT[0], D.FEAT[1]], [D.FEAT[1], D.FEAT[2]], [D.FEAT[2], D.FEAT[3]], [D.FEAT[3], D.FEAT[4]], [D.FEAT[4], D.FEAT[5]]]
    lts.forEach(([a, b], i) => {
      const on = t >= a && t < b + 0.1
      show('lt' + i, on)
      if (!on) return
      const p = eo5(pr(t, a + 0.15, a + 0.8)), q = eio(pr(t, b - 0.3, b))
      css('lt' + i, p * (1 - q), `translate3d(${(1 - p) * -60 + q * -30}px, 0, 0)`, (1 - p) * 8)
    })
    const sw = pr(t, 30.0, 30.4)
    $('lt2-a').style.opacity = 1 - sw; $('lt2-b').style.opacity = sw
  }

  F.s6 = (t) => {
    rise('k6', t, 37.95); rise('h6', t, 38.05, { dy: 40 })
    for (let i = 0; i < 3; i++) rise('c6' + i, t, 38.35 + i * 0.2, { dy: 40 })
    ;[['ar0', 39.0], ['ar1', 39.2], ['ar2', 39.6]].forEach(([id, a], i) => { const el = $(id), len = +el.dataset.len, p = eio(pr(t, a, a + 0.6)); el.style.strokeDasharray = i === 2 ? `${len * p} ${len}` : `${len}`; el.style.strokeDashoffset = i === 2 ? '0' : `${len * (1 - p)}`; el.style.opacity = p > 0 ? 1 : 0; el.setAttribute('marker-end', p > 0.92 ? 'url(#ah)' : '') })
    ;[['dot0', 'ar0', 39.6, 1.1], ['dot2', 'ar2', 40.2, 1.4]].forEach(([id, path, a, per]) => { const el = $(id), p = $(path), on = t >= a; el.style.opacity = on ? 1 - ((t - a) % per) / per * 0.3 : 0; if (on) { const pt = p.getPointAtLength((((t - a) % per) / per) * +p.dataset.len); el.setAttribute('cx', pt.x); el.setAttribute('cy', pt.y) } })
    rise('al0', t, 39.25, { dy: 10, blur: 4 }); rise('al1', t, 39.45, { dy: 10, blur: 4 }); rise('al2', t, 40.0, { dy: 10, blur: 4 })
    for (let i = 0; i < 4; i++) { rise('sv' + i, t, 40.3 + i * 0.12, { dy: 24 }); $('sc' + i).style.opacity = `${pr(t, 40.2 + i * 0.12, 40.6 + i * 0.12) * 0.6}` }
    for (let i = 0; i < 3; i++) { rise('n6' + i, t, 40.9 + i * 0.15, { dy: 30 }); const el = $('nv' + i); el.textContent = Math.round(+el.dataset.v * eo(pr(t, 41.0 + i * 0.15, 42.3 + i * 0.15))) }
    rise('lg6', t, 41.8, { dy: 20 })
    for (let i = 0; i < D.logosN; i++) pop('lg' + i, t, 41.9 + i * 0.07, { d: 0.45 })
  }

  F.s7 = (t) => {
    const a = eo5(pr(t, 44.35, 45.15)), out = eio(pr(t, 46.25, 46.85))
    show('w7', out < 1)
    css('w7', 1 - out, `translate3d(0, ${(1 - a) * 140 - out * 30}px, 0) rotateX(${(1 - a) * 22 + out * 10}deg) scale(${lerp(0.9, 1, a) * lerp(1, 0.9, out)})`, out * 12)
    cam('w7-org-panel', lr([0, 0, 1440, 810], [300, 60, 1100, 619], eio(pr(t, 44.4, 46.8))))
    rise('lt7', t, 44.8, { dy: 0, out: 46.4 })
    $('lt7').style.transform += ` translateX(${(1 - eo5(pr(t, 44.8, 45.5))) * -60}px)`
    const e = t >= 46.4
    show('end', e)
    if (!e) return
    const p = eo5(pr(t, 46.55, 47.45))
    $('ewmIn').style.transform = `translate3d(0, ${(1 - p) * 105}%, 0)`
    rise('etag', t, 47.05, { dy: 30 })
    css('echips', 1, '')
    for (let i = 0; i < D.chipsN; i++) rise('ec' + i, t, 47.4 + i * 0.09, { dy: 18, blur: 6 })
    rise('ecredit', t, 48.0, { dy: 12, blur: 4 })
    $('end').style.transform = `scale(${1 + 0.025 * pr(t, 46.5, 50)})`
  }

  const SCENES = [['s1', 0, 3.1, 'cut'], ['s2', 2.95, 7.95, 'cut'], ['s3', 7.72, 12.85, 'circle'], ['s4', 12.5, 23.8, 'wipe'], ['s5', 23.3, 38.2, 'fade'], ['s6', 37.7, 44.55, 'circle'], ['s7', 44.36, 99, 'cut']]
  window.seek = (t) => {
    for (const [id, a, b, how] of SCENES) {
      const on = t >= a && t < b, el = $(id)
      el.style.display = on ? 'block' : 'none'
      if (!on) continue
      const p = eo(pr(t, a, a + 0.5))
      el.style.opacity = how === 'fade' ? p : 1
      el.style.clipPath = how === 'circle' && p < 1 ? `circle(${p * 75}% at 50% 52%)` : how === 'wipe' && p < 1 ? `inset(${(1 - p) * 100}% 0 0 0 round ${(1 - p) * 60}px)` : ''
      F[id](t)
    }
    const flash = Math.max(...[[3.0, 0.75], [44.4, 0.6]].map(([k, m]) => (t < k ? pr(t, k - 0.18, k) : 1 - eo(pr(t, k, k + 0.55))) * m))
    $('flash').style.opacity = flash
    $('black').style.opacity = eio(pr(t, D.length - 0.75, D.length - 0.05))
  }
}

// ---------- render ----------
async function main() {
  const args = process.argv.slice(2)
  const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined }
  const htmlPath = path.join(here, 'film.html')
  fs.writeFileSync(htmlPath, build())

  const browser = await playwright.chromium.launch({ channel: 'chrome' })
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle' })
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map((i) => i.decode().catch(() => {}))) })
  if (errors.length) throw new Error(errors.join('\n'))

  if (args.includes('--poster')) {
    await page.evaluate((t) => window.seek(t), POSTER_AT)
    await page.screenshot({ path: POSTER })
    await browser.close()
    console.log(path.relative(root, POSTER))
    return
  }
  const stills = opt('--stills')
  if (stills) {
    const dir = opt('--dir') ?? path.join(os.tmpdir(), 'careerhive-film-stills')
    fs.mkdirSync(dir, { recursive: true })
    for (const t of stills.split(',').map(Number)) {
      await page.evaluate((t) => window.seek(t), t)
      await page.screenshot({ path: path.join(dir, `t${t.toFixed(2).padStart(5, '0')}.png`) })
    }
    console.log(`stills → ${dir}`)
    if (errors.length) console.error(errors.join('\n'))
    await browser.close()
    return
  }

  const wav = path.join(os.tmpdir(), 'careerhive-film.wav')
  writeWav(wav, { length: LENGTH, cues: CUES })
  const ffmpeg = process.env.FFMPEG || 'ffmpeg'
  const enc = spawn(ffmpeg, ['-y', '-hide_banner', '-loglevel', 'error',
    '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-i', wav,
    '-map', '0:v', '-map', '1:a',
    '-vf', 'scale=in_range=full:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt709,format=yuv420p',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-profile:v', 'high', '-level', '4.2', '-g', '60', '-bf', '2',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', '-shortest', OUT], { stdio: ['pipe', 'inherit', 'inherit'] })
  const done = once(enc, 'close')
  const frames = LENGTH * FPS, started = Date.now()
  for (let f = 0; f < frames; f++) {
    await page.evaluate((t) => window.seek(t), f / FPS)
    const jpg = await page.screenshot({ type: 'jpeg', quality: 95 })
    if (!enc.stdin.write(jpg)) await once(enc.stdin, 'drain')
    if (f % 150 === 0) console.log(`frame ${f}/${frames} · ${((Date.now() - started) / 1000).toFixed(0)} s`)
  }
  enc.stdin.end()
  const [code] = await done
  if (code !== 0) throw new Error(`ffmpeg exited with ${code}`)
  await page.evaluate((t) => window.seek(t), POSTER_AT)
  await page.screenshot({ path: POSTER })
  await browser.close()
  if (errors.length) console.error(errors.join('\n'))
  console.log(`${path.relative(root, OUT)} · ${(fs.statSync(OUT).size / 1e6).toFixed(1)} MB · ${((Date.now() - started) / 60000).toFixed(1)} min`)
}

await main()
