// The 16:9 sequences of the CareerHive film (1920×1080). Each takes its start time t0 and returns HTML layers; the
// incoming scene owns the transition (iris, floor, wipe, dive). Screens are real captures (built-in demo data); numbers
// shown as counters are the values on those screens.
import { at, counter, cover, crop, cursor, el, EMBLEM_CREDIT, emblem, esc, focusIn, focusOut, hexPath, honeycomb, icon, iris, join, kf, layer, logo, lowerThird, ping, sceneK, stat, sweep, wipe, wordmark, words, chars } from './toolkit.mjs'

const W = 1920, H = 1080, CX = W / 2, CY = H / 2

/* ---------- capture regions (1440×900 capture pixels) ---------- */
export const R = {
  dash: [300, 92, 1012, 776], // org panel: KPI row → top skills
  kpi: [[315, 108, 233, 138], [563, 108, 233, 138], [811, 108, 233, 138], [1059, 108, 233, 138]],
  weekly: [315, 266, 558, 356], pipe: [893, 266, 400, 356], waiting: [315, 641, 558, 220], topSkills: [893, 641, 400, 220],
  catalog: [300, 60, 1012, 800], kubeCard: [315, 286, 313, 283], drawer: [844, 16, 580, 866],
  reviewForm: [333, 209, 939, 227], approveBtn: [1181, 399],
  panel: [922, 101, 374, 619], toasts: [[929, 229, 363, 70], [929, 301, 363, 88], [929, 425, 363, 104], [929, 536, 363, 61]],
  bubble1: [684, 437, 246, 96], bubble2: [855, 545, 207, 56], post: [317, 403, 655, 439],
  cvHero: [315, 150, 978, 288], cvSteps: [536, 536, 274, 166], cvMatches: [315, 731, 978, 130],
  skillsKpi: [315, 243, 977, 125], radar: [315, 389, 414, 360], checklist: [315, 245, 578, 484], history: [913, 245, 380, 184],
  avatars: [49, 189, 232, 127], ring63: [880, 428, 94, 92], chipsFound: [336, 534, 431, 60], approved: [1195, 300, 74, 23],
  // visual crops (rings, covers, charts) for honeycomb cells
  cvRing: [1100, 210, 160, 170], ring34: [335, 262, 120, 120], kubeCover: [478, 288, 160, 150], grafanaCover: [480, 625, 150, 110], bars: [540, 380, 250, 200],
}

/* ---------- small helpers ---------- */
const num = (n) => String(n).padStart(2, '0')
const bg = (kind, k, extra = '') => layer({ cls: `bg-${kind}`, k, inner: `<div class="hexgrid"></div>${extra}` })
const kicker = (x, y, t0, t1, text, { light = false, align = 'center' } = {}) => el({ x, y, base: align === 'left' ? 'translate(0,-50%)' : 'translate(-50%,-50%)', cls: 'mono', style: `font-size:17px;color:${light ? 'rgba(255,255,255,.82)' : 'var(--blue)'}`, k: join(focusIn(t0, { b: 6, s0: 1, dy: 8 }), focusOut(t1 - 0.3, { b: 4 })), inner: esc(text) })
const headline = (x, y, t0, t1, text, { size = 64, light = false, align = 'center', cls = '' } = {}) => el({ x, y, base: align === 'left' ? 'translate(0,-50%)' : 'translate(-50%,-50%)', cls: `disp ${cls}`, style: `font-size:${size}px;color:${light ? '#fff' : 'var(--ink)'}`, inner: words(text, t0, { out: t1 }) })
const card = (shot, r, width, { x, y, k, cls = '', inner = '' }) => el({ x, y, k, inner: crop(shot, r, width, { cls }) + inner })
const ghost = (x, y, t0, t1, text, { size = 260, light = false, style = '' } = {}) => el({ x, y, cls: `ghost ${light ? 'light' : ''}`, style: `font-size:${size}px;${style}`, k: [{ t: t0, o: 0, s: 1.08, b: 6 }, { t: t0 + 0.5, o: 1, s: 1, b: 0 }, { t: t1 - 0.4, s: 0.97 }, { t: t1, o: 0, b: 4, e: 'inout' }], inner: esc(text) })
const floorIn = (t, kind, until) => layer({ cls: `bg-${kind}`, style: 'transform-origin:50% 100%', k: [{ t: t - 0.001, o: 0, sy: 0 }, { t, o: 1 }, { t: t + 0.45, sy: 1, e: 'expo' }, { t: until - 0.001, o: 1 }, { t: until, o: 0, e: 'linear' }], inner: '<div class="hexgrid"></div>' })
/** A stage-wide hexagon outline that draws itself. */
const hexOutline = (x, y, r, t0, d, { stroke = 'rgba(143,208,255,.65)', width = 2, k } = {}) => el({ x, y, w: r * 2 + 8, h: r * 2 + 8, k, inner: `<svg width="${r * 2 + 8}" height="${r * 2 + 8}" viewBox="${-r - 4} ${-r - 4} ${r * 2 + 8} ${r * 2 + 8}"><path d="${hexPath(r)}" fill="none" stroke="${stroke}" stroke-width="${width}" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" data-draw='${JSON.stringify({ t0, t1: t0 + d })}'/></svg>` })
// the product's CV coach mark (careerhive-ui/src/components/CvMark.jsx), in Frost colours
const cvMark = (size) => `<svg width="${size}" height="${size}" viewBox="0 0 48 48"><defs><linearGradient id="cvg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5fb2ff"/><stop offset="1" stop-color="#2f7bf6"/></linearGradient></defs>
<rect x="1" y="1" width="46" height="46" rx="14" fill="url(#cvg)"/><path d="M13 9.5h13.2L34 17.3v19.2a3 3 0 0 1-3 3H13a3 3 0 0 1-3-3v-24a3 3 0 0 1 3-3z" fill="#fff"/>
<path d="M26.2 9.5v5.8a2 2 0 0 0 2 2H34z" fill="url(#cvg)" opacity=".5"/><circle cx="16.2" cy="16.4" r="2.6" fill="url(#cvg)"/><rect x="20.4" y="14.6" width="6" height="2.1" rx="1.05" fill="url(#cvg)" opacity=".85"/>
<rect x="13.6" y="22" width="12.5" height="1.9" rx=".95" fill="#c9d4e6"/><rect x="13.6" y="25.6" width="9" height="1.9" rx=".95" fill="#c9d4e6"/>
<circle cx="32" cy="33" r="9.6" fill="url(#cvg)" stroke="#fff" stroke-width="2.4"/><g transform="rotate(45 32 33)"><path d="M32 26.4l2.3 6.6h-4.6z" fill="#fff"/><path d="M32 39.6l-2.3-6.6h4.6z" fill="#fff" opacity=".5"/></g><circle cx="32" cy="33" r="1.35" fill="url(#cvg)" stroke="#fff" stroke-width=".8"/></svg>`

