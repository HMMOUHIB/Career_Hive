import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef } from 'react'

/**
 * One animated canvas per section, each after a well-known site's hero, kept faint so the content stays in front:
 *  dashboard → mesh gradient (Stripe) · profile → grid spotlight that follows the cursor (Linear)
 *  promotion → light beams rising up the columns (Vercel) · formations → dotted globe with flying arcs (GitHub)
 *  skills → flowing ribbons (Siri) · hub → drifting bokeh (Framer) · teams → dot matrix with ripples
 *  reviews → aurora curtains (Apple) · people and the feed → network of connected points · someone's profile → spotlight
 */
const MODE_BY_PATH = [
  [/^\/(profile|u\/)/, 'spotlight'], [/^\/promotion/, 'beams'], [/^\/formations/, 'globe'], [/^\/skills/, 'ribbons'],
  [/^\/team$/, 'bokeh'], [/^\/teams/, 'dots'], [/^\/reviews/, 'curtains'], [/^\/(people|feed)/, 'network'], [/.*/, 'mesh'],
]

const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#f2554a'
const hexA = (hex, a) => {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}
const R = (a, b) => a + Math.random() * (b - a)
const TAU = Math.PI * 2

/* ---------------- scenes: each returns { step(ctx, w, h, t, dt, colors, pointer) } ---------------- */
const scenes = {
  // Stripe: soft colour fields drifting inside a slanted band across the top
  mesh() {
    const fields = [
      { x: 0.15, y: 0.25, fx: 1 / 13000, fy: 1 / 17000, p: 0, c: 'accent', r: 0.6 },
      { x: 0.55, y: 0.1, fx: 1 / 16000, fy: 1 / 12000, p: 2, c: 'orb', r: 0.5 },
      { x: 0.9, y: 0.35, fx: 1 / 14000, fy: 1 / 19000, p: 4, c: 'accent2', r: 0.5 },
      { x: 0.35, y: 0.45, fx: 1 / 20000, fy: 1 / 15000, p: 1, c: 'accent2', r: 0.35 },
    ]
    return {
      step(ctx, W, H, t, dt, c) {
        const S = Math.max(W, H)
        ctx.save()
        if (c.dark) ctx.globalCompositeOperation = 'lighter'
        for (const f of fields) {
          const x = W * (f.x + Math.sin(t * f.fx * TAU + f.p) * 0.14), y = H * (f.y + Math.cos(t * f.fy * TAU + f.p) * 0.12)
          const g = ctx.createRadialGradient(x, y, 0, x, y, S * f.r)
          g.addColorStop(0, hexA(c[f.c], c.dark ? 0.24 : 0.22)); g.addColorStop(1, hexA(c[f.c], 0))
          ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
        }
        // keep it to a slanted band: fade out below a line that falls from right to left
        ctx.globalCompositeOperation = 'destination-in'
        ctx.translate(W / 2, H * 0.55); ctx.rotate(-Math.atan2(H * 0.3, W))
        const m = ctx.createLinearGradient(0, -H * 0.35, 0, 0)
        m.addColorStop(0, '#000'); m.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = m; ctx.fillRect(-W * 1.5, -H * 3, W * 3, H * 3)
        ctx.restore()
      },
    }
  },

  // Linear: a faint grid that lights up around the cursor, under a soft glow from above
  spotlight(w, h) {
    const gap = 56, spot = { x: w * 0.6, y: h * 0.3 }
    return {
      step(ctx, W, H, t, dt, c, p) {
        const tx = p.active ? p.x : W * (0.5 + Math.sin(t / 7000) * 0.3), ty = p.active ? p.y : H * (0.35 + Math.cos(t / 9000) * 0.15)
        const k = 1 - Math.pow(0.9, dt / 16) // eases after the cursor
        spot.x += (tx - spot.x) * k; spot.y += (ty - spot.y) * k
        const top = ctx.createRadialGradient(W / 2, -H * 0.1, 0, W / 2, -H * 0.1, H * 0.8)
        top.addColorStop(0, hexA(c.accent, c.dark ? 0.16 : 0.12)); top.addColorStop(1, hexA(c.accent, 0))
        ctx.fillStyle = top; ctx.fillRect(0, 0, W, H)
        ctx.beginPath()
        for (let x = gap / 2; x < W; x += gap) { ctx.moveTo(Math.round(x) + 0.5, 0); ctx.lineTo(Math.round(x) + 0.5, H) }
        for (let y = gap / 2; y < H; y += gap) { ctx.moveTo(0, Math.round(y) + 0.5); ctx.lineTo(W, Math.round(y) + 0.5) }
        ctx.lineWidth = 1
        ctx.strokeStyle = hexA(c.text, c.dark ? 0.04 : 0.05); ctx.stroke()
        const lit = ctx.createRadialGradient(spot.x, spot.y, 0, spot.x, spot.y, 240)
        lit.addColorStop(0, hexA(c.accent, 0.45)); lit.addColorStop(1, hexA(c.accent, 0))
        ctx.strokeStyle = lit; ctx.stroke() // the same grid again, lit only near the spot
        const glow = ctx.createRadialGradient(spot.x, spot.y, 0, spot.x, spot.y, 240)
        glow.addColorStop(0, hexA(c.accent, 0.07)); glow.addColorStop(1, hexA(c.accent, 0))
        ctx.fillStyle = glow; ctx.fillRect(spot.x - 240, spot.y - 240, 480, 480)
      },
    }
  },

  // Vercel: thin beams of light rising up faint column lines, over a glow at the bottom
  beams(w, h) {
    const cols = Math.max(6, Math.round(w / 110))
    const make = (first) => ({ col: Math.floor(R(1, cols)), y: first ? R(-h * 0.2, h * 1.4) : h + R(40, h * 0.8), len: R(90, 220), v: R(0.9, 1.8), a: R(0.5, 1) })
    const beams = Array.from({ length: Math.round(cols * 0.6) }, () => make(true))
    return {
      step(ctx, W, H, t, dt, c) {
        const cw = W / cols, at = (col) => Math.round(col * cw) + 0.5
        ctx.beginPath()
        for (let i = 1; i < cols; i++) { ctx.moveTo(at(i), 0); ctx.lineTo(at(i), H) }
        ctx.lineWidth = 1; ctx.strokeStyle = hexA(c.text, c.dark ? 0.04 : 0.05); ctx.stroke()
        const base = ctx.createLinearGradient(0, H, 0, H * 0.55)
        base.addColorStop(0, hexA(c.accent, c.dark ? 0.14 : 0.1)); base.addColorStop(1, hexA(c.accent, 0))
        ctx.fillStyle = base; ctx.fillRect(0, H * 0.55, W, H * 0.45)
        if (c.dark) ctx.globalCompositeOperation = 'lighter'
        ctx.lineWidth = 1.5
        for (const b of beams) {
          b.y -= b.v * dt * 0.06
          if (b.y + b.len < 0) Object.assign(b, make())
          const x = at(b.col)
          const g = ctx.createLinearGradient(0, b.y + b.len, 0, b.y)
          g.addColorStop(0, hexA(c.accent, 0)); g.addColorStop(0.85, hexA(c.accent2, 0.55 * b.a)); g.addColorStop(1, hexA(c.accent2, 0.9 * b.a))
          ctx.strokeStyle = g; ctx.beginPath(); ctx.moveTo(x, b.y + b.len); ctx.lineTo(x, b.y); ctx.stroke()
          ctx.fillStyle = hexA(c.accent2, 0.18 * b.a); ctx.beginPath(); ctx.arc(x, b.y, 5, 0, TAU); ctx.fill()
        }
        ctx.globalCompositeOperation = 'source-over'
      },
    }
  },

  // GitHub: a slowly turning dotted globe in the corner, with arcs flying between points
  globe() {
    const N = 700, pts = []
    for (let i = 0; i < N; i++) { // evenly spread (Fibonacci sphere)
      const y = 1 - (2 * (i + 0.5)) / N, r = Math.sqrt(1 - y * y), a = i * 2.39996
      pts.push([Math.cos(a) * r, y, Math.sin(a) * r])
    }
    const ct = Math.cos(0.4), st = Math.sin(0.4), arcs = []
    const slerp = (a, b, u, om) => {
      const s = Math.sin(om), k1 = Math.sin((1 - u) * om) / s, k2 = Math.sin(u * om) / s
      const lift = 1 + Math.sin(Math.PI * u) * 0.18 * om // longer hops fly higher
      return [(a[0] * k1 + b[0] * k2) * lift, (a[1] * k1 + b[1] * k2) * lift, (a[2] * k1 + b[2] * k2) * lift]
    }
    return {
      step(ctx, W, H, t, dt, c) {
        const r0 = Math.min(W, H) * 0.42, cx = W * 0.78, cy = H * 0.66, rot = t / 14000
        const cr = Math.cos(rot), sr = Math.sin(rot)
        const proj = ([x, y, z]) => {
          const x1 = x * cr + z * sr, z1 = z * cr - x * sr
          return [cx + x1 * r0, cy + (y * ct - z1 * st) * r0, y * st + z1 * ct] // z > 0 faces us
        }
        const halo = ctx.createRadialGradient(cx, cy, r0 * 0.6, cx, cy, r0 * 1.25)
        halo.addColorStop(0, hexA(c.accent, 0)); halo.addColorStop(0.8, hexA(c.accent, c.dark ? 0.1 : 0.08)); halo.addColorStop(1, hexA(c.accent, 0))
        ctx.fillStyle = halo; ctx.fillRect(cx - r0 * 1.3, cy - r0 * 1.3, r0 * 2.6, r0 * 2.6)
        ctx.fillStyle = c.dark ? hexA(c.text, 0.55) : hexA(c.accent, 0.7)
        for (const q of pts) {
          const [x, y, z] = proj(q)
          if (z < 0) continue
          ctx.globalAlpha = 0.2 + z * 0.8
          ctx.fillRect(x - 0.9, y - 0.9, 1.8, 1.8)
        }
        ctx.globalAlpha = 1
        // keep four arcs in flight, each between two points on the side facing us
        for (let tries = 0; arcs.length < 4 && tries < 30; tries++) {
          const a = pts[Math.floor(R(0, N))], b = pts[Math.floor(R(0, N))]
          const om = Math.acos(Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))
          if (proj(a)[2] > 0.3 && proj(b)[2] > 0.3 && om > 0.5 && om < 1.6) arcs.push({ a, b, om, t0: t + R(0, 2400), dur: R(2400, 3600) })
        }
        ctx.lineWidth = 1.4; ctx.lineCap = 'round'
        for (let i = arcs.length - 1; i >= 0; i--) {
          const k = arcs[i], s = (t - k.t0) / k.dur
          if (s < 0) continue
          if (s > 1.45) { arcs.splice(i, 1); continue }
          const u1 = Math.min(1, s), u0 = Math.max(0, s - 0.45), fade = s > 1 ? 1 - (s - 1) / 0.45 : 1
          ctx.strokeStyle = hexA(c.accent2, 0.8 * fade); ctx.beginPath()
          let pen = false
          for (let j = 0; j <= 24; j++) {
            const [x, y, z] = proj(slerp(k.a, k.b, u0 + ((u1 - u0) * j) / 24, k.om))
            if (z < -0.05) { pen = false; continue }
            if (pen) ctx.lineTo(x, y); else ctx.moveTo(x, y)
            pen = true
          }
          ctx.stroke()
          const [ax, ay] = proj(k.a)
          ctx.fillStyle = hexA(c.accent2, 0.9 * fade); ctx.beginPath(); ctx.arc(ax, ay, 2, 0, TAU); ctx.fill()
          if (s >= 1) { // landing ping
            const [bx, by] = proj(k.b)
            ctx.strokeStyle = hexA(c.accent2, fade * 0.8); ctx.beginPath(); ctx.arc(bx, by, 2 + (s - 1) * 30, 0, TAU); ctx.stroke()
          }
        }
      },
    }
  },

  // Siri waves: three translucent ribbons twisting across the middle
  ribbons() {
    const bands = [
      { y: 0.42, amp: 60, f: 0.0022, sp: 1 / 5200, th: 60, c: ['accent', 'accent2'], p: 0 },
      { y: 0.5, amp: 80, f: 0.0016, sp: -1 / 6800, th: 44, c: ['orb', 'accent'], p: 2 },
      { y: 0.58, amp: 50, f: 0.0028, sp: 1 / 4400, th: 32, c: ['accent2', 'orb'], p: 4 },
    ]
    return {
      step(ctx, W, H, t, dt, c) {
        if (c.dark) ctx.globalCompositeOperation = 'lighter'
        for (const b of bands) {
          const ph = t * b.sp * TAU + b.p
          const mid = (x) => H * b.y + Math.sin(x * b.f + ph) * b.amp + Math.sin(x * b.f * 0.47 - ph * 0.6 + b.p) * b.amp * 0.5
          const half = (x) => b.th * (0.2 + 0.8 * Math.abs(Math.sin(x * b.f * 0.8 + ph * 0.5)))
          const shade = (a) => {
            const g = ctx.createLinearGradient(0, 0, W, 0)
            g.addColorStop(0, hexA(c[b.c[0]], 0)); g.addColorStop(0.3, hexA(c[b.c[0]], a)); g.addColorStop(0.7, hexA(c[b.c[1]], a)); g.addColorStop(1, hexA(c[b.c[1]], 0))
            return g
          }
          ctx.beginPath()
          for (let x = 0; x <= W + 10; x += 10) { const y = mid(x) - half(x); if (x) ctx.lineTo(x, y); else ctx.moveTo(x, y) }
          for (let x = Math.ceil(W / 10) * 10 + 10; x >= 0; x -= 10) ctx.lineTo(x, mid(x) + half(x))
          ctx.closePath(); ctx.fillStyle = shade(c.dark ? 0.14 : 0.12); ctx.fill()
          ctx.beginPath()
          for (let x = 0; x <= W + 10; x += 10) { const y = mid(x) - half(x); if (x) ctx.lineTo(x, y); else ctx.moveTo(x, y) }
          ctx.lineWidth = 1; ctx.strokeStyle = shade(0.45); ctx.stroke() // a fine bright edge
        }
        ctx.globalCompositeOperation = 'source-over'
      },
    }
  },

  // Framer: large soft out-of-focus lights drifting, shifting a little with the cursor (nearer ones more)
  bokeh(w, h) {
    const lights = Array.from({ length: 12 }, (_, i) => ({ x: R(0, w), y: R(0, h), r: R(40, 140), vx: R(-0.12, 0.12), vy: R(-0.1, 0.1), d: R(0.2, 1), c: ['accent', 'accent2', 'orb'][i % 3] }))
    const off = { x: 0, y: 0 }
    return {
      step(ctx, W, H, t, dt, c, p) {
        const k = 1 - Math.pow(0.95, dt / 16)
        off.x += ((p.active ? (p.x - W / 2) * -0.04 : 0) - off.x) * k
        off.y += ((p.active ? (p.y - H / 2) * -0.04 : 0) - off.y) * k
        if (c.dark) ctx.globalCompositeOperation = 'lighter'
        for (const L of lights) {
          L.x += L.vx * dt * 0.06; L.y += L.vy * dt * 0.06
          if (L.x < -L.r) L.x = W + L.r; else if (L.x > W + L.r) L.x = -L.r
          if (L.y < -L.r) L.y = H + L.r; else if (L.y > H + L.r) L.y = -L.r
          const x = L.x + off.x * L.d, y = L.y + off.y * L.d
          const a = (c.dark ? 0.12 : 0.1) * (0.8 + Math.sin(t / 3000 + L.r) * 0.2)
          const g = ctx.createRadialGradient(x, y, 0, x, y, L.r)
          g.addColorStop(0, hexA(c[L.c], a * 0.6)); g.addColorStop(0.85, hexA(c[L.c], a)); g.addColorStop(1, hexA(c[L.c], 0))
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, L.r, 0, TAU); ctx.fill()
        }
        ctx.globalCompositeOperation = 'source-over'
      },
    }
  },

  // dot matrix: a quiet field of dots; ripples roll across it now and then, and dots near the cursor light up
  dots() {
    const gap = 26, life = 6000, ripples = []
    let next = 0
    return {
      step(ctx, W, H, t, dt, c, p) {
        if (t > next) { ripples.push({ x: R(W * 0.2, W * 0.9), y: R(H * 0.15, H * 0.85), t0: t }); next = t + R(3200, 5200) }
        while (ripples.length && t - ripples[0].t0 > life) ripples.shift()
        ctx.fillStyle = hexA(c.text, c.dark ? 0.14 : 0.17)
        const hot = []
        for (let x = gap / 2; x < W; x += gap) for (let y = gap / 2; y < H; y += gap) {
          let e = 0
          for (const r of ripples) {
            const age = t - r.t0, band = 1 - Math.abs(Math.hypot(x - r.x, y - r.y) - age * 0.22) / 46
            if (band > 0) e = Math.max(e, band * (1 - age / life))
          }
          if (p.active) { const d = Math.hypot(x - p.x, y - p.y); if (d < 120) e = Math.max(e, (1 - d / 120) * 0.8) }
          if (e > 0.02) hot.push(x, y, e); else ctx.fillRect(x - 0.9, y - 0.9, 1.8, 1.8)
        }
        for (let i = 0; i < hot.length; i += 3) {
          const e = hot[i + 2]
          ctx.fillStyle = hexA(c.accent, 0.15 + e * 0.6); ctx.beginPath(); ctx.arc(hot[i], hot[i + 1], 0.9 + e * 1.6, 0, TAU); ctx.fill()
        }
      },
    }
  },

  // Apple / northern lights: soft curtains of colour hanging from the top, their lower edges swaying
  curtains() {
    const layers = [
      { y: 0.3, h: 0.2, c: 'accent', f: 0.0035, sp: 1 / 9000, p: 0 },
      { y: 0.22, h: 0.16, c: 'orb', f: 0.0026, sp: -1 / 12000, p: 2 },
      { y: 0.38, h: 0.18, c: 'accent2', f: 0.0042, sp: 1 / 7000, p: 4 },
    ]
    return {
      step(ctx, W, H, t, dt, c) {
        if (c.dark) ctx.globalCompositeOperation = 'lighter'
        for (const L of layers) {
          const ph = t * L.sp * TAU + L.p
          const edge = (x) => H * L.y + Math.sin(x * L.f + ph) * 36 + Math.sin(x * L.f * 2.7 - ph * 1.5) * 12
          const g = ctx.createLinearGradient(0, H * (L.y - L.h), 0, H * L.y + 48)
          g.addColorStop(0, hexA(c[L.c], 0)); g.addColorStop(1, hexA(c[L.c], c.dark ? 0.16 : 0.11))
          ctx.beginPath(); ctx.moveTo(0, 0)
          for (let x = 0; x <= W + 12; x += 12) ctx.lineTo(x, edge(x))
          ctx.lineTo(W + 12, 0); ctx.closePath()
          ctx.fillStyle = g; ctx.fill()
          ctx.beginPath() // a soft glow along the lower edge
          for (let x = 0; x <= W + 12; x += 12) { if (x) ctx.lineTo(x, edge(x)); else ctx.moveTo(x, edge(x)) }
          ctx.strokeStyle = hexA(c[L.c], 0.04); ctx.lineWidth = 16; ctx.stroke()
          ctx.strokeStyle = hexA(c[L.c], 0.08); ctx.lineWidth = 4; ctx.stroke()
        }
        ctx.globalCompositeOperation = 'source-over'
      },
    }
  },

  // a slow network of points, linked when close; the cursor draws nearby points in a little
  network(w, h) {
    const pts = Array.from({ length: Math.round((w * h) / 22000) }, () => ({ x: R(0, w), y: R(0, h), vx: R(-0.15, 0.15), vy: R(-0.15, 0.15), r: R(1, 2.2) }))
    return {
      step(ctx, W, H, t, dt, c, p) {
        for (const a of pts) {
          a.x += a.vx * dt * 0.06; a.y += a.vy * dt * 0.06
          if (a.x < 0 || a.x > W) a.vx *= -1
          if (a.y < 0 || a.y > H) a.vy *= -1
          if (p.active) { const dx = p.x - a.x, dy = p.y - a.y; if (Math.hypot(dx, dy) < 160) { a.x += dx * 0.002; a.y += dy * 0.002 } }
        }
        ctx.lineWidth = 0.7
        for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i], b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y)
          if (d < 120) { ctx.strokeStyle = hexA(c.accent, (1 - d / 120) * 0.28); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke() }
        }
        pts.forEach((a, i) => {
          ctx.fillStyle = hexA(i % 9 === 0 ? c.accent2 : c.text, i % 9 === 0 ? 0.85 : 0.35)
          ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, TAU); ctx.fill()
        })
      },
    }
  },
}

