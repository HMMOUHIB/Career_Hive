// The CareerHive cuts: master (16:9, 60 s), portfolio (16:9, 48 s), teaser (16:9, 25.5 s), social (9:16, 24 s), plus still
// graphics. Each cut carries its soundtrack cues (presentation/source/audio.mjs) and the time of its poster frame.
import { R, analytics, brand, connect, converge, cvCoach, dashboardStory, grow, learn, live, opening, prove, tech } from './sequences.mjs'
import { chars, counter, cover, crop, cursor, el, EMBLEM_CREDIT, emblem, esc, focusIn, focusOut, hexPath, honeycomb, icon, iris, join, kf, layer, ping, scene, sceneK, stat, tag, words, wordmark } from './toolkit.mjs'

/** A sequence in its scene window: sequence(fn, t0, until) = fn(t0, { until }), shown only while it plays. */
const seq = (fn, t0, until, opt = {}) => scene(fn(t0, { until, ...opt }), until)

/* ---------------- voice-over: [start (s), line] per cut; spoken by voice.mjs, mixed under the picture by render.mjs ---------------- */
// Lines sit on their scenes; the problem words and "Learn. Prove. Grow." are spoken as the words land on screen.
const VO_MASTER = [
  [0.35, 'Every career starts with one step.'],
  [4.95, 'Your career. Your next move.'],
  [7.3, 'Spreadsheets. Email threads. Side chats.'], [10.3, 'Growth gets lost in between.'],
  [12.35, 'CareerHive puts every step in one place.'],
  [16.95, 'Learn with formations and real course content.'], [19.85, 'Progress follows what you finish.'],
  [21.95, 'HR forwards it. Your manager decides.'],
  [26.75, 'Everyone hears it the moment it moves.'], [29.3, 'Live. No refresh needed.'],
  [31.5, 'Talk with your team, and share the wins.'],
  [36.35, 'Upload a CV.'], [37.6, 'The coach reads it, and finds your next step.'],
  [41.1, 'See your skills, and your team, at a glance.'],
  [45.85, 'Every step counts toward your next role.'],
  [48.55, 'Learn. Prove. Grow.'],
  [53.25, 'CareerHive. Grow on purpose.'],
]
const VO = {
  master: VO_MASTER,
  portfolio: [...VO_MASTER.filter(([t]) => t < 26.4),
    [26.75, 'Upload a CV.'], [28.0, 'The coach reads it, and finds your next step.'],
    [31.5, 'See your skills, and your team, at a glance.'],
    [36.05, 'Under the hood: React, Express, MySQL.'], [39.1, 'Live updates, tested end to end.'],
    [41.35, 'CareerHive. Grow on purpose.']],
  teaser: [[0.35, 'Every career starts with one step.'], [5.15, 'HR forwards it. Your manager decides.'],
    [9.95, 'Everyone hears it the moment it moves.'], [14.75, 'Upload a CV.'], [16.0, 'The coach finds your next step.'],
    [19.65, 'CareerHive. Grow on purpose.']],
  social: [[1.35, 'CareerHive.'], [2.75, 'Your career. Your next move.'], [5.05, 'Learn with real courses.'],
    [7.5, 'Your manager decides.'], [9.85, 'Hear it the moment it moves.'], [12.25, 'Your CV, your next step.'],
    [14.65, 'See your skills grow.'], [17.05, 'Talk with your team.'], [19.6, 'CareerHive. Grow on purpose.']],
}