/* ======================================================================================================== */
/* OPENING · 0–4.8 s: a signal → a honeycomb → product fragments → the wordmark → a dive into the product      */
/* ======================================================================================================== */
export function opening(t0 = 0, { until = t0 + 4.9 } = {}) {
  const T = (d) => t0 + d
  const cells = honeycomb(2, 78)
  const frags = { 1: ['org-panel', R.kpi[1]], 3: ['formation-drawer', R.ring63], 5: ['promotion', R.ring34], 8: ['cv-results', R.cvRing], 11: ['cv-results', R.chipsFound], 14: ['formations-catalog', R.avatars], 17: ['skills', R.radar] }
  const hw = Math.sqrt(3) * 78, hh = 156
  const cellsHtml = cells.map((c, i) => {
    const tPop = c.ring === 0 ? T(0.95) : T(0.95 + c.ring * 0.16 + i * 0.012)
    const k = [{ t: tPop, o: 0, s: 0.3, x: c.x, y: c.y }, { t: tPop + 0.4, o: 1, s: 1, e: 'back' }, { t: T(2.55), s: 1, x: c.x, y: c.y }, { t: T(3.0), o: 0, s: 0.15, x: c.x * 0.1, y: c.y * 0.1, b: 6, e: 'in' }]
    const f = frags[i]
    const inner = `<svg width="${hw + 6}" height="${hh + 6}" viewBox="${-hw / 2 - 3} ${-hh / 2 - 3} ${hw + 6} ${hh + 6}" style="position:absolute;inset:0"><path d="${hexPath(76)}" fill="rgba(47,123,246,.07)" stroke="rgba(143,208,255,.55)" stroke-width="1.6"/></svg>`
      + (f ? `<div class="a hex" data-base="" style="left:3px;top:3px;width:${hw}px;height:${hh}px" ${kf([{ t: T(1.6 + (i % 7) * 0.09), o: 0, b: 10, s: 1.15 }, { t: T(2.05 + (i % 7) * 0.09), o: 0.95, b: 0, s: 1, e: 'out5' }])}>${cover(f[0], f[1], hw, hh)}</div>` : '')
    return el({ x: CX, y: CY, w: hw + 6, h: hh + 6, k, inner })
  }).join('')
  return [
    bg('black', sceneK(t0, until, { cut: true, cutOut: true })),
    layer({ cls: 'bg-night', k: [{ t: T(0.6), o: 0 }, { t: T(1.8), o: 1, e: 'inout' }, { t: until - 0.001, o: 1 }, { t: until, o: 0, e: 'linear' }], inner: '<div class="hexgrid"></div>' }),
    // the signal: a single point of light
    el({ x: CX, y: CY, w: 16, h: 16, style: 'border-radius:50%;background:#e8f6ff;box-shadow:0 0 18px 6px rgba(143,208,255,.9),0 0 60px 20px rgba(47,123,246,.55)', k: [{ t: T(0.12), o: 0, s: 0 }, { t: T(0.42), o: 1, s: 1 }, { t: T(0.68), s: 2.1, e: 'out' }, { t: T(0.95), s: 0.9 }, { t: T(2.5), o: 1, s: 1 }, { t: T(2.95), o: 0, s: 0.2, e: 'in' }] }),
    hexOutline(CX, CY, 76, T(0.5), 0.45, { k: [{ t: T(0.5), o: 1 }, { t: T(0.95), o: 1 }, { t: T(1.1), o: 0 }] }),
    cellsHtml,
    // flash on the hit: the hive becomes the app's emblem (one coin turn, like the app's loading screen), the wordmark
    // rises letter by letter beneath it inside a drawn hexagon; then everything dives toward the camera (scaling about the centre)
    layer({ style: 'background:#dff1ff', k: [{ t: T(2.92), o: 0 }, { t: T(3.0), o: 0.55, e: 'linear' }, { t: T(3.45), o: 0, e: 'out' }] }),
    hexOutline(CX, CY - 20, 335, T(3.0), 0.7, { stroke: 'rgba(143,208,255,.55)', k: [{ t: T(3.0), o: 1, s: 1 }, { t: T(3.95), s: 1.04 }, { t: T(4.6), s: 3.4, o: 0, e: 'in' }] }),
    el({ x: CX, y: CY - 150, k: [{ t: T(2.95), o: 0, s: 0.55, b: 10 }, { t: T(3.35), o: 1, s: 1, b: 0, e: 'out5' }, { t: T(3.95), s: 1.03 }, { t: T(4.55), s: 3.2, o: 0, b: 14, y: -330, e: 'in' }], inner: emblem(200, { tone: 'frost', spin: [T(2.98), 0.95] }) }),
    el({ x: CX, y: CY + 52, k: [{ t: T(3.0), o: 1, s: 1 }, { t: T(3.95), s: 1.03 }, { t: T(4.55), s: 3.2, o: 0, b: 14, y: 114, e: 'in' }], inner: `<span class="wordmark" style="font-size:150px;color:#fff">${chars('Career', T(3.0), { stagger: 0.035 })}${chars('Hive', T(3.21), { stagger: 0.035, cls: 'grad-light' })}</span>` }),
    el({ x: CX, y: CY + 158, cls: 'mono', style: 'font-size:19px;color:rgba(207,232,255,.85)', k: [{ t: T(3.35), o: 0, b: 6, sx: 1.2 }, { t: T(3.9), o: 1, b: 0, sx: 1, e: 'out5' }, { t: T(4.2), o: 1 }, { t: T(4.5), o: 0, s: 1.6, b: 8, y: 95, e: 'in' }], inner: 'Grow on purpose' }),
  ]
}