function Scene({ mode, theme }) {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const colors = {
      accent: css('--accent'), accent2: css('--accent-2'), orb: css('--orb-b'), text: css('--text'), bg: css('--frame'),
      dark: theme === 'ember',
    }
    const pointer = { x: 0, y: 0, active: false }
    let W = 0, H = 0, scene, raf, last = performance.now(), start = last
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    const resize = () => {
      const r = canvas.parentElement.getBoundingClientRect()
      W = r.width; H = r.height
      canvas.width = W * dpr; canvas.height = H * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      scene = scenes[mode](W, H)
    }
    resize()
    const ro = new ResizeObserver(resize); ro.observe(canvas.parentElement)
    const onMove = (e) => { const r = canvas.getBoundingClientRect(); pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top; pointer.active = true }
    window.addEventListener('pointermove', onMove)
    const frame = (now) => {
      const dt = Math.min(64, now - last)
      if (dt >= 24 || reduce) { // ~40 fps is plenty for ambience
        last = now
        ctx.clearRect(0, 0, W, H)
        scene.step(ctx, W, H, now - start, dt, colors, pointer)
      }
      if (!reduce) raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    const vis = () => { cancelAnimationFrame(raf); if (!document.hidden && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame) } }
    document.addEventListener('visibilitychange', vis)
    return () => { cancelAnimationFrame(raf); ro.disconnect(); window.removeEventListener('pointermove', onMove); document.removeEventListener('visibilitychange', vis) }
  }, [mode, theme])
  return <canvas ref={ref} className="section-canvas" aria-hidden="true" />
}

export default function SectionBackground({ pathname, theme }) {
  const mode = MODE_BY_PATH.find(([re]) => re.test(pathname))[1]
  return (
    <div className="section-bg" data-mode={mode}>
      <AnimatePresence>
        <motion.div key={mode + theme} className="section-layer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.9 }}>
          <Scene mode={mode} theme={theme} />
        </motion.div>
      </AnimatePresence>
      <div className="section-grain" />
    </div>
  )
}