/* ---------------------------------------- 16:9 master ---------------------------------------- */
export function master() {
  const layers = [
    seq(opening, 0, 4.9), seq(dashboardStory, 4.8, 17.0), seq(learn, 16.8, 22.1), seq(prove, 21.6, 26.7), seq(live, 26.4, 31.7),
    seq(connect, 31.2, 36.4), seq(cvCoach, 36.0, 41.0), seq(analytics, 40.8, 46.1), seq(grow, 45.6, 48.1), seq(converge, 48.0, 53.35),
    seq(brand, 52.8, 60), tag(4.6, 52.8, { x: 1920 - 48, y: 1080 - 40 }),
  ]
  return {
    w: 1920, h: 1080, length: 60, title: 'CareerHive — master', layers, fadeOut: [59.25, 60], poster: 58.2, vo: VO.master,
    cues: {
      riserTo: 3.0, impacts: [3.0, 53.1], bells: [53.1],
      whooshes: [3.95, 7.2, 12.0, 16.6, 21.6, 26.2, 31.2, 35.8, 40.8, 45.6, 48.0, 52.7],
      softWhooshes: [9.9, 18.75, 38.5, 49.0, 50.0], clicks: [23.6], pops: [23.68, 27.45, 28.05, 28.65, 29.25, 34.45, 47.3],
      ticks: [0.95, 1.11, 1.27, 1.6, 1.7, 1.8, 7.5, 8.3, 9.1, 36.75, 37.03, 37.31, 37.59, 37.87, 46.15, 46.45, 46.75],
      gaps: [[2.86, 3.0], [7.06, 7.2], [11.86, 12.0], [35.86, 36.0], [52.95, 53.1]],
      bassFrom: 12.0, bassTo: 52.8, arpFrom: 3.0, arpTo: 56.0, kickFrom: 12.0, kickTo: 52.8, shakerFrom: 16.8, shakerTo: 45.6,
    },
  }
}

/* ---------------------------------------- 16:9 portfolio ---------------------------------------- */
export function portfolio() {
  const layers = [
    seq(opening, 0, 4.9), seq(dashboardStory, 4.8, 17.0), seq(learn, 16.8, 22.1), seq(prove, 21.6, 26.8), seq(cvCoach, 26.4, 31.4, { n: 3 }),
    seq(analytics, 31.2, 36.3, { n: 4 }), seq(tech, 36.0, 41.35), seq(brand, 40.8, 48, { contact: true }), tag(4.6, 36.0, { x: 1920 - 48, y: 1080 - 40 }),
  ]
  return {
    w: 1920, h: 1080, length: 48, title: 'CareerHive — portfolio', layers, fadeOut: [47.25, 48], poster: 46.4, vo: VO.portfolio,
    cues: {
      riserTo: 3.0, impacts: [3.0, 41.1], bells: [41.1],
      whooshes: [3.95, 7.2, 12.0, 16.6, 21.6, 26.2, 31.2, 36.0, 40.7], softWhooshes: [9.9, 18.75, 28.9], clicks: [23.6], pops: [23.68],
      ticks: [0.95, 1.11, 1.27, 1.6, 1.7, 1.8, 7.5, 8.3, 9.1, 27.15, 27.43, 27.71, 27.99, 28.27, 37.5, 37.7],
      gaps: [[2.86, 3.0], [7.06, 7.2], [11.86, 12.0], [26.26, 26.4], [40.95, 41.1]],
      bassFrom: 12.0, bassTo: 40.8, arpFrom: 3.0, arpTo: 44.4, kickFrom: 12.0, kickTo: 40.8, shakerFrom: 16.8, shakerTo: 36.0,
    },
  }
}

/* ---------------------------------------- 16:9 teaser ---------------------------------------- */
// 25.5 s: the signal and the wordmark, three product proofs (decide · hear it live · find the next step), the end card.
export function teaser() {
  const layers = [
    seq(opening, 0, 4.9), seq(prove, 4.8, 9.9, { n: 1 }), seq(live, 9.6, 14.8, { n: 2 }), seq(cvCoach, 14.4, 19.75, { n: 3 }),
    seq(brand, 19.2, 25.5), tag(5.2, 19.2, { x: 1920 - 48, y: 1080 - 40 }),
  ]
  return {
    w: 1920, h: 1080, length: 25.5, title: 'CareerHive — teaser', layers, fadeOut: [24.75, 25.5], poster: 24.2, vo: VO.teaser,
    cues: {
      riserTo: 3.0, impacts: [3.0, 19.5], bells: [19.5],
      whooshes: [3.95, 4.8, 9.6, 14.2, 19.1], softWhooshes: [16.9], clicks: [6.8], pops: [6.88, 10.65, 11.25, 11.85, 12.45],
      ticks: [0.95, 1.11, 1.27, 1.6, 1.7, 1.8, 15.15, 15.43, 15.71, 15.99, 16.27], gaps: [[2.86, 3.0], [19.35, 19.5]],
      bassFrom: 4.8, bassTo: 19.2, arpFrom: 3.0, arpTo: 23.0, kickFrom: 4.8, kickTo: 19.2, shakerFrom: 9.6, shakerTo: 14.4,
    },
  }
}