/* ======================================================================================================== */
/* PROMISE → PROBLEM → SOLUTION · 4.8–16.8 s: one dashboard that holds together, breaks apart, reassembles     */
/* ======================================================================================================== */
export function dashboardStory(t0 = 4.8, { until = t0 + 12.2 } = {}) {
  const T = (d) => t0 + d // t0 = start of the promise (the iris opens 0.85 s before)
  const DW = 1000, s = DW / R.dash[2], DH = Math.round(R.dash[3] * s)
  const cards = [...R.kpi, R.weekly, R.pipe, R.waiting, R.topSkills].map((r) => ({ r, l: (r[0] - R.dash[0]) * s, t: (r[1] - R.dash[1]) * s, w: r[2] * s, h: r[3] * s }))
  // where each card lands when the dashboard breaks apart (stage coordinates), its turn and size
  const scatter = [[250, 190, -8, 0.78], [1680, 180, 7, 0.78], [270, 905, 6, 0.78], [1660, 915, -6, 0.78], [330, 545, -4, 0.62], [1600, 545, 5, 0.62], [720, 975, 3, 0.58], [1210, 115, -3, 0.58]]
  const hero = [CX, 610] // window centre in the hero shot
  const cardsHtml = cards.map((c, i) => {
    const [tx, ty, rot, sc] = scatter[i]
    // local offset that puts the card's centre on (tx, ty) once the window sits at the stage centre
    const dx = tx - (CX - DW / 2 + c.l + c.w / 2), dy = ty - (CY - DH / 2 + c.t + c.h / 2)
    const lift = i < 4 ? 95 : 35
    const k = [{ t: T(0), x: 0, y: 0, z: 0, r: 0, s: 1 },
      { t: T(2.38) }, { t: T(2.62), x: dx * 0.15, y: dy * 0.15, z: 60, r: rot * 0.3, e: 'in' }, { t: T(3.2), x: dx, y: dy, z: 0, r: rot, s: sc, e: 'out5' },
      { t: T(5.0), x: dx + (i % 2 ? 14 : -12), y: dy + (i % 3 ? -10 : 12), r: rot * 1.15, e: 'inout' }, { t: T(7.1), x: dx, y: dy, r: rot, e: 'inout' },
      { t: T(7.3 + i * 0.05), x: dx, y: dy }, { t: T(8.5 + i * 0.05), x: 0, y: 0, r: 0, s: 1, z: 0, e: 'inout' },
      { t: T(9.55) }, { t: T(10.15), z: lift, e: 'out5' }, { t: T(11.6), z: lift }, { t: T(12.0), z: lift + 160, e: 'in' }]
    return el({ x: c.l, y: c.t, w: c.w, h: c.h, base: '', k, inner: crop('org-panel', c.r, c.w, { radius: 14, cls: 'flat' }) })
  }).join('')
  const plate = `<div class="a fill" data-base="" ${kf([{ t: T(0), o: 1 }, { t: T(2.4), o: 1 }, { t: T(2.7), o: 0, e: 'out' }, { t: T(8.0), o: 0 }, { t: T(8.7), o: 1, e: 'inout' }])}>${crop('org-panel', R.dash, DW, { radius: 22 })}<div class="dim" data-base="" ${kf([{ t: T(9.55), o: 0 }, { t: T(10.2), o: 0.32, e: 'out' }])}></div></div>`
  const win = el({ x: 0, y: 0, w: DW, h: DH, cls: 'p3', base: `translate(${-DW / 2}px,${-DH / 2}px)`, style: `left:0;top:0`, k: [
    { t: T(-0.85), x: 1420, y: 590, s: 0.84, rx: 10, ry: -16 }, { t: T(2.3), x: 1395, y: 585, s: 0.88, rx: 6, ry: -12, e: 'linear' },
    { t: T(2.62), x: CX, y: CY, s: 1, rx: 0, ry: 0, e: 'out5' }, { t: T(7.25), x: CX, y: CY }, { t: T(8.5), x: hero[0], y: hero[1], s: 0.88, e: 'inout' },
    { t: T(9.55), rx: 0, ry: 0 }, { t: T(10.4), rx: 8, ry: -9, s: 0.9, e: 'inout' }, { t: T(11.6), rx: 6, ry: 7, s: 0.94, e: 'inout' }, { t: T(12.0), s: 1.25, e: 'in' },
  ], inner: plate + cardsHtml + `<div class="a" data-base="" style="left:0;top:0;width:${DW}px;height:${DH}px;overflow:hidden;border-radius:22px">${sweep(T(10.3), DW, 1.1)}</div>` })
  return [
    // promise: paper, opened by a hexagonal iris from the wordmark
    layer({ cls: 'bg-paper', style: iris(CX, CY, 1250), k: [{ t: T(-0.85), o: 1, k: 0 }, { t: T(0), k: 1, e: 'inout' }, { t: T(2.62), o: 1 }, { t: T(2.64), o: 0, e: 'linear' }], inner: '<div class="hexgrid"></div>' }),
    // problem: a quieter, colder paper
    layer({ style: 'background:#eef2f7', k: [{ t: T(2.6), o: 0 }, { t: T(2.62), o: 1, e: 'linear' }, { t: T(7.2), o: 1 }, { t: T(7.22), o: 0, e: 'linear' }], inner: '<div class="hexgrid" style="opacity:.35"></div>' }),
    // where growth lives without one place (the book's design rationale, not measured data): one word per beat
    el({ x: CX, y: 372, cls: 'mono', style: 'font-size:17px;color:var(--ember)', k: join(focusIn(T(2.7), { b: 6, s0: 1, dy: 8 }), focusOut(T(6.85), { b: 4 })), inner: 'The problem' }),
    ...[['Spreadsheets.', 2.7], ['Email threads.', 3.5], ['Side chats.', 4.3]].flatMap(([wd, d]) => [
      ghost(CX, CY + 24, T(d - 0.05), T(d + 0.85), wd.slice(0, -1).toUpperCase(), { size: 290, style: '-webkit-text-stroke-color:rgba(242,85,74,.3)' }),
      el({ x: CX, y: CY + 10, cls: 'disp', style: 'font-size:150px;color:var(--ink)', inner: words(wd, T(d), { out: T(d + 0.8), stagger: 0.07, d: 0.45 }) }),
    ]),
    // solution: a blue floor rises
    floorIn(T(7.2), 'hero', until),
    win,
    // promise typography
    el({ x: 140, y: 474, base: 'translate(0,-50%)', cls: 'disp', style: 'font-size:98px;color:var(--ink)', inner: words('YOUR CAREER.', T(0.12), { out: T(2.45) }) }),
    el({ x: 140, y: 578, base: 'translate(0,-50%)', cls: 'disp', style: 'font-size:98px', inner: words('YOUR NEXT MOVE.', T(0.72), { out: T(2.45), cls: 'grad' }) }),
    // problem typography
    el({ x: CX, y: 490, cls: 'disp', style: 'font-size:118px;color:var(--ink)', inner: words('Growth gets', T(5.1), { out: T(6.85) }) }),
    el({ x: CX, y: 610, cls: 'disp', style: 'font-size:118px;color:var(--ink)', inner: `${words('lost', T(5.35), { out: T(6.85), cls: 'ember' })} ${words('in between.', T(5.45), { out: T(6.85) })}` }),
    // solution typography
    kicker(CX, 92, T(7.45), T(9.5), 'The solution · CareerHive', { light: true }),
    el({ x: CX, y: 172, cls: 'disp', style: 'font-size:84px;color:#fff', inner: words('One place for every step.', T(7.55), { out: T(9.5) }) }),
    // hero shot data: the dashboard's own numbers, counted up
    stat({ x: 250, y: 380, t0: T(10.3), t1: T(11.9), to: 97, label: 'enrollments', cls: 'night' }),
    stat({ x: 250, y: 640, t0: T(10.5), t1: T(11.9), to: 58, label: 'certificates', cls: 'night' }),
    stat({ x: 1690, y: 500, t0: T(10.7), t1: T(11.9), to: 4.1, dec: 1, label: 'avg team rating', cls: 'night' }),
  ]
}