/* ---------------------------------------- 9:16 social ---------------------------------------- */
const SW = 1080, SH = 1920, SX = SW / 2
const sbg = (kind, k, extra = '') => layer({ cls: `bg-${kind}`, k, inner: `<div class="hexgrid"></div>${extra}` })
const sfloor = (t, kind, until) => layer({ cls: `bg-${kind}`, style: 'transform-origin:50% 100%', k: [{ t: t - 0.001, o: 0, sy: 0 }, { t, o: 1 }, { t: t + 0.45, sy: 1, e: 'expo' }, { t: until - 0.001, o: 1 }, { t: until, o: 0, e: 'linear' }], inner: '<div class="hexgrid"></div>' })
/** Corner hexagons on coloured beats: CareerHive's answer to the reference's light shards. */
const corners = (t0, t1, light = true) => [[SW - 60, 150, 150, 0], [70, SH - 170, 190, 1]].map(([x, y, r, i]) => el({ x, y, w: r * 2 + 6, h: r * 2 + 6, k: [{ t: t0, o: 0, s: 0.6, r: i ? -30 : 30 }, { t: t0 + 0.5, o: 1, s: 1, r: 0 }, { t: t1 - 0.25, o: 1, r: i ? 8 : -8, e: 'linear' }, { t: t1, o: 0 }], inner: `<svg width="${r * 2 + 6}" height="${r * 2 + 6}" viewBox="${-r - 3} ${-r - 3} ${r * 2 + 6} ${r * 2 + 6}"><path d="${hexPath(r)}" fill="${light ? 'rgba(255,255,255,.1)' : 'rgba(47,123,246,.08)'}" stroke="${light ? 'rgba(255,255,255,.55)' : 'rgba(47,123,246,.35)'}" stroke-width="3"/></svg>` })).join('')
/** One beat of the reference grammar: a small lead-in, a huge keyword, a vertical ghost, the hero element. */
function beat({ t0, t1, light, lead, word, ghostWord, grad = false }) {
  return [
    el({ x: SX, y: 330, cls: 'mono', style: `font-size:24px;color:${light ? 'rgba(255,255,255,.85)' : 'var(--blue)'}`, k: join(focusIn(t0 + 0.15, { b: 6, s0: 1, dy: 10 }), focusOut(t1 - 0.3, { b: 4 })), inner: esc(lead) }),
    el({ x: SX, y: 470, cls: 'disp', style: `font-size:210px;${grad ? '' : `color:${light ? '#fff' : 'var(--ink)'}`}`, inner: words(word, t0 + 0.25, { out: t1, cls: grad ? 'grad' : '', d: 0.7 }) }),
    el({ x: 100, y: 1100, cls: `ghost ${light ? 'light' : ''}`, style: 'font-size:300px', base: 'translate(-50%,-50%) rotate(-90deg)', k: [{ t: t0 + 0.1, o: 0, y: 80 }, { t: t0 + 0.7, o: 1, y: 0 }, { t: t1 - 0.3, o: 1, y: -40, e: 'linear' }, { t: t1, o: 0 }], inner: esc(ghostWord) }),
  ].join('')
}
export function social() {
  const L = [], S = (until, ...parts) => L.push(scene(parts, until))
  // B1 · the signal, the hive, the wordmark
  const cells = honeycomb(1, 92)
  S(2.5, sbg('black', sceneK(0, 2.5, { cut: true, cutOut: true })),
    layer({ cls: 'bg-night', k: [{ t: 0.3, o: 0 }, { t: 1.2, o: 1 }, { t: 2.5, o: 1 }, { t: 2.51, o: 0 }], inner: '<div class="hexgrid"></div>' }),
    el({ x: SX, y: 900, w: 16, h: 16, style: 'border-radius:50%;background:#e8f6ff;box-shadow:0 0 18px 6px rgba(143,208,255,.9),0 0 60px 20px rgba(47,123,246,.55)', k: [{ t: 0.05, o: 0, s: 0 }, { t: 0.3, o: 1, s: 1.8 }, { t: 0.5, s: 1 }, { t: 1.05, o: 1 }, { t: 1.25, o: 0, s: 0.2 }] }),
    cells.map((c, i) => el({ x: SX, y: 900, w: 168, h: 190, k: [{ t: 0.35 + i * 0.05, o: 0, s: 0.3, x: c.x, y: c.y }, { t: 0.7 + i * 0.05, o: 1, s: 1, e: 'back' }, { t: 1.0 }, { t: 1.25, o: 0, s: 0.15, x: c.x * 0.1, y: c.y * 0.1, e: 'in' }], inner: `<svg width="168" height="190" viewBox="-84 -95 168 190"><path d="${hexPath(90)}" fill="rgba(47,123,246,.08)" stroke="rgba(143,208,255,.6)" stroke-width="2"/></svg>` })).join(''),
    layer({ style: 'background:#dff1ff', k: [{ t: 1.18, o: 0 }, { t: 1.25, o: 0.55, e: 'linear' }, { t: 1.6, o: 0, e: 'out' }] }),
    el({ x: SX, y: 760, k: [{ t: 1.15, o: 0, s: 0.55, b: 10 }, { t: 1.5, o: 1, s: 1, b: 0, e: 'out5' }, { t: 2.1 }, { t: 2.45, s: 2.6, o: 0, b: 12, y: -224, e: 'in' }], inner: emblem(180, { tone: 'frost', spin: [1.2, 0.95] }) }),
    el({ x: SX, y: 940, k: [{ t: 1.25, s: 1 }, { t: 2.1 }, { t: 2.45, s: 2.6, o: 0, b: 12, y: 64, e: 'in' }], inner: `<span class="wordmark" style="font-size:128px;color:#fff">${chars('Career', 1.25, { stagger: 0.03 })}${chars('Hive', 1.43, { stagger: 0.03, cls: 'grad-light' })}</span>` }),
    el({ x: SX, y: 1050, cls: 'mono', style: 'font-size:22px;color:rgba(207,232,255,.85)', k: [{ t: 1.5, o: 0, b: 6 }, { t: 1.9, o: 1, b: 0 }, { t: 2.15, o: 1 }, { t: 2.4, o: 0, s: 1.5, b: 6, y: 75, e: 'in' }], inner: 'Grow on purpose' }))
  // B2 · the promise
  S(5.3, sbg('paper', [{ t: 2.1, o: 1, k: 0 }, { t: 2.5, k: 1, e: 'inout' }, { t: 5.29, o: 1 }, { t: 5.3, o: 0, e: 'linear' }]).replace('style=""', `style="${iris(SX, 900, 1400)}"`),
    el({ x: SX, y: 400, cls: 'mono', style: 'font-size:24px;color:var(--blue)', k: join(focusIn(2.6, { b: 6, s0: 1 }), focusOut(4.5)), inner: 'CareerHive' }),
    el({ x: SX, y: 560, cls: 'disp', style: 'font-size:118px;color:var(--ink)', inner: words('YOUR CAREER.', 2.65, { out: 4.75 }) }),
    el({ x: SX, y: 690, cls: 'disp', style: 'font-size:118px', inner: words('YOUR NEXT', 3.0, { out: 4.75, cls: 'grad' }) }),
    el({ x: SX, y: 820, cls: 'disp', style: 'font-size:118px', inner: words('MOVE.', 3.2, { out: 4.75, cls: 'grad' }) }),
    el({ x: SX, y: 1370, w: 980, k: [{ t: 2.7, o: 0, y: 260, rx: 30, b: 10 }, { t: 3.5, o: 1, y: 0, rx: 14, b: 0, e: 'out5' }, { t: 4.6, rx: 10, y: -20, e: 'linear' }, { t: 4.85, o: 0 }], inner: crop('org-panel', R.dash, 980) }))
  // B3 · Learn
  const kw = 660, kh = Math.round(R.kubeCard[3] * kw / R.kubeCard[2])
  S(7.5, sfloor(4.8, 'hero', 7.5), beat({ t0: 4.8, t1: 7.2, light: true, lead: 'Formations & courses', word: 'Learn.', ghostWord: 'LEARN' }), corners(4.8, 7.2),
    el({ x: SX, y: 1130, w: kw, h: kh, k: join(focusIn(5.1, { dy: 140, s0: 0.9 }), [{ t: 5.9, y: 0 }, { t: 6.4, y: -24, e: 'out' }], focusOut(6.95)), inner: crop('formations-catalog', R.kubeCard, kw, { radius: 26 }) }),
    stat({ x: SX, y: 1600, t0: 5.6, t1: 7.2, to: 63, suf: '%', label: 'course progress' }))
  // B4 · Prove (hexagonal iris out of the card)
  const FW = 1000, FH = Math.round(R.reviewForm[3] * FW / R.reviewForm[2])
  const bx = SX - FW / 2 + (R.approveBtn[0] - R.reviewForm[0]) * FW / R.reviewForm[2], by = 1150 - FH / 2 + (R.approveBtn[1] - R.reviewForm[1]) * FW / R.reviewForm[2]
  S(10.1, layer({ cls: 'bg-paper', style: iris(SX, 1130, 1500), k: [{ t: 7.0, o: 1, k: 0 }, { t: 7.45, k: 1, e: 'inout' }, { t: 10.09, o: 1 }, { t: 10.1, o: 0, e: 'linear' }], inner: '<div class="hexgrid"></div>' }),
    beat({ t0: 7.2, t1: 9.6, light: false, lead: 'HR forwards · manager decides', word: 'Prove.', ghostWord: 'PROVE', grad: true }),
    el({ x: SX, y: 1150, w: FW, h: FH, k: join(focusIn(7.45, { dy: 80, s0: 0.95 }), focusOut(9.35)), inner: crop('reviews', R.reviewForm, FW) }),
    el({ x: bx, y: by, cls: 'chip good', style: 'font-size:22px', k: [{ t: 8.45, o: 0, s: 0.5 }, { t: 8.8, o: 1, s: 1, e: 'back' }, { t: 9.3, o: 1 }, { t: 9.55, o: 0 }], inner: `${icon('Check', 22, 3)} Approved` }),
    cursor([[7.8, 1010, 1790], [8.3, bx + 6, by + 4], [8.9, bx + 40, by + 120]], [8.4], { show: [7.8, 9.3] }),
    // the approval tracker fills as the manager clicks (the product's Submitted → HR review → Manager → Approved)
    `<div class="a" data-base="" style="left:180px;top:1484px;width:720px;height:4px;border-radius:4px;background:rgba(15,35,75,.1)" ${kf(join(focusIn(7.6, { b: 4 }), focusOut(9.35)))}></div>`,
    `<div class="a" data-base="scaleX(var(--k,0))" style="left:180px;top:1484px;width:720px;height:4px;border-radius:4px;background:var(--good);transform-origin:0 50%" ${kf([{ t: 7.7, k: 0 }, { t: 8.0, k: 0.333 }, { t: 8.4, k: 0.666, e: 'inout' }, { t: 8.7, k: 1 }, { t: 9.35, o: 1 }, { t: 9.65, o: 0 }])}></div>`,
    [['Send', 'Submitted', 7.9], ['ClipboardCheck', 'HR review', 8.1], ['UserCheck', 'Manager', 8.4], ['CircleCheck', 'Approved', 8.55]].map(([ic, label, t], i) => el({ x: 180 + i * 240, y: 1510, w: 160, h: 110, k: join(focusIn(7.65 + i * 0.06, { dy: 16, b: 6 }), focusOut(9.35)),
      inner: `<div class="node" style="width:160px"><div class="dot" style="position:relative">${icon(ic, 26)}<div class="dot ok a" data-base="" style="left:-2px;top:-2px" ${kf([{ t: t - 0.01, o: 0, s: 0.6 }, { t: t + 0.3, o: 1, s: 1, e: 'back' }])}>${icon(ic, 26)}</div></div><b>${label}</b></div>` })).join(''))
  // B5 · Live
  const TW = 900
  S(12.35, sfloor(9.6, 'hero', 12.35), beat({ t0: 9.6, t1: 12.0, light: true, lead: 'Notifications in real time', word: 'Live.', ghostWord: 'LIVE' }), corners(9.6, 12.0),
    R.toasts.slice(0, 3).map((r, i) => { const h = Math.round(r[3] * TW / r[2]), y = [1040, 1240, 1470][i], t = 10.05 + i * 0.45; return el({ x: SX, y, w: TW, h, k: [{ t, o: 0, x: 300, b: 12 }, { t: t + 0.5, o: 1, x: 0, b: 0, e: 'out5' }, { t: 11.7, o: 1 }, { t: 11.95, o: 0 }], inner: crop('notifications', r, TW, { radius: 24 }) }) + ping(SX - TW / 2 + 80, y, t + 0.35, { size: 90, n: 1, color: '#fff' }) }).join(''))
  // B6 · the CV coach (night, hexagonal iris)
  const HW = 1000, HH = Math.round(R.cvHero[3] * HW / R.cvHero[2])
  S(14.9, layer({ cls: 'bg-night', style: iris(SX, 1060, 1500), k: [{ t: 11.8, o: 1, k: 0 }, { t: 12.3, k: 1, e: 'inout' }, { t: 14.89, o: 1 }, { t: 14.9, o: 0, e: 'linear' }], inner: '<div class="hexgrid"></div>' }),
    beat({ t0: 12.0, t1: 14.4, light: true, lead: 'Finds your next step', word: 'Your CV.', ghostWord: 'COACH' }), corners(12.0, 14.4),
    el({ x: SX, y: 1060, w: HW, h: HH, k: join(focusIn(12.3, { dy: 80, s0: 0.94 }), focusOut(14.15)), inner: crop('cv-results', R.cvHero, HW, { cls: 'night', radius: 26 }) }),
    [72, 56, 42].map((v, i) => el({ x: 220 + i * 320, y: 1420, cls: 'stat night', style: 'padding:18px 22px', k: join(focusIn(12.7 + i * 0.12, { dy: 30 }), focusOut(14.15)), inner: `<b style="font-size:56px">${counter({ t0: 12.8 + i * 0.12, t1: 13.9, to: v, suf: '%' })}</b><small>match #${i + 1}</small>` })).join(''))
  // B7 · Grow (skills radar)
  const RW = 800, RHh = Math.round(R.radar[3] * RW / R.radar[2]), rcx = (522 - R.radar[0]) * RW / R.radar[2], rcy = (576 - R.radar[1]) * RW / R.radar[2]
  S(17.3, sfloor(14.4, 'paper', 17.3), beat({ t0: 14.4, t1: 16.8, light: false, lead: 'Skills you can see', word: 'Grow.', ghostWord: 'GROW', grad: true }),
    el({ x: SX, y: 1180, w: RW, h: RHh, style: iris(rcx, rcy, 560), k: [{ t: 14.75, o: 1, k: 0 }, { t: 15.55, k: 1, e: 'inout' }, { t: 16.5, o: 1 }, { t: 16.78, o: 0 }], inner: crop('skills', R.radar, RW, { radius: 26 }) }))
  // B8 · Together (chat & feed)
  const B1 = 900, B2 = 760
  S(19.65, sfloor(16.8, 'hero', 19.65), beat({ t0: 16.8, t1: 19.2, light: true, lead: 'Team chat & feed', word: 'Together.', ghostWord: 'TEAM' }), corners(16.8, 19.2),
    el({ x: SX, y: 1080, w: B1, k: join(focusIn(17.15, { dx: -80, s0: 1 }), focusOut(18.95)), inner: crop('team-hub', R.bubble1, B1, { radius: 30 }) }),
    el({ x: SX + 60, y: 1390, w: B2, k: join(focusIn(17.75, { dx: 80, s0: 1 }), focusOut(18.95)), inner: crop('team-hub', R.bubble2, B2, { radius: 30 }) }),
    el({ x: 860, y: 1600, w: 130, h: 130, style: 'border-radius:50%;background:#fff;display:grid;place-items:center;box-shadow:0 18px 40px -14px rgba(232,80,138,.8)', k: [{ t: 18.25, o: 0, s: 0.3 }, { t: 18.6, o: 1, s: 1, e: 'back' }, { t: 18.95, o: 1 }, { t: 19.2, o: 0 }], inner: '<svg width="64" height="64" viewBox="0 0 24 24" fill="#e8508a"><path d="M12 21s-7.5-4.6-10-9.3C.5 8.2 2.6 4.5 6.3 4.5c2.1 0 3.5 1.2 4.2 2.3h3c.7-1.1 2.1-2.3 4.2-2.3 3.7 0 5.8 3.7 4.3 7.2C19.5 16.4 12 21 12 21z"/></svg>' }) + ping(860, 1600, 18.3, { size: 130, color: '#fff', n: 2 }))
  // B9 · the end card
  S(24, layer({ cls: 'bg-hero', style: iris(SX, 900, 1500), k: [{ t: 19.1, o: 1, k: 0 }, { t: 19.6, k: 1, e: 'inout' }, { t: 24, o: 1 }], inner: '<div class="hexgrid"></div>' }), corners(19.2, 24.5),
    el({ x: SX, y: 880, w: 760, h: 860, k: [{ t: 19.3, o: 1, s: 1 }, { t: 24, s: 1.04, e: 'linear' }], inner: `<svg width="760" height="860" viewBox="-380 -430 760 860"><path d="${hexPath(400)}" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="3" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" data-draw='${JSON.stringify({ t0: 19.35, t1: 20.15 })}'/></svg>` }),
    el({ x: SX, y: 655, k: [{ t: 19.35, o: 0, s: 0.6, b: 8 }, { t: 19.75, o: 1, s: 1, b: 0, e: 'out5' }, { t: 24, s: 1.03, e: 'linear' }], inner: emblem(175, { tone: 'white', spin: [19.4, 0.95] }) }),
    el({ x: SX, y: 850, inner: `<span class="wordmark" style="font-size:136px;color:#fff">${chars('Career', 19.5, { stagger: 0.035 })}${chars('Hive', 19.71, { stagger: 0.035, cls: 'grad-light' })}</span>` }),
    el({ x: SX, y: 985, cls: 'disp', style: 'font-size:60px;color:#fff;font-weight:700;letter-spacing:-.03em', inner: words('Grow on purpose.', 20.1) }),
    el({ x: SX, y: 1130, cls: 'chip glass', style: 'font-size:28px;padding:16px 28px', k: focusIn(20.5, { dy: 16 }), inner: `${icon('Globe', 26)} career-hive-ebon.vercel.app` }),
    el({ x: SX, y: 1720, cls: 'mono', style: 'font-size:22px;color:rgba(255,255,255,.8)', k: focusIn(20.9, { b: 4, s0: 1 }), inner: 'Mouhib Hamzaoui · 2026' }),
    el({ x: SX, y: 1790, cls: 'credit', k: focusIn(21.1, { b: 3, s0: 1 }), inner: esc(EMBLEM_CREDIT) }))
  return {
    w: SW, h: SH, length: 24, title: 'CareerHive — social', layers: [...L, tag(2.6, 19.1, { x: SX, y: SH - 64, center: true })], fadeOut: [23.3, 24], poster: 22.6, vo: VO.social,
    cues: {
      riserTo: 1.25, impacts: [1.25, 19.5], bells: [19.5],
      whooshes: [2.3, 4.8, 7.2, 9.6, 12.0, 14.4, 16.8, 19.2], softWhooshes: [], clicks: [8.4], pops: [8.48, 10.4, 10.85, 11.3, 18.3],
      ticks: [0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 5.8], gaps: [[1.12, 1.25], [4.68, 4.8], [11.88, 12.0], [19.35, 19.5]],
      bassFrom: 4.8, bassTo: 19.2, arpFrom: 1.25, arpTo: 22.0, kickFrom: 4.8, kickTo: 19.2, shakerFrom: 7.2, shakerTo: 16.8,
    },
  }
}