/* ======================================================================================================== */
/* LEARN · formations → course content (card morph)                                                          */
/* ======================================================================================================== */
export function learn(t0, { until = t0 + 4.9, n = 1 } = {}) {
  const T = (d) => t0 + d
  const CW = 940, s = CW / R.catalog[2], CH = Math.round(R.catalog[3] * s)
  const [kl, kt] = at(R.catalog, CW, R.kubeCard[0], R.kubeCard[1]), kw = R.kubeCard[2] * s, kh = R.kubeCard[3] * s
  const DWd = 470, DHd = Math.round(R.drawer[3] * DWd / R.drawer[2])
  const catX = 760, catY = 560
  // the card's centre in stage coordinates while it sits in the catalog
  const cardCx = catX - CW / 2 + kl + kw / 2, cardCy = catY - CH / 2 + kt + kh / 2
  const drawer = [1430, 560]
  return [
    layer({ cls: 'bg-paper', k: sceneK(T(-0.4), until, { inD: 0.4, cutOut: true }), inner: '<div class="hexgrid"></div>' }),
    el({ x: catX, y: catY, w: CW, h: CH, k: [{ t: T(-0.35), o: 0, s: 1.14, b: 10, x: 30 }, { t: T(0.25), o: 1, s: 1, b: 0, e: 'out5' }, { t: T(1.8), x: -20, e: 'linear' }, { t: T(2.5), x: -170, s: 0.86, b: 3, e: 'inout' }, { t: T(4.5), x: -190, o: 1 }, { t: T(4.85), o: 0, e: 'inout' }],
      inner: crop('formations-catalog', R.catalog, CW) + `<div class="dim" data-base="" style="border-radius:20px" ${kf([{ t: T(0.9), o: 0 }, { t: T(1.3), o: 0.42, e: 'out' }])}></div>` }),
    // the Kubernetes card lifts out of the catalog and becomes the course drawer
    el({ x: cardCx, y: cardCy, w: kw, h: kh, k: [{ t: T(0.88), o: 0 }, { t: T(0.9), o: 1, e: 'linear' }, { t: T(1.0), x: 0, y: 0, s: 1 }, { t: T(1.45), x: -20 * 0, y: -18, s: 1.12, e: 'back' }, { t: T(1.95) }, { t: T(2.55), x: drawer[0] - cardCx, y: drawer[1] - cardCy, s: DWd / kw, e: 'inout' }, { t: T(2.6), o: 1 }, { t: T(2.85), o: 0, e: 'linear' }],
      inner: crop('formations-catalog', R.kubeCard, kw, { radius: 16 }) + `<div class="a fill" data-base="" style="border-radius:16px;box-shadow:0 0 0 3px #2f7bf6,0 0 40px rgba(47,123,246,.6)" ${kf([{ t: T(1.0), o: 0 }, { t: T(1.4), o: 1 }, { t: T(2.3), o: 0 }])}></div>` }),
    el({ x: drawer[0], y: drawer[1], w: DWd, h: DHd, k: [{ t: T(2.45), o: 0, s: 0.98 }, { t: T(2.8), o: 1, s: 1, e: 'out' }, { t: T(4.5), o: 1, y: -10 }, { t: T(4.85), o: 0, b: 8, e: 'inout' }], inner: crop('formation-drawer', R.drawer, DWd) }),
    stat({ x: 960, y: 350, t0: T(2.75), t1: T(4.75), to: 63, suf: '%', label: 'course progress' }),
    stat({ x: 960, y: 560, t0: T(2.95), t1: T(4.75), to: 5, suf: '/8', label: 'items finished' }),
    lowerThird({ x: 110, y: 985, t0: T(0.6), t1: T(4.75), kicker: `${num(n)} · Learn`, title: 'Formations & course content', line: 'Videos, files and links. Progress follows what you finish.', ic: 'GraduationCap' }),
  ]
}

/* ======================================================================================================== */
/* PROVE · two-stage review: the manager clicks "Final approve"                                              */
/* ======================================================================================================== */
export function prove(t0, { until = t0 + 4.9, n = 2 } = {}) {
  const T = (d) => t0 + d
  const FW = 1240, s = FW / R.reviewForm[2], FH = Math.round(R.reviewForm[3] * s), fx = CX, fy = 480
  const [bx, by] = at(R.reviewForm, FW, ...R.approveBtn), btn = [fx - FW / 2 + bx, fy - FH / 2 + by]
  const click = T(2.0)
  const stages = [['Send', 'Submitted', T(0.6)], ['ClipboardCheck', 'HR review', T(1.0)], ['UserCheck', 'Manager decision', click], ['CircleCheck', 'Approved', click + 0.12]]
  const nodes = stages.map(([ic, label, t], i) => {
    const x = 560 + i * 266
    return el({ x, y: 840, w: 160, h: 110, k: focusIn(T(0.3 + i * 0.08), { dy: 16, b: 6 }), inner: `<div class="node" style="width:160px"><div class="dot" style="position:relative">${icon(ic, 26)}
      <div class="dot ok a" data-base="" style="left:-2px;top:-2px" ${kf([{ t: t - 0.01, o: 0, s: 0.6 }, { t: t + 0.3, o: 1, s: 1, e: 'back' }])}>${icon(ic, 26)}</div></div><b style="color:#fff">${label}</b></div>` })
  }).join('')
  return [
    floorIn(T(0), 'hero', until),
    kicker(CX, 150, T(0.25), T(4.6), `${num(n)} · Prove · two-stage reviews`, { light: true }),
    el({ x: CX, y: 232, cls: 'disp', style: 'font-size:70px;color:#fff', inner: words('HR forwards. The manager decides.', T(0.35), { out: T(4.6) }) }),
    el({ x: fx, y: fy, w: FW, h: FH, k: join(focusIn(T(0.4), { dy: 40, s0: 0.96 }), [{ t: T(2.0), s: 1 }, { t: T(2.06), s: 0.995 }, { t: T(2.2), s: 1 }], focusOut(T(4.55), { b: 10, s1: 1.2 })), inner: crop('reviews', R.reviewForm, FW) }),
    el({ x: btn[0], y: btn[1], cls: 'chip good', style: 'font-size:24px', k: [{ t: click + 0.06, o: 0, s: 0.5 }, { t: click + 0.4, o: 1, s: 1, e: 'back' }, { t: T(4.5), o: 1 }, { t: T(4.8), o: 0 }], inner: `${icon('Check', 24, 3)} Approved` }),
    `<div class="a" data-base="" style="left:560px;top:838px;width:798px;height:4px;border-radius:4px;background:rgba(255,255,255,.25)" ${kf(focusIn(T(0.3), { b: 4 }))}></div>`,
    `<div class="a" data-base="scaleX(var(--k,0))" style="left:560px;top:838px;width:798px;height:4px;border-radius:4px;background:#fff;transform-origin:0 50%" ${kf([{ t: T(0.6), k: 0 }, { t: T(1.0), k: 0.333 }, { t: click, k: 0.666, e: 'inout' }, { t: click + 0.3, k: 1 }])}></div>`,
    nodes,
    cursor([[T(0.9), 1720, 1000], [T(1.85), btn[0] + 6, btn[1] + 4], [T(2.6), btn[0] + 60, btn[1] + 90]], [click], { show: [T(0.9), T(3.3)] }),
  ]
}

/* ======================================================================================================== */
/* LIVE · notifications arrive in real time                                                                  */
/* ======================================================================================================== */
export function live(t0, { until = t0 + 4.9, n = 3 } = {}) {
  const T = (d) => t0 + d
  const PW = 430, PH = Math.round(R.panel[3] * PW / R.panel[2])
  const TW = 560, ys = [395, 535, 695, 850]
  const toasts = R.toasts.map((r, i) => {
    const h = Math.round(r[3] * TW / r[2]), t = T(0.7 + i * 0.6)
    return el({ x: 820, y: ys[i], w: TW, h, k: [{ t, o: 0, x: 260, b: 12 }, { t: t + 0.5, o: 1, x: 0, b: 0, e: 'out5' }, { t: T(4.5), o: 1 }, { t: T(4.85), o: 0, x: -60, b: 8, e: 'inout' }], inner: crop('notifications', r, TW, { radius: 18 }) }) + ping(820 - TW / 2 + 52, ys[i], t + 0.35, { size: 64, n: 1 })
  }).join('')
  return [
    layer({ cls: 'bg-paper', style: wipe, k: [{ t: T(-0.25), o: 1, k: 0 }, { t: T(0.25), k: 1, e: 'inout' }, { t: until - 0.001, o: 1 }, { t: until, o: 0, e: 'linear' }], inner: '<div class="hexgrid"></div>' }),
    el({ x: 0, y: 0, base: 'translate(-50%,-50%)', cls: 'streak', style: 'width:900px;top:0;height:1080px;width:3px', k: [{ t: T(-0.25), o: 1, x: 0, y: 540 }, { t: T(0.25), x: 1920, e: 'inout' }, { t: T(0.3), o: 0 }] }),
    kicker(110, 150, T(0.3), T(4.6), `${num(n)} · Live · real-time notifications`, { align: 'left' }),
    el({ x: 110, y: 228, base: 'translate(0,-50%)', cls: 'disp', style: 'font-size:62px;color:var(--ink)', inner: words('Everyone hears it the moment it moves.', T(0.4), { out: T(4.6) }) }),
    el({ x: 1500, y: 590, w: PW, h: PH, k: join(focusIn(T(0.35), { dx: 80, s0: 1 }), [{ t: T(4.5), o: 1 }, { t: T(4.85), o: 0, b: 8, e: 'inout' }]), inner: crop('notifications', R.panel, PW) }),
    // the bell (the product's notification centre) with its unread count
    el({ x: 300, y: 620, w: 150, h: 150, style: 'border-radius:50%;background:#fff;box-shadow:var(--elev);display:grid;place-items:center;color:var(--blue)', k: join(focusIn(T(0.45), { s0: 0.7 }), [{ t: T(0.7), r: 0 }, { t: T(0.8), r: -16 }, { t: T(0.92), r: 13 }, { t: T(1.04), r: -9 }, { t: T(1.16), r: 0 }, { t: T(4.5), o: 1 }, { t: T(4.85), o: 0 }]), inner: icon('Bell', 64, 2.1) + `<span class="a" data-base="" style="right:6px;top:6px;left:auto;min-width:46px;height:46px;border-radius:23px;background:var(--ember);color:#fff;display:grid;place-items:center;font:800 24px/1 var(--f-display)">${counter({ t0: T(0.7), t1: T(2.6), to: 4 })}</span>` }) + ping(300, 620, T(0.7), { size: 150, n: 2 }),
    toasts,
  ]
}

/* ======================================================================================================== */
/* CONNECT · team chat & the feed                                                                            */
/* ======================================================================================================== */
export function connect(t0, { until = t0 + 4.9, n = 4 } = {}) {
  const T = (d) => t0 + d
  const B1 = 560, B2 = 470, P = 640, PH = Math.round(R.post[3] * P / R.post[2])
  const dots = (x, y, t1, t2) => el({ x, y, w: 120, h: 56, style: 'border-radius:28px;background:rgba(255,255,255,.95);display:flex;align-items:center;justify-content:center;gap:10px;box-shadow:var(--elev)', k: [{ t: t1, o: 0, s: 0.8 }, { t: t1 + 0.25, o: 1, s: 1, e: 'back' }, { t: t2 - 0.1, o: 1 }, { t: t2, o: 0 }],
    inner: [0, 1, 2].map((i) => `<span class="bubble" data-base="" ${kf([0, 1, 2, 3, 4].flatMap((n) => [{ t: t1 + n * 0.3 + i * 0.1, y: 0 }, { t: t1 + n * 0.3 + i * 0.1 + 0.15, y: -6, e: 'out' }]).concat([{ t: t2, y: 0 }]))}></span>`).join('') })
  return [
    floorIn(T(0), 'hero', until),
    kicker(CX, 120, T(0.25), T(4.6), `${num(n)} · Connect · team chat & feed`, { light: true }),
    el({ x: CX, y: 200, cls: 'disp', style: 'font-size:66px;color:#fff', inner: words('Talk with the team. Share the wins.', T(0.35), { out: T(4.6) }) }),
    dots(330, 470, T(0.45), T(0.95)),
    el({ x: 560, y: 470, w: B1, k: join(focusIn(T(0.95), { dx: -60, s0: 1 }), focusOut(T(4.55))), inner: crop('team-hub', R.bubble1, B1, { radius: 22 }) }),
    dots(850, 680, T(1.45), T(1.95)),
    el({ x: 640, y: 680, w: B2, k: join(focusIn(T(1.95), { dx: 60, s0: 1 }), focusOut(T(4.55))), inner: crop('team-hub', R.bubble2, B2, { radius: 22 }) }),
    el({ x: 1390, y: 610, w: P, h: PH, k: join(focusIn(T(2.3), { dy: 120, s0: 1, b: 8 }), focusOut(T(4.55))), inner: crop('feed', R.post, P) }),
    el({ x: 1655, y: 790, w: 108, h: 108, style: 'border-radius:50%;background:#fff;display:grid;place-items:center;color:#e8508a;box-shadow:0 18px 40px -14px rgba(232,80,138,.8)', k: [{ t: T(3.15), o: 0, s: 0.3 }, { t: T(3.5), o: 1, s: 1, e: 'back' }, { t: T(4.5), o: 1 }, { t: T(4.8), o: 0 }], inner: `<svg width="52" height="52" viewBox="0 0 24 24" fill="#e8508a"><path d="M12 21s-7.5-4.6-10-9.3C.5 8.2 2.6 4.5 6.3 4.5c2.1 0 3.5 1.2 4.2 2.3h3c.7-1.1 2.1-2.3 4.2-2.3 3.7 0 5.8 3.7 4.3 7.2C19.5 16.4 12 21 12 21z"/></svg>` }) + ping(1655, 790, T(3.2), { size: 108, color: '#e8508a', n: 2 }),
  ]
}