/* ---------------------------------------- stills ---------------------------------------- */
const hexDeco = (x, y, r, light = true) => el({ x, y, w: r * 2 + 6, h: r * 2 + 6, inner: `<svg width="${r * 2 + 6}" height="${r * 2 + 6}" viewBox="${-r - 3} ${-r - 3} ${r * 2 + 6} ${r * 2 + 6}"><path d="${hexPath(r)}" fill="${light ? 'rgba(255,255,255,.08)' : 'rgba(47,123,246,.06)'}" stroke="${light ? 'rgba(255,255,255,.5)' : 'rgba(47,123,246,.3)'}" stroke-width="3"/></svg>` })
/** The horizontal logo lockup: the white emblem beside the wordmark. */
const lockup = (size) => `<span class="lockup" style="gap:${Math.round(size * 0.2)}px">${emblem(Math.round(size * 1.08))}${wordmark(size, { light: true })}</span>`
const staticStat = (x, y, v, label, cls = 'night solid') => el({ x, y, cls: `stat ${cls}`, inner: `<b>${v}</b><small>${esc(label)}</small>` })
/** YouTube/LinkedIn thumbnail (1280×720), portrait poster (1080×1350), square (1080×1080), story cover (1080×1920). */
export function still(kind) {
  if (kind === 'thumbnail') return { w: 1280, h: 720, title: 'CareerHive — thumbnail', layers: [
    layer({ cls: 'bg-hero', inner: '<div class="hexgrid"></div>' }), hexDeco(1180, 90, 120), hexDeco(80, 650, 150),
    el({ x: 940, y: 430, w: 620, k: [{ t: 0, rx: 12, ry: -18, s: 1 }], cls: 'p3', inner: crop('org-panel', R.dash, 620) }),
    staticStat(600, 560, '97', 'enrollments'), staticStat(1150, 600, '90', 'cv strength'), tag(-1, 1e6, { x: 1280 - 30, y: 720 - 30 }), el({ x: 30, y: 720 - 30, base: 'translate(0,-50%)', cls: 'credit', inner: esc(EMBLEM_CREDIT) }),
    el({ x: 70, y: 92, base: 'translate(0,-50%)', inner: emblem(100) }),
    el({ x: 70, y: 222, base: 'translate(0,-50%)', inner: wordmark(102, { light: true }) }),
    el({ x: 74, y: 312, base: 'translate(0,-50%)', cls: 'disp', style: 'font-size:48px;color:#fff;font-weight:700;letter-spacing:-.03em', inner: 'Grow on purpose.' }),
    el({ x: 74, y: 395, base: 'translate(0,-50%)', cls: 'chip glass', style: 'font-size:20px', inner: `${icon('Play', 18)} Product film · live app` }),
  ] }
  const tall = kind === 'story', square = kind === 'square'
  const w = 1080, h = tall ? 1920 : square ? 1080 : 1350
  const top = tall ? 360 : square ? 150 : 190
  return { w, h, title: `CareerHive — ${kind}`, layers: [
    layer({ cls: 'bg-hero', inner: '<div class="hexgrid"></div>' }), hexDeco(w - 70, 120, 130), hexDeco(80, h - 140, 170),
    el({ x: w / 2, y: top, inner: lockup(square ? 112 : 124) }),
    el({ x: w / 2, y: top + (square ? 110 : 125), cls: 'disp', style: `font-size:${square ? 48 : 56}px;color:#fff;font-weight:700;letter-spacing:-.03em`, inner: 'Grow on purpose.' }),
    el({ x: w / 2, y: (square ? 640 : tall ? 1080 : 800), w: square ? 840 : 920, k: [{ t: 0, rx: 14, s: 1 }], cls: 'p3', inner: crop('org-panel', R.dash, square ? 840 : 920) }),
    staticStat(square ? 230 : 230, square ? 900 : tall ? 1520 : 1150, '72%', 'best formation match'),
    staticStat(square ? 850 : 850, square ? 900 : tall ? 1520 : 1150, '90', 'cv strength'),
    tall ? el({ x: w / 2, y: 1740, cls: 'chip glass', style: 'font-size:28px;padding:16px 28px', inner: `${icon('Globe', 26)} career-hive-ebon.vercel.app` }) : '',
    tag(-1, 1e6, tall ? { x: w / 2, y: h - 76, center: true } : { x: w - 36, y: h - 36 }),
    el({ x: tall ? w / 2 : 36, y: h - (tall ? 38 : 36), base: tall ? 'translate(-50%,-50%)' : 'translate(0,-50%)', cls: 'credit', inner: esc(EMBLEM_CREDIT) }),
    !tall && !square ? el({ x: w / 2, y: 1270, cls: 'mono', style: 'font-size:20px;color:rgba(255,255,255,.85)', inner: 'career-hive-ebon.vercel.app' }) : '',
  ] }
}