/* ======================================================================================================== */
/* CV COACH · the analysis and its plan                                                                      */
/* ======================================================================================================== */
export function cvCoach(t0, { until = t0 + 4.9, n = 5 } = {}) {
  const T = (d) => t0 + d
  const SW = 560, s = SW / R.cvSteps[2], SH = Math.round(R.cvSteps[3] * s), sx = 1270, sy = 520
  const checks = [551, 585, 618, 652, 686].map((by, i) => { const [lx, ly] = at(R.cvSteps, SW, 552, by); return el({ x: sx - SW / 2 + lx, y: sy - SH / 2 + ly, w: 48, h: 48, style: 'border-radius:50%;background:var(--good);display:grid;place-items:center;color:#fff;box-shadow:0 0 0 6px var(--deep)', k: [{ t: T(0.75 + i * 0.28), o: 0, s: 0.4 }, { t: T(1.0 + i * 0.28), o: 1, s: 1, e: 'back' }, { t: T(2.35), o: 1 }, { t: T(2.6), o: 0 }], inner: icon('Check', 26, 3) }) }).join('')
  const HW = 1180, HH = Math.round(R.cvHero[3] * HW / R.cvHero[2])
  const matches = [['72%', 72, 'Secure Cloud Networking'], ['56%', 56, 'Observability with Grafana'], ['42%', 42, 'Kubernetes in Production']]
  return [
    layer({ cls: 'bg-night', style: iris(CX, CY, 1250), k: [{ t: T(-0.3), o: 1, k: 0 }, { t: T(0.35), k: 1, e: 'inout' }, { t: until - 0.001, o: 1 }, { t: until, o: 0, e: 'linear' }], inner: '<div class="hexgrid"></div><div class="glowball" style="width:900px;height:900px;left:120px;top:60px;background:radial-gradient(closest-side,rgba(47,123,246,.35),rgba(47,123,246,0))"></div>' }),
    kicker(CX, 112, T(0.3), T(4.6), `${num(n)} · CV coach`, { light: true }),
    el({ x: CX, y: 192, cls: 'disp', style: 'font-size:70px;color:#fff', inner: words('Upload a CV. Find your next step.', T(0.4), { out: T(4.6) }) }),
    // the product's CV mark, read by a scanning beam
    el({ x: 600, y: 560, w: 360, h: 360, k: join(focusIn(T(0.45), { s0: 0.8 }), [{ t: T(2.3), x: 0 }, { t: T(2.7), o: 0, x: -120, b: 10, e: 'inout' }]), inner: cvMark(360) + `<div class="a" data-base="" style="left:70px;width:200px;height:6px;border-radius:6px;background:linear-gradient(90deg,rgba(143,208,255,0),#bfe3ff,rgba(143,208,255,0));box-shadow:0 0 20px 6px rgba(95,178,255,.65)" ${kf([{ t: T(0.7), o: 0, y: 70 }, { t: T(0.8), o: 1 }, { t: T(1.5), y: 300, e: 'inout' }, { t: T(2.2), y: 70, e: 'inout' }, { t: T(2.3), o: 0 }])}></div>` }),
    el({ x: 600, y: 560, w: 470, h: 470, style: 'border-radius:50%;border:2px dashed rgba(143,208,255,.45)', k: [{ t: T(0.45), o: 0, s: 0.8, r: 0 }, { t: T(0.9), o: 1, s: 1 }, { t: T(2.3), r: 70, o: 1, e: 'linear' }, { t: T(2.7), o: 0, r: 90 }] }),
    el({ x: sx, y: sy, w: SW, h: SH, k: join(focusIn(T(0.55), { dx: 60, s0: 1 }), [{ t: T(2.3), o: 1 }, { t: T(2.65), o: 0, b: 8, e: 'inout' }]), inner: crop('cv-loading', R.cvSteps, SW, { radius: 18 }) }),
    checks,
    // the plan
    el({ x: CX, y: 545, w: HW, h: HH, k: join(focusIn(T(2.55), { dy: 60, s0: 0.95 }), focusOut(T(4.55), { b: 10 })), inner: crop('cv-results', R.cvHero, HW, { cls: 'night', radius: 26 }) }),
    matches.map(([, v, name], i) => el({ x: 560 + i * 400, y: 905, cls: 'stat night', style: 'min-width:360px', k: join(focusIn(T(2.95 + i * 0.15), { dy: 30 }), focusOut(T(4.55))), inner: `<b>${counter({ t0: T(3.05 + i * 0.15), t1: T(4.2 + i * 0.15), to: v, suf: '%' })}</b><small>${esc(name)}</small>` })).join(''),
  ]
}

/* ======================================================================================================== */
/* ANALYTICS · skills radar and the organisation's activity                                                  */
/* ======================================================================================================== */
export function analytics(t0, { until = t0 + 4.9, n = 6 } = {}) {
  const T = (d) => t0 + d
  const RW = 560, RHh = Math.round(R.radar[3] * RW / R.radar[2]), rx = 650, ry = 690
  const [cx, cy] = at(R.radar, RW, 522, 576)
  const AW = 660, AH = Math.round(R.weekly[3] * AW / R.weekly[2])
  const kpis = [[13, 0, '', 'skills tracked'], [48, 0, '%', 'average mastery'], [2, 0, '', 'above target'], [2, 0, '', 'with a certificate']]
  return [
    layer({ cls: 'bg-night', k: sceneK(T(-0.3), until, { inD: 0.3, cutOut: true }), inner: '<div class="hexgrid"></div><div class="glowball" style="width:1000px;height:800px;left:460px;top:260px;background:radial-gradient(closest-side,rgba(47,123,246,.28),rgba(47,123,246,0))"></div>' }),
    kicker(CX, 82, T(0.2), T(4.6), `${num(n)} · Skills & analytics`, { light: true }),
    el({ x: CX, y: 150, cls: 'disp', style: 'font-size:58px;color:#fff', inner: words('Skills you can see. Teams at a glance.', T(0.3), { out: T(4.6) }) }),
    kpis.map(([v, d, suf, label], i) => stat({ x: 420 + i * 360, y: 300, t0: T(0.45 + i * 0.1), t1: T(4.7), to: v, dec: d, suf, label, cls: 'night' })).join(''),
    // the radar opens from its own centre, then a beam sweeps it
    el({ x: rx, y: ry, w: RW, h: RHh, style: iris(cx, cy, 420), k: [{ t: T(0.8), o: 1, k: 0 }, { t: T(1.6), k: 1, e: 'inout' }, { t: T(4.5), o: 1 }, { t: T(4.85), o: 0, b: 8, e: 'inout' }], inner: crop('skills', R.radar, RW, { cls: 'night', radius: 22 }) }),
    el({ x: rx - RW / 2 + cx, y: ry - RHh / 2 + cy, w: 4, h: 4, base: 'translate(-50%,-50%)', k: [{ t: T(1.5), o: 0, r: -90 }, { t: T(1.6), o: 1 }, { t: T(3.2), r: 270, e: 'inout' }, { t: T(3.4), o: 0 }], inner: '<div style="position:absolute;left:0;top:-1px;width:190px;height:3px;background:linear-gradient(90deg,rgba(47,123,246,.9),rgba(47,123,246,0));transform-origin:0 50%;box-shadow:0 0 14px rgba(47,123,246,.8)"></div>' }),
    // weekly activity draws itself left → right
    el({ x: 1300, y: ry, w: AW, h: AH, style: wipe, k: [{ t: T(1.1), o: 1, k: 0 }, { t: T(2.4), k: 1, e: 'inout' }, { t: T(4.5), o: 1 }, { t: T(4.85), o: 0, b: 8, e: 'inout' }], inner: crop('org-panel', R.weekly, AW, { cls: 'night', radius: 22 }) }),
  ]
}

/* ======================================================================================================== */
/* GROW · the promotion checklist ticks, the approval lands                                                  */
/* ======================================================================================================== */
export function grow(t0, { until = t0 + 2.5, n = 7 } = {}) {
  const T = (d) => t0 + d
  const CW = 760, s = CW / R.checklist[2], CHh = Math.round(R.checklist[3] * s), cx0 = 700, cy0 = 590
  const rows = [[490, 554], [566, 631], [642, 707]].map(([y0, y1], i) => { const [l, t] = at(R.checklist, CW, 338, y0); return el({ x: cx0 - CW / 2 + l + 533 * s / 2, y: cy0 - CHh / 2 + t + (y1 - y0) * s / 2, w: 533 * s, h: (y1 - y0) * s, style: 'border-radius:18px;border:3px solid var(--good);box-shadow:0 0 0 6px rgba(20,163,107,.16),0 0 30px rgba(20,163,107,.35)', k: [{ t: T(0.55 + i * 0.3), o: 0, s: 1.06 }, { t: T(0.8 + i * 0.3), o: 1, s: 1, e: 'out' }, { t: until - 0.3, o: 1 }, { t: until, o: 0 }] }) }).join('')
  const HW = 520, hs = HW / R.history[2], HHh = Math.round(R.history[3] * hs), hx = 1440, hy = 430
  const [al, atp] = at(R.history, HW, R.approved[0], R.approved[1])
  return [
    floorIn(T(0), 'paper', until),
    kicker(CX, 92, T(0.2), until - 0.1, `${num(n)} · Grow · promotions`, {}),
    el({ x: CX, y: 160, cls: 'disp', style: 'font-size:58px;color:var(--ink)', inner: words('Every step counts toward your next role.', T(0.3), { out: until - 0.1 }) }),
    el({ x: cx0, y: cy0, w: CW, h: CHh, k: join(focusIn(T(0.25), { dy: 40, s0: 1 }), [{ t: until - 0.3, o: 1 }, { t: until, o: 0 }]), inner: crop('promotion', R.checklist, CW) }),
    rows,
    el({ x: hx, y: hy, w: HW, h: HHh, k: join(focusIn(T(0.45), { dx: 60, s0: 1 }), [{ t: until - 0.3, o: 1 }, { t: until, o: 0 }]), inner: crop('promotion', R.history, HW) }),
    el({ x: hx - HW / 2 + al + R.approved[2] * hs / 2, y: hy - HHh / 2 + atp + R.approved[3] * hs / 2, w: R.approved[2] * hs + 16, h: R.approved[3] * hs + 16, style: 'border-radius:99px;border:3px solid var(--good);box-shadow:0 0 0 7px rgba(20,163,107,.16),0 0 30px rgba(20,163,107,.5)', k: [{ t: T(1.5), o: 0, s: 1.6 }, { t: T(1.9), o: 1, s: 1, e: 'back' }, { t: until - 0.3, o: 1 }, { t: until, o: 0 }] }),
  ]
}

/* ======================================================================================================== */
/* CONVERGE · everything in one honeycomb, then into the mark                                               */
/* ======================================================================================================== */
export function converge(t0, { until = t0 + 4.9 } = {}) {
  const T = (d) => t0 + d
  const r = 150, hw = Math.sqrt(3) * r, hh = r * 2, cx = 1180, cy = 560
  const tiles = [['cv-results', R.cvRing], ['formations-catalog', R.kubeCover], ['formation-drawer', R.ring63], ['skills', R.radar], ['promotion', R.ring34], ['org-panel', R.bars], ['formations-catalog', R.grafanaCover]]
  const cells = honeycomb(1, r + 6)
  const from = [[-700, -500], [700, -480], [760, 420], [-640, 520], [40, 640], [-820, 60], [820, -40]]
  const html = cells.map((c, i) => {
    const [shot, rr] = tiles[i], [fx, fy] = from[i]
    const k = [{ t: T(0.1 + i * 0.07), o: 0, x: c.x + fx, y: c.y + fy, r: (i % 2 ? 18 : -18), s: 0.7, b: 10 },
      { t: T(0.95 + i * 0.07), o: 1, x: c.x, y: c.y, r: 0, s: 1, b: 0, e: 'out5' }, { t: T(3.3), x: c.x, y: c.y, s: 1 }, { t: T(4.3), x: 0, y: 0, s: 0.12, o: 0, b: 8, e: 'in' }]
    return el({ x: cx, y: cy, w: hw, h: hh, k, inner: `<div class="hex" style="width:${hw}px;height:${hh}px;background:#fff;padding:6px"><div class="hex" style="width:${hw - 12}px;height:${hh - 12}px;overflow:hidden">${cover(shot, rr, hw - 12, hh - 12)}</div></div>` })
  }).join('')
  return [
    layer({ cls: 'bg-paper', k: sceneK(T(-0.05), until, { inD: 0.05, cutOut: true }), inner: '<div class="hexgrid"></div>' }),
    el({ x: cx, y: cy, w: 1, h: 1, k: [{ t: T(3.2), r: 0 }, { t: T(4.3), r: 30, e: 'in' }], cls: 'p3', inner: '' }),
    html,
    ...['Learn.', 'Prove.', 'Grow.'].map((wd, i) => el({ x: 130, y: 380 + i * 150, base: 'translate(0,-50%)', cls: 'disp', style: `font-size:132px;${i === 2 ? '' : 'color:var(--ink)'}`, inner: words(wd, T(0.55 + i * 0.7), { out: T(4.0), cls: i === 2 ? 'grad' : '' }) })),
    layer({ style: 'background:#dff1ff', k: [{ t: T(4.25), o: 0 }, { t: T(4.38), o: 0.7, e: 'linear' }, { t: T(4.8), o: 0, e: 'out' }] }),
  ]
}

/* ======================================================================================================== */
/* TECH · under the hood (portfolio cut)                                                                     */
/* ======================================================================================================== */
export function tech(t0, { until = t0 + 4.9 } = {}) {
  const T = (d) => t0 + d
  const nodes = [['Monitor', 'Browser', 'React 19 · Vite 8 · Three.js', 420], ['Server', 'API', 'Express 5 on Node.js', 960], ['Database', 'Database', 'MySQL 8 · 23 tables', 1500]]
  return [
    layer({ cls: 'bg-night', k: sceneK(T(-0.3), until, { inD: 0.3, cutOut: true }), inner: '<div class="hexgrid"></div>' }),
    kicker(CX, 112, T(0.2), T(4.6), 'Under the hood', { light: true }),
    el({ x: CX, y: 192, cls: 'disp', style: 'font-size:70px;color:#fff', inner: words('Full stack, tested end to end.', T(0.3), { out: T(4.6) }) }),
    nodes.map(([ic, title, line, x], i) => el({ x, y: 470, cls: 'lt night', style: 'padding:22px 30px 22px 22px', k: join(focusIn(T(0.5 + i * 0.18), { dy: 30, s0: 1 }), focusOut(T(4.55))), inner: `<span class="ix">${icon(ic, 30, 2.1)}</span><div><small>${i === 0 ? 'React SPA' : i === 1 ? 'REST · JWT · SSE' : 'MariaDB / MySQL'}</small><b>${title}</b><span>${line}</span></div>` })).join(''),
    `<svg class="a" data-base="" style="left:0;top:0" width="1920" height="1080"><path d="M610 470 H770" stroke="#8fd0ff" stroke-width="3" fill="none" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" data-draw='${JSON.stringify({ t0: T(1.0), t1: T(1.5) })}'/><path d="M1150 470 H1310" stroke="#8fd0ff" stroke-width="3" fill="none" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" data-draw='${JSON.stringify({ t0: T(1.2), t1: T(1.7) })}'/><path d="M960 400 C960 330, 420 330, 420 400" stroke="#bfe3ff" stroke-width="3" fill="none" stroke-linecap="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" data-draw='${JSON.stringify({ t0: T(1.6), t1: T(2.3) })}'/></svg>`,
    el({ x: 690, y: 330, cls: 'mono', style: 'font-size:14px;color:#bfe3ff', k: focusIn(T(2.0), { b: 4 }), inner: 'Live push · Server-Sent Events' }),
    [[35, 'end-to-end API tests'], [70, 'API route handlers'], [23, 'database tables']].map(([v, l], i) => stat({ x: 520 + i * 440, y: 740, t0: T(1.9 + i * 0.15), t1: T(4.7), to: v, label: l, cls: 'night' })).join(''),
    el({ x: CX, y: 920, cls: 'chip glass', style: 'font-size:20px', k: join(focusIn(T(2.6), { dy: 16 }), focusOut(T(4.55))), inner: `${icon('Globe', 20)} Live on Vercel · Render · Aiven` }),
  ]
}

/* ======================================================================================================== */
/* BRAND · the end card                                                                                      */
/* ======================================================================================================== */
export function brand(t0, { until = t0 + 7.3, contact = false } = {}) {
  const T = (d) => t0 + d
  return [
    layer({ cls: 'bg-hero', style: iris(1180, 560, 1500), k: [{ t: T(-0.1), o: 1, k: 0 }, { t: T(0.5), k: 1, e: 'inout' }, { t: until, o: 1 }], inner: '<div class="hexgrid"></div><div class="glowball" style="width:1300px;height:1300px;left:-380px;top:-620px;background:radial-gradient(closest-side,rgba(255,255,255,.28),rgba(255,255,255,0))"></div>' }),
    el({ x: CX, y: CY + 20, cls: 'ghost light', style: 'font-size:560px;-webkit-text-stroke-width:3px;-webkit-text-stroke-color:rgba(255,255,255,.09)', k: [{ t: T(0.3), o: 0, s: 1.1 }, { t: T(1.2), o: 1, s: 1 }, { t: until, s: 0.96, e: 'linear' }], inner: 'HIVE' }),
    hexOutline(CX, 452, 560, T(0.25), 0.9, { stroke: 'rgba(255,255,255,.32)', k: [{ t: T(0.25), o: 1, s: 1, r: 30 }, { t: until, s: 1.04, r: 33, e: 'linear' }] }),
    el({ x: CX, y: 245, k: [{ t: T(0.2), o: 0, s: 0.6, b: 8 }, { t: T(0.6), o: 1, s: 1, b: 0, e: 'out5' }, { t: until, s: 1.03, e: 'linear' }], inner: emblem(190, { tone: 'white', spin: [T(0.25), 0.95] }) }),
    el({ x: CX, y: 462, k: [{ t: T(0.3), s: 1 }, { t: until, s: 1.03, e: 'linear' }], inner: `<span class="wordmark" style="font-size:176px;color:#fff">${chars('Career', T(0.3), { stagger: 0.04 })}${chars('Hive', T(0.54), { stagger: 0.04, cls: 'grad-light' })}</span>` }),
    el({ x: CX, y: 630, cls: 'disp', style: 'font-size:66px;color:#fff;font-weight:700;letter-spacing:-.03em', inner: words('Grow on purpose.', T(1.0)) }),
    el({ x: CX, y: 698, style: 'font-size:26px;color:rgba(255,255,255,.85);white-space:nowrap', k: focusIn(T(1.4), { dy: 12 }), inner: 'A modern career-growth workspace.' }),
    el({ x: CX, y: 795, cls: 'chip glass', style: 'font-size:24px;padding:14px 26px', k: focusIn(T(1.9), { dy: 16 }), inner: `${icon('Globe', 22)} career-hive-ebon.vercel.app` }),
    contact ? el({ x: CX, y: 870, style: 'display:flex;gap:14px', k: focusIn(T(2.2), { dy: 14 }), inner: `<span class="chip glass" style="font-size:19px">${logo('github', 19)} @HMMOUHIB</span><span class="chip glass" style="font-size:19px">${icon('Mail', 19)} hamzaouimoh54@gmail.com</span>` }) : '',
    el({ x: CX, y: 975, cls: 'mono', style: 'font-size:17px;color:rgba(255,255,255,.78)', k: focusIn(T(2.5), { b: 4, s0: 1 }), inner: 'Mouhib Hamzaoui · 2026' }),
    el({ x: CX, y: 1040, cls: 'credit', k: focusIn(T(2.7), { b: 3, s0: 1 }), inner: esc(EMBLEM_CREDIT) }),
  ]
}
